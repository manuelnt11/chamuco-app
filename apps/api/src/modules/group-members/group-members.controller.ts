import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { GroupMembersService } from './group-members.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MyMembershipResponseDto } from './dto/my-membership-response.dto';
import { PendingItemResponseDto } from './dto/pending-item-response.dto';

@ApiTags('group-members')
@ApiBearerAuth()
@Controller('v1/groups/:id')
export class GroupMembersController {
  constructor(private readonly groupMembersService: GroupMembersService) {}

  // ─── Join request ─────────────────────────────────────────────────────────────

  @Post('join-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Submit a join request',
    description:
      'Submits a join request to a public group. Only available when group visibility is PUBLIC.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 204, description: 'Join request submitted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Group is not public.' })
  @ApiConflictResponse({ description: 'Active membership or pending request already exists.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async submitJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.groupMembersService.submitJoinRequest(id, user.id);
  }

  @Patch('join-requests/:userId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Accept a join request',
    description: 'Accepts a pending join request. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the requester' })
  @ApiResponse({ status: 204, description: 'Join request accepted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin.' })
  @ApiConflictResponse({ description: 'No pending join request found.' })
  @ApiNotFoundResponse({ description: 'Group or user not found.' })
  async acceptJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.groupMembersService.acceptJoinRequest(id, userId, user.id);
  }

  @Patch('join-requests/:userId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reject a join request',
    description: 'Rejects a pending join request. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the requester' })
  @ApiResponse({ status: 204, description: 'Join request rejected.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin.' })
  @ApiConflictResponse({ description: 'No pending join request found.' })
  @ApiNotFoundResponse({ description: 'Group or user not found.' })
  async rejectJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.groupMembersService.rejectJoinRequest(id, userId, user.id);
  }

  // ─── Invitations ──────────────────────────────────────────────────────────────

  @Post('invitations')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Send an invitation',
    description: 'Sends a membership invitation to a user by @username. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 204, description: 'Invitation sent.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin.' })
  @ApiConflictResponse({
    description: 'User is already a member, has a pending invitation, or a pending join request.',
  })
  @ApiNotFoundResponse({ description: 'Group or target user not found.' })
  async sendInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<void> {
    return this.groupMembersService.sendInvitation(id, dto, user.id);
  }

  @Patch('invitations/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Accept an invitation',
    description: 'Accepts a pending invitation for the authenticated user.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 204, description: 'Invitation accepted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiConflictResponse({ description: 'No pending invitation found.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.groupMembersService.acceptInvitation(id, user.id);
  }

  @Patch('invitations/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Decline an invitation',
    description: 'Declines a pending invitation for the authenticated user.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 204, description: 'Invitation declined.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiConflictResponse({ description: 'No pending invitation found.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async declineInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.groupMembersService.declineInvitation(id, user.id);
  }

  @Delete('invitations/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke an invitation',
    description: 'Revokes a pending invitation. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the invitee' })
  @ApiResponse({ status: 204, description: 'Invitation revoked.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin.' })
  @ApiConflictResponse({ description: 'No pending invitation found.' })
  @ApiNotFoundResponse({ description: 'Group or user not found.' })
  async revokeInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.groupMembersService.revokeInvitation(id, userId, user.id);
  }

  // ─── Members ──────────────────────────────────────────────────────────────────

  @Delete('members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a member or leave the group',
    description:
      'When called by an admin on another user: removes them (REMOVED). ' +
      'When called by the authenticated user on themselves: leaves (LEFT) if active, ' +
      'or withdraws/cancels a pending request or invitation.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'Member removed or user left.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({
    description:
      'Caller is not a group admin (when removing another user), or ADMIN tried to remove OWNER.',
  })
  @ApiConflictResponse({ description: 'Cannot remove or demote the last admin.' })
  @ApiNotFoundResponse({ description: 'Group or user not found.' })
  async removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.groupMembersService.removeMember(id, userId, user.id);
  }

  @Patch('members/:userId/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update a member role',
    description:
      'Changes a member role (MEMBER ↔ ADMIN). To transfer OWNER: only the current OWNER can assign OWNER to another active member; the previous OWNER becomes ADMIN. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the target member' })
  @ApiResponse({ status: 204, description: 'Role updated.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({
    description: 'Caller is not a group admin, or only OWNER can transfer ownership.',
  })
  @ApiConflictResponse({ description: 'Cannot demote the last admin.' })
  @ApiNotFoundResponse({ description: 'Group or active member not found.' })
  async updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<void> {
    return this.groupMembersService.updateMemberRole(id, userId, dto, user.id);
  }

  @Get('members/me')
  @ApiOperation({
    summary: 'Get my membership',
    description:
      "Returns the authenticated user's current membership status and role for the group, or null if no membership record exists.",
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    type: MyMembershipResponseDto,
    description: 'Membership record, or null if none.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async getMyMembership(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MyMembershipResponseDto | null> {
    return this.groupMembersService.getMyMembership(id, user.id);
  }

  @Get('members')
  @ApiOperation({
    summary: 'List active members',
    description: 'Returns all active members with their role and tier. Active members only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 200, type: [MemberResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not an active group member.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async listActiveMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberResponseDto[]> {
    return this.groupMembersService.listActiveMembers(id, user.id);
  }

  @Get('pending')
  @ApiOperation({
    summary: 'List pending requests and invitations',
    description: 'Returns all pending join requests and pending invitations. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 200, type: [PendingItemResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async listPendingMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PendingItemResponseDto[]> {
    return this.groupMembersService.listPendingMembers(id, user.id);
  }
}
