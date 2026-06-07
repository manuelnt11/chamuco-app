import { Module } from '@nestjs/common';

import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { TripAnnouncementsController } from './trip-announcements.controller';
import { TripAnnouncementsService } from './trip-announcements.service';

@Module({
  imports: [NotificationsModule],
  controllers: [TripAnnouncementsController],
  providers: [TripAnnouncementsService],
})
export class TripAnnouncementsModule {}
