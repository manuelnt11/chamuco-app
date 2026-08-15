import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';

import { NotificationChannel, NotificationType, TripStatus } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { ACTIVE_STATUSES } from '@/modules/trips/participants/trip-participants.constants';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';

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

    for (const trip of dueTrips) {
      await this.completeTrip(trip.id, trip.name);
    }
  }

  private async completeTrip(tripId: string, tripName: string): Promise<void> {
    // Re-check status/end_date at write time (not just at the earlier SELECT) so a
    // trip cancelled in between isn't silently flipped back to COMPLETED, and so a
    // crash mid-loop only ever leaves the trip currently being processed unnotified —
    // trips not yet reached stay IN_PROGRESS and get retried on the next run.
    const [updated] = await this.db
      .update(trips)
      .set({ status: TripStatus.COMPLETED })
      .where(
        and(
          eq(trips.id, tripId),
          eq(trips.status, TripStatus.IN_PROGRESS),
          lt(trips.endDate, sql`CURRENT_DATE`),
        ),
      )
      .returning({ id: trips.id });

    if (!updated) return;

    await this.notifyTripCompleted(tripId, tripName);
  }

  private async notifyTripCompleted(tripId: string, tripName: string): Promise<void> {
    const participantRows = await this.db
      .select({ userId: tripParticipants.userId })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          inArray(tripParticipants.status, [...ACTIVE_STATUSES]),
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
