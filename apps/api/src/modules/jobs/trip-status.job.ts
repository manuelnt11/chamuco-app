import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lt, sql } from 'drizzle-orm';

import { TripStatus } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { trips } from '@/modules/trips/schema/trips.schema';

@Injectable()
export class TripStatusJob {
  private readonly logger = new Logger(TripStatusJob.name);

  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

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
    await this.db
      .update(trips)
      .set({ status: TripStatus.COMPLETED })
      .where(and(eq(trips.status, TripStatus.IN_PROGRESS), lt(trips.endDate, sql`CURRENT_DATE`)));
  }
}
