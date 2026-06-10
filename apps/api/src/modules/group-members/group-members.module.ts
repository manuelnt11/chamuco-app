import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupMembersController } from './group-members.controller';
import { GroupJoinRequestsController } from './group-join-requests.controller';
import { GroupMembersService } from './group-members.service';
import { GroupInvitationsService } from './group-invitations.service';
import { GroupJoinRequestsService } from './group-join-requests.service';

@Module({
  imports: [NotificationsModule],
  controllers: [GroupInvitationsController, GroupMembersController, GroupJoinRequestsController],
  providers: [GroupMembersService, GroupInvitationsService, GroupJoinRequestsService],
  exports: [GroupMembersService],
})
export class GroupMembersModule {}
