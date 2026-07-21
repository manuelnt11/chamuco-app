import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, isNotNull, lt, sql } from 'drizzle-orm';

import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { notifications } from '@/modules/notifications/schema/notifications.schema';

@Injectable()
export class NotificationCleanupJob {
  private readonly logger = new Logger(NotificationCleanupJob.name);

  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runNotificationCleanup(): Promise<void> {
    try {
      await this.cleanup();
    } catch (error) {
      this.logger.error('Notification cleanup job failed', error);
    }
  }

  private async cleanup(): Promise<void> {
    await this.db
      .delete(notifications)
      .where(
        and(
          isNotNull(notifications.readAt),
          lt(notifications.readAt, sql`NOW() - INTERVAL '7 days'`),
        ),
      );
  }
}
