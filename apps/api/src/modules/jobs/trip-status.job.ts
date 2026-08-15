import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lt, sql } from 'drizzle-orm';

import { TripStatus } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { notifyTripCompleted } from '@/modules/trips/trip-completion.util';
import { trips } from '@/modules/trips/schema/trips.schema';

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
      try {
        await this.completeTrip(trip.id, trip.name);
      } catch (err: unknown) {
        this.logger.error(`Failed to auto-complete trip ${trip.id}`, err);
      }
    }
  }

  private async completeTrip(tripId: string, tripName: string): Promise<void> {
    // Re-check status/end_date at write time (not just at the earlier SELECT) so a
    // trip cancelled in between isn't silently flipped back to COMPLETED, and so a
    // failure processing one trip only ever leaves that trip unnotified — trips not
    // yet reached stay IN_PROGRESS and get retried on the next run.
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

    await notifyTripCompleted(this.db, this.notifications, tripId, tripName);
  }
}
