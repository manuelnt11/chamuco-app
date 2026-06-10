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
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MyMembershipResponseDto } from './dto/my-membership-response.dto';
import { PendingItemResponseDto } from './dto/pending-item-response.dto';

@ApiTags('group-members')
@ApiBearerAuth()
@Controller('v1/groups/:id')
export class GroupMembersController {
  constructor(private readonly groupMembersService: GroupMembersService) {}

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
      "Returns the authenticated user's current membership status and role for the group. " +
      'Throws 404 if the group does not exist or the caller is not a member.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 200, type: MyMembershipResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiNotFoundResponse({ description: 'Group not found, or caller is not a member.' })
  async getMyMembership(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MyMembershipResponseDto> {
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
