import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { PassportStatus } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';

type PassportStatusRow = { user_id: string; country_code: string; passport_status: string };

@Injectable()
export class PassportStatusJob {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runPassportStatusRefresh(): Promise<void> {
    const rows = await this.db.execute<PassportStatusRow>(sql`
      UPDATE user_nationalities
      SET passport_status = CASE
        WHEN passport_expiry_date < CURRENT_DATE                        THEN 'EXPIRED'
        WHEN passport_expiry_date < CURRENT_DATE + INTERVAL '180 days' THEN 'EXPIRING_SOON'
        ELSE                                                                 'ACTIVE'
      END
      WHERE passport_status <> 'OMITTED'
        AND passport_status <> CASE
          WHEN passport_expiry_date < CURRENT_DATE                        THEN 'EXPIRED'
          WHEN passport_expiry_date < CURRENT_DATE + INTERVAL '180 days' THEN 'EXPIRING_SOON'
          ELSE                                                                 'ACTIVE'
        END
      RETURNING user_id, country_code, passport_status
    `);

    await Promise.all(
      rows
        .filter(
          (r) =>
            r.passport_status === PassportStatus.EXPIRING_SOON ||
            r.passport_status === PassportStatus.EXPIRED,
        )
        .map((r) =>
          this.notificationsService.sendPassportStatusNotification(
            r.user_id,
            r.country_code,
            r.passport_status as PassportStatus.EXPIRING_SOON | PassportStatus.EXPIRED,
          ),
        ),
    );
  }
}
