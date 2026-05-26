import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { GroupMembersController } from './group-members.controller';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupMembersService } from './group-members.service';

@Module({
  imports: [NotificationsModule],
  controllers: [GroupInvitationsController, GroupMembersController],
  providers: [GroupMembersService],
  exports: [GroupMembersService],
})
export class GroupMembersModule {}
