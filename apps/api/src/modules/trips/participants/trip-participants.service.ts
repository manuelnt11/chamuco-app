import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import {
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { users } from '@/modules/users/schema/users.schema';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import type { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';
import type { ParticipantResponseDto } from './dto/participant-response.dto';
import type { PendingParticipantResponseDto } from './dto/pending-participant-response.dto';
import type { MyParticipationResponseDto } from './dto/my-participation-response.dto';
import type { MyTripInvitationResponseDto } from './dto/my-trip-invitation-response.dto';

const ORGANIZER_ROLES = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER] as const;
const ACTIVE_STATUSES = [TripParticipantStatus.ACCEPTED, TripParticipantStatus.CONFIRMED] as const;

@Injectable()
export class TripParticipantsService {
  private readonly logger = new Logger(TripParticipantsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly assetResolver: AssetResolverService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Remove / Leave ───────────────────────────────────────────────────────────

  async removeParticipant(
    tripId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    await this.assertTripExists(tripId);

    const targetParticipation = await this.findParticipantOrThrow(tripId, targetUserId);

    if (requestingUserId === targetUserId) {
      // Self: withdraw pending or cancel active participation
      if (
        targetParticipation.status === TripParticipantStatus.INVITED ||
        targetParticipation.status === TripParticipantStatus.PENDING_REQUEST
      ) {
        await this.db
          .delete(tripParticipants)
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)),
          );
        return;
      }

      if (
        ACTIVE_STATUSES.includes(targetParticipation.status as (typeof ACTIVE_STATUSES)[number])
      ) {
        await this.assertNotSoleOrganizer(tripId, targetUserId);
        await this.db
          .delete(tripParticipants)
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)),
          );
        return;
      }

      throw new ConflictException('No active participation to leave');
    }

    // Organizer removing another participant
    const requesterParticipation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, requestingUserId),
        eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
        inArray(tripParticipants.role, [...ORGANIZER_ROLES]),
      ),
    });

    if (!requesterParticipation) {
      throw new ForbiddenException('Only trip organizers can remove participants');
    }

    if (!ACTIVE_STATUSES.includes(targetParticipation.status as (typeof ACTIVE_STATUSES)[number])) {
      throw new ConflictException('Target user is not an active participant');
    }

    // Only ORGANIZER can remove another ORGANIZER
    if (
      targetParticipation.role === TripRole.ORGANIZER &&
      requesterParticipation.role !== TripRole.ORGANIZER
    ) {
      throw new ForbiddenException('Only the trip organizer can remove another organizer');
    }

    await this.assertNotSoleOrganizer(tripId, targetUserId);

    await this.db
      .delete(tripParticipants)
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));

    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: { name: true },
    });
    await this.notifications
      .notify(
        targetUserId,
        NotificationType.TRIP_PARTICIPANT_REMOVED,
        { tripId, tripName: trip?.name ?? '' },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) => {
        this.logger.error('Failed to send TRIP_PARTICIPANT_REMOVED notification', err);
      });
  }

  // ─── Role management ──────────────────────────────────────────────────────────

  async updateParticipantRole(
    tripId: string,
    targetUserId: string,
    dto: UpdateParticipantRoleDto,
    requestingUserId: string,
  ): Promise<void> {
    const requesterParticipation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, requestingUserId),
        eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
        eq(tripParticipants.role, TripRole.ORGANIZER),
      ),
    });

    if (!requesterParticipation) {
      throw new ForbiddenException('Only the trip organizer can update participant roles');
    }

    const targetParticipation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, targetUserId),
        inArray(tripParticipants.status, [...ACTIVE_STATUSES]),
      ),
    });
    if (!targetParticipation) throw new NotFoundException('Active participant not found');

    if (targetUserId === requestingUserId) {
      throw new ConflictException('Cannot update your own role');
    }

    if (dto.role === TripRole.ORGANIZER) {
      if (targetParticipation.role === TripRole.ORGANIZER) {
        throw new ConflictException('Target is already the trip organizer');
      }
      // Transfer ownership: current ORGANIZER becomes CO_ORGANIZER
      await this.db.transaction(async (trx) => {
        await trx
          .update(tripParticipants)
          .set({ role: TripRole.ORGANIZER, updatedAt: new Date() })
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)),
          );
        await trx
          .update(tripParticipants)
          .set({ role: TripRole.CO_ORGANIZER, updatedAt: new Date() })
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, requestingUserId)),
          );
      });
      return;
    }

    await this.assertNotSoleOrganizer(tripId, targetUserId);

    await this.db
      .update(tripParticipants)
      .set({ role: dto.role, updatedAt: new Date() })
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));

    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: { name: true },
    });
    await this.notifications
      .notify(
        targetUserId,
        NotificationType.TRIP_ROLE_CHANGED,
        { tripId, tripName: trip?.name ?? '' },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) => {
        this.logger.error('Failed to send TRIP_ROLE_CHANGED notification', err);
      });
  }

  // ─── Confirmation toggle ──────────────────────────────────────────────────────

  async toggleParticipantConfirmation(
    tripId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    await this.assertTripOrganizer(tripId, requestingUserId);

    const targetParticipation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, targetUserId),
        inArray(tripParticipants.status, [...ACTIVE_STATUSES]),
      ),
    });
    if (!targetParticipation) throw new NotFoundException('Active participant not found');
    if (targetParticipation.role === TripRole.ORGANIZER)
      throw new ForbiddenException('Cannot toggle confirmation for the trip organizer');

    const now = new Date();
    const isConfirmed = targetParticipation.status === TripParticipantStatus.CONFIRMED;
    await this.db
      .update(tripParticipants)
      .set({
        status: isConfirmed ? TripParticipantStatus.ACCEPTED : TripParticipantStatus.CONFIRMED,
        confirmedAt: isConfirmed ? null : now,
        updatedAt: now,
      })
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));
  }

  // ─── My participation ─────────────────────────────────────────────────────────

  async getMyParticipation(tripId: string, userId: string): Promise<MyParticipationResponseDto> {
    await this.assertTripExists(tripId);

    const participation = await this.db.query.tripParticipants.findFirst({
      where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)),
    });

    if (!participation) throw new NotFoundException('Participation record not found');

    return {
      status: participation.status as TripParticipantStatus,
      role: participation.role as TripRole,
      isTraveler: participation.isTraveler,
    };
  }

  async listMyInvitations(userId: string): Promise<MyTripInvitationResponseDto[]> {
    const rows = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.userId, userId),
        eq(tripParticipants.status, TripParticipantStatus.INVITED),
      ),
    });

    if (rows.length === 0) return [];

    const tripIds = rows.map((r) => r.tripId);
    const tripRows = await this.db.query.trips.findMany({
      where: inArray(trips.id, tripIds),
    });

    const coverIds = tripRows.map((t) => t.cover).filter((id): id is string => id !== null);
    const coverAssets =
      coverIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, coverIds) })
        : [];
    const assetMap = new Map(coverAssets.map((a) => [a.id, a]));
    const tripMap = new Map(tripRows.map((t) => [t.id, t]));

    return Promise.all(
      rows
        .filter((r) => tripMap.has(r.tripId))
        .map(async (participation) => {
          const trip = tripMap.get(participation.tripId)!;
          const coverRow = trip.cover ? (assetMap.get(trip.cover) ?? null) : null;
          const resolvedCover = coverRow
            ? await this.assetResolver.resolve(assetRowToAsset(coverRow))
            : null;

          return {
            trip: { id: trip.id, name: trip.name, coverUrl: resolvedCover?.url ?? null },
            initiatedAt: participation.initiatedAt.toISOString(),
          };
        }),
    );
  }

  // ─── List endpoints ───────────────────────────────────────────────────────────

  async listActiveParticipants(
    tripId: string,
    requestingUserId: string,
  ): Promise<ParticipantResponseDto[]> {
    await this.assertActiveParticipant(tripId, requestingUserId);

    const rows = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.tripId, tripId),
        inArray(tripParticipants.status, [...ACTIVE_STATUSES]),
      ),
    });

    const userIds = rows.map((r) => r.userId);
    if (userIds.length === 0) return [];

    const userRows = await this.db.query.users.findMany({ where: inArray(users.id, userIds) });
    const userMap = new Map(userRows.map((u) => [u.id, u]));
    const avatarUrlMap = await this.batchResolveAvatarUrls(userRows);

    return rows.map((participation) => {
      const user = userMap.get(participation.userId);
      if (!user) throw new NotFoundException(`User ${participation.userId} not found`);

      return {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: avatarUrlMap.get(user.id) ?? null,
        role: participation.role as TripRole,
        isTraveler: participation.isTraveler,
        status: participation.status as
          | TripParticipantStatus.ACCEPTED
          | TripParticipantStatus.CONFIRMED,
        confirmedAt: participation.confirmedAt?.toISOString() ?? null,
      };
    });
  }

  async listPendingParticipants(
    tripId: string,
    requestingUserId: string,
  ): Promise<PendingParticipantResponseDto[]> {
    await this.assertTripOrganizer(tripId, requestingUserId);

    const rows = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.tripId, tripId),
        inArray(tripParticipants.status, [
          TripParticipantStatus.INVITED,
          TripParticipantStatus.PENDING_REQUEST,
        ]),
      ),
    });

    const userIds = rows.map((r) => r.userId);
    if (userIds.length === 0) return [];

    const userRows = await this.db.query.users.findMany({ where: inArray(users.id, userIds) });
    const userMap = new Map(userRows.map((u) => [u.id, u]));
    const avatarUrlMap = await this.batchResolveAvatarUrls(userRows);

    return rows.map((participation) => {
      const user = userMap.get(participation.userId);
      if (!user) throw new NotFoundException(`User ${participation.userId} not found`);

      return {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: avatarUrlMap.get(user.id) ?? null,
        status: participation.status as
          | TripParticipantStatus.INVITED
          | TripParticipantStatus.PENDING_REQUEST,
        initiatedAt: participation.initiatedAt.toISOString(),
      };
    });
  }

  // ─── Shared helpers (public — used by TripInvitationsService / TripJoinRequestsService) ──

  async findParticipantOrThrow(
    tripId: string,
    userId: string,
  ): Promise<typeof tripParticipants.$inferSelect> {
    const participation = await this.db.query.tripParticipants.findFirst({
      where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)),
    });
    if (!participation) throw new NotFoundException('Participation record not found');
    return participation;
  }

  async assertTripExists(tripId: string): Promise<typeof trips.$inferSelect> {
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async assertTripOrganizer(tripId: string, userId: string): Promise<void> {
    await this.assertTripExists(tripId);

    const participation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
        inArray(tripParticipants.role, [...ORGANIZER_ROLES]),
      ),
    });
    if (!participation)
      throw new ForbiddenException('Only trip organizers can perform this action');
  }

  private async assertActiveParticipant(tripId: string, userId: string): Promise<void> {
    await this.assertTripExists(tripId);

    const participation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        inArray(tripParticipants.status, [...ACTIVE_STATUSES]),
      ),
    });
    if (!participation)
      throw new ForbiddenException('Only active trip participants can perform this action');
  }

  private async assertNotSoleOrganizer(tripId: string, userId: string): Promise<void> {
    const confirmedOrganizers = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
        eq(tripParticipants.role, TripRole.ORGANIZER),
      ),
      limit: 2,
    });

    if (confirmedOrganizers.length === 1 && confirmedOrganizers[0]?.userId === userId) {
      throw new ConflictException(
        'Cannot remove or demote the last organizer. Transfer the role first.',
      );
    }
  }

  private async batchResolveAvatarUrls(
    userRows: Array<{ id: string; avatar: string | null }>,
  ): Promise<Map<string, string | null>> {
    const avatarIds = userRows.map((u) => u.avatar).filter((id): id is string => id !== null);

    const avatarAssets =
      avatarIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, avatarIds) })
        : [];

    const assetMap = new Map(avatarAssets.map((a) => [a.id, a]));

    const entries = await Promise.all(
      userRows.map(async (user): Promise<[string, string | null]> => {
        const asset = user.avatar ? (assetMap.get(user.avatar) ?? null) : null;
        if (!asset) return [user.id, null];

        const resolved = await this.assetResolver.resolve({
          id: asset.id,
          type: asset.type,
          source: asset.source,
          target: asset.target,
          fileSize: asset.fileSize ?? undefined,
          isPublic: asset.isPublic,
          createdAt: asset.createdAt.toISOString(),
        });

        return [user.id, resolved?.url ?? null];
      }),
    );

    return new Map(entries);
  }
}
