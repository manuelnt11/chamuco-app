import { Module } from '@nestjs/common';
import { GroupMembersController } from './group-members.controller';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupMembersService } from './group-members.service';

@Module({
  controllers: [GroupInvitationsController, GroupMembersController],
  providers: [GroupMembersService],
  exports: [GroupMembersService],
})
export class GroupMembersModule {}
