import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { PassportStatusJob } from './passport-status.job';
import { TripStatusJob } from './trip-status.job';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [PassportStatusJob, TripStatusJob],
})
export class JobsModule {}
