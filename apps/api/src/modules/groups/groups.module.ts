import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupMembersController } from './group-members.controller';
import { GroupJoinRequestsController } from './group-join-requests.controller';
import { GroupAnnouncementsController } from './group-announcements.controller';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsDiscoveryService } from './groups-discovery.service';
import { GroupMembersService } from './group-members.service';
import { GroupInvitationsService } from './group-invitations.service';
import { GroupJoinRequestsService } from './group-join-requests.service';
import { GroupAnnouncementsService } from './group-announcements.service';

@Module({
  imports: [NotificationsModule],
  controllers: [
    // GroupInvitationsController registers GET /v1/groups/invitations (literal) — must
    // come before GroupsController which registers GET /v1/groups/:id (parameterized).
    GroupInvitationsController,
    GroupMembersController,
    GroupJoinRequestsController,
    GroupAnnouncementsController,
    GroupsController,
  ],
  providers: [
    GroupsService,
    GroupsDiscoveryService,
    GroupMembersService,
    GroupInvitationsService,
    GroupJoinRequestsService,
    GroupAnnouncementsService,
  ],
  exports: [GroupsService],
})
export class GroupsModule {}
