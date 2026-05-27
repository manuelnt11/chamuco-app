import { Module } from '@nestjs/common';

import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { GroupAnnouncementsController } from './group-announcements.controller';
import { GroupAnnouncementsService } from './group-announcements.service';

@Module({
  imports: [NotificationsModule],
  controllers: [GroupAnnouncementsController],
  providers: [GroupAnnouncementsService],
})
export class GroupAnnouncementsModule {}
