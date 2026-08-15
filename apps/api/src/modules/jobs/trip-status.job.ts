import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';

import {
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripStatus,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';

const READER_STATUSES = [TripParticipantStatus.ACCEPTED, TripParticipantStatus.CONFIRMED] as const;

@Injectable()
export class TripStatusJob {
  private readonly logger = new Logger(TripStatusJob.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runTripAutoComplete(): Promise<void> {
    try {
      await this.autoComplete();
    } catch (error) {
      this.logger.error('Trip auto-complete job failed', error);
    }
  }

  private async autoComplete(): Promise<void> {
    // Transition IN_PROGRESS trips to COMPLETED when end_date has passed.
    // Runs at 00:00 — trips with end_date < CURRENT_DATE ended yesterday or earlier.
    const dueTrips = await this.db
      .select({ id: trips.id, name: trips.name })
      .from(trips)
      .where(and(eq(trips.status, TripStatus.IN_PROGRESS), lt(trips.endDate, sql`CURRENT_DATE`)));

    if (dueTrips.length === 0) return;

    await this.db
      .update(trips)
      .set({ status: TripStatus.COMPLETED })
      .where(
        inArray(
          trips.id,
          dueTrips.map((t) => t.id),
        ),
      );

    for (const trip of dueTrips) {
      await this.notifyTripCompleted(trip.id, trip.name);
    }
  }

  private async notifyTripCompleted(tripId: string, tripName: string): Promise<void> {
    const participantRows = await this.db
      .select({ userId: tripParticipants.userId })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          inArray(tripParticipants.status, [...READER_STATUSES]),
        ),
      );

    const userIds = participantRows.map((r) => r.userId);
    if (userIds.length === 0) return;

    await this.notifications
      .notifyMany(userIds, NotificationType.TRIP_COMPLETED, { tripId, tripName }, [
        NotificationChannel.PUSH,
      ])
      .catch((err: unknown) => {
        this.logger.error('Failed to send TRIP_COMPLETED notification', err);
      });
  }
}
