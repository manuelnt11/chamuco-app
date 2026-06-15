import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';

import {
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { isUniqueViolation } from '@/database/db-errors';
import { users } from '@/modules/users/schema/users.schema';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { TripParticipantsService } from '@/modules/trips/participants/trip-participants.service';
import type { CreateTripInvitationDto } from './dto/create-trip-invitation.dto';
import type {
  BulkTripInvitationResponseDto,
  TripInvitationResultDto,
} from './dto/bulk-trip-invitation-response.dto';

const ORGANIZER_ROLES = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER] as const;
const ACTIVE_STATUSES = [TripParticipantStatus.ACCEPTED, TripParticipantStatus.CONFIRMED] as const;

@Injectable()
export class TripInvitationsService {
  private readonly logger = new Logger(TripInvitationsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly tripParticipantsService: TripParticipantsService,
    private readonly notifications: NotificationsService,
  ) {}

  async sendInvitations(
    tripId: string,
    dto: CreateTripInvitationDto,
    organizerUserId: string,
  ): Promise<BulkTripInvitationResponseDto> {
    await this.tripParticipantsService.assertTripOrganizer(tripId, organizerUserId);

    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: { name: true },
    });

    const targetUsers = await this.db.query.users.findMany({
      where: inArray(users.username, dto.usernames),
    });
    const userByUsername = new Map(targetUsers.map((u) => [u.username, u]));

    const existingParticipations =
      targetUsers.length > 0
        ? await this.db.query.tripParticipants.findMany({
            where: and(
              eq(tripParticipants.tripId, tripId),
              inArray(
                tripParticipants.userId,
                targetUsers.map((u) => u.id),
              ),
            ),
          })
        : [];
    const participationByUserId = new Map(existingParticipations.map((p) => [p.userId, p]));

    const results: TripInvitationResultDto[] = [];
    const invitedUserIds: string[] = [];

    for (const username of dto.usernames) {
      const targetUser = userByUsername.get(username);

      if (!targetUser) {
        results.push({ username, status: 'NOT_FOUND' });
        continue;
      }

      const existing = participationByUserId.get(targetUser.id);

      if (existing) {
        if (ACTIVE_STATUSES.includes(existing.status as (typeof ACTIVE_STATUSES)[number])) {
          results.push({ username, status: 'ALREADY_MEMBER' });
          continue;
        }
        if (existing.status === TripParticipantStatus.INVITED) {
          results.push({ username, status: 'ALREADY_INVITED' });
          continue;
        }
        if (existing.status === TripParticipantStatus.PENDING_REQUEST) {
          results.push({ username, status: 'HAS_PENDING_REQUEST' });
          continue;
        }
        // DECLINED — re-invite
        await this.db
          .update(tripParticipants)
          .set({
            status: TripParticipantStatus.INVITED,
            role: TripRole.PARTICIPANT,
            isTraveler: true,
            initiatedBy: organizerUserId,
            initiatedAt: new Date(),
            decidedBy: null,
            updatedAt: new Date(),
          })
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUser.id)),
          );
      } else {
        try {
          await this.db.insert(tripParticipants).values({
            tripId,
            userId: targetUser.id,
            status: TripParticipantStatus.INVITED,
            role: TripRole.PARTICIPANT,
            isTraveler: true,
            initiatedBy: organizerUserId,
          });
        } catch (err: unknown) {
          if (isUniqueViolation(err)) {
            results.push({ username, status: 'ALREADY_INVITED' });
            continue;
          }
          throw err;
        }
      }

      invitedUserIds.push(targetUser.id);
      results.push({ username, status: 'INVITED' });
    }

    if (invitedUserIds.length > 0) {
      await this.notifications
        .notifyMany(
          invitedUserIds,
          NotificationType.TRIP_INVITATION,
          { tripId, tripName: trip?.name ?? '' },
          [NotificationChannel.PUSH],
        )
        .catch((err: unknown) => {
          this.logger.error('Failed to send TRIP_INVITATION notifications', err);
        });
    }

    return { results };
  }

  async acceptInvitation(tripId: string, requestingUserId: string): Promise<void> {
    const participation = await this.tripParticipantsService.findParticipantOrThrow(
      tripId,
      requestingUserId,
    );

    if (participation.status !== TripParticipantStatus.INVITED) {
      throw new ConflictException('No pending invitation found');
    }

    await this.assertCapacityAvailable(tripId);

    const now = new Date();
    await this.db
      .update(tripParticipants)
      .set({
        status: TripParticipantStatus.ACCEPTED,
        decidedBy: requestingUserId,
        updatedAt: now,
      })
      .where(
        and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, requestingUserId)),
      );

    const [trip, acceptingUser, organizerParticipants] = await Promise.all([
      this.db.query.trips.findFirst({ where: eq(trips.id, tripId), columns: { name: true } }),
      this.db.query.users.findFirst({
        where: eq(users.id, requestingUserId),
        columns: { username: true },
      }),
      this.db.query.tripParticipants.findMany({
        where: and(
          eq(tripParticipants.tripId, tripId),
          eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
          inArray(tripParticipants.role, [...ORGANIZER_ROLES]),
        ),
        columns: { userId: true },
      }),
    ]);

    const organizerIds = organizerParticipants.map((p) => p.userId);
    if (organizerIds.length > 0) {
      await this.notifications
        .notifyMany(
          organizerIds,
          NotificationType.TRIP_INVITATION_ACCEPTED,
          { tripId, tripName: trip?.name ?? '', username: acceptingUser?.username ?? '' },
          [NotificationChannel.PUSH],
        )
        .catch((err: unknown) => {
          this.logger.error('Failed to send TRIP_INVITATION_ACCEPTED notification', err);
        });
    }
  }

  async declineInvitation(tripId: string, requestingUserId: string): Promise<void> {
    const participation = await this.tripParticipantsService.findParticipantOrThrow(
      tripId,
      requestingUserId,
    );

    if (participation.status !== TripParticipantStatus.INVITED) {
      throw new ConflictException('No pending invitation found');
    }

    await this.db
      .update(tripParticipants)
      .set({
        status: TripParticipantStatus.DECLINED,
        decidedBy: requestingUserId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, requestingUserId)),
      );
  }

  async revokeInvitation(
    tripId: string,
    targetUserId: string,
    organizerUserId: string,
  ): Promise<void> {
    await this.tripParticipantsService.assertTripOrganizer(tripId, organizerUserId);
    const participation = await this.tripParticipantsService.findParticipantOrThrow(
      tripId,
      targetUserId,
    );

    if (participation.status !== TripParticipantStatus.INVITED) {
      throw new ConflictException('No pending invitation to revoke');
    }

    await this.db
      .delete(tripParticipants)
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));
  }

  private async assertCapacityAvailable(tripId: string): Promise<void> {
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: { participantCapacity: true },
    });
    if (!trip) return;

    const [row] = await this.db
      .select({ total: count() })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          inArray(tripParticipants.status, [...ACTIVE_STATUSES]),
          eq(tripParticipants.isTraveler, true),
        ),
      );

    if ((row?.total ?? 0) >= trip.participantCapacity) {
      throw new ConflictException('Trip has reached maximum participant capacity');
    }
  }
}
