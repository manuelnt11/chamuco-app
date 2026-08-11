import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import {
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
  TripVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { isUniqueViolation } from '@/database/db-errors';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { TripParticipantsService } from '@/modules/trips/participants/trip-participants.service';
import { ACTIVE_STATUSES } from '@/modules/trips/participants/trip-participants.constants';
import type { MyTripJoinRequestResponseDto } from './dto/my-trip-join-request-response.dto';

@Injectable()
export class TripJoinRequestsService {
  private readonly logger = new Logger(TripJoinRequestsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly tripParticipantsService: TripParticipantsService,
    private readonly notifications: NotificationsService,
    private readonly assetResolver: AssetResolverService,
  ) {}

  async listMyPendingRequests(userId: string): Promise<MyTripJoinRequestResponseDto[]> {
    const memberships = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.userId, userId),
        eq(tripParticipants.status, TripParticipantStatus.PENDING_REQUEST),
      ),
    });

    if (memberships.length === 0) return [];

    const tripIds = memberships.map((m) => m.tripId);
    const initiatedAtByTripId = new Map(memberships.map((m) => [m.tripId, m.initiatedAt]));

    const tripRows = await this.db.query.trips.findMany({
      where: inArray(trips.id, tripIds),
      with: { coverAsset: true },
    });

    if (tripRows.length === 0) return [];

    const resolvedCovers = await Promise.all(
      tripRows.map((trip) =>
        trip.coverAsset ? this.assetResolver.resolve(assetRowToAsset(trip.coverAsset)) : null,
      ),
    );

    return tripRows.map((trip, i) => ({
      tripId: trip.id,
      name: trip.name,
      coverUrl: resolvedCovers[i]?.url ?? null,
      visibility: trip.visibility,
      startDate: trip.startDate,
      endDate: trip.endDate,
      initiatedAt: initiatedAtByTripId.get(trip.id)!.toISOString(),
    }));
  }

  async submitJoinRequest(tripId: string, requestingUserId: string): Promise<void> {
    const trip = await this.tripParticipantsService.assertTripExists(tripId);

    if (trip.visibility !== TripVisibility.PUBLIC) {
      throw new ConflictException('Join requests are only allowed for public trips');
    }

    const existing = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, requestingUserId),
      ),
    });

    if (existing) {
      if (ACTIVE_STATUSES.includes(existing.status as (typeof ACTIVE_STATUSES)[number])) {
        throw new ConflictException('An active participation already exists');
      }
      if (existing.status === TripParticipantStatus.PENDING_REQUEST) {
        throw new ConflictException('A pending join request already exists');
      }
      // INVITED or DECLINED — reset to PENDING_REQUEST
      await this.db
        .update(tripParticipants)
        .set({
          status: TripParticipantStatus.PENDING_REQUEST,
          role: TripRole.PARTICIPANT,
          isTraveler: true,
          initiatedBy: requestingUserId,
          initiatedAt: new Date(),
          decidedBy: null,
          confirmedAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, requestingUserId)),
        );
    } else {
      try {
        await this.db.insert(tripParticipants).values({
          tripId,
          userId: requestingUserId,
          status: TripParticipantStatus.PENDING_REQUEST,
          role: TripRole.PARTICIPANT,
          isTraveler: true,
          initiatedBy: requestingUserId,
        });
      } catch (err: unknown) {
        if (isUniqueViolation(err))
          throw new ConflictException('A pending join request already exists');
        throw err;
      }
    }
  }

  async acceptJoinRequest(
    tripId: string,
    targetUserId: string,
    organizerUserId: string,
  ): Promise<void> {
    await this.tripParticipantsService.assertTripOrganizer(tripId, organizerUserId);
    const participation = await this.tripParticipantsService.findParticipantOrThrow(
      tripId,
      targetUserId,
    );

    if (participation.status !== TripParticipantStatus.PENDING_REQUEST) {
      throw new ConflictException('No pending join request found for this user');
    }

    await this.tripParticipantsService.assertCapacityAvailable(tripId);

    const now = new Date();
    await this.db
      .update(tripParticipants)
      .set({
        status: TripParticipantStatus.ACCEPTED,
        decidedBy: organizerUserId,
        updatedAt: now,
      })
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));

    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: { name: true },
    });
    await this.notifications
      .notify(
        targetUserId,
        NotificationType.TRIP_JOIN_ACCEPTED,
        { tripId, tripName: trip?.name ?? '' },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) => {
        this.logger.error('Failed to send TRIP_JOIN_ACCEPTED notification', err);
      });
  }

  async rejectJoinRequest(
    tripId: string,
    targetUserId: string,
    organizerUserId: string,
  ): Promise<void> {
    await this.tripParticipantsService.assertTripOrganizer(tripId, organizerUserId);
    const participation = await this.tripParticipantsService.findParticipantOrThrow(
      tripId,
      targetUserId,
    );

    if (participation.status !== TripParticipantStatus.PENDING_REQUEST) {
      throw new ConflictException('No pending join request found for this user');
    }

    await this.db
      .update(tripParticipants)
      .set({
        status: TripParticipantStatus.DECLINED,
        decidedBy: organizerUserId,
        updatedAt: new Date(),
      })
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));
  }

  async withdrawJoinRequest(tripId: string, requestingUserId: string): Promise<void> {
    await this.tripParticipantsService.findParticipantOrThrow(tripId, requestingUserId);

    const [deleted] = await this.db
      .delete(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          eq(tripParticipants.userId, requestingUserId),
          eq(tripParticipants.status, TripParticipantStatus.PENDING_REQUEST),
        ),
      )
      .returning();

    if (!deleted) throw new ConflictException('No pending join request to withdraw');
  }
}
