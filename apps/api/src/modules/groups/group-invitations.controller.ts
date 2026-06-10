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
  ApiBody,
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
import { GroupInvitationsService } from './group-invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { BulkInvitationResponseDto } from './dto/bulk-invitation-response.dto';
import { MyInvitationResponseDto } from './dto/my-invitation-response.dto';

@ApiTags('group-members')
@ApiBearerAuth()
@Controller('v1/groups')
export class GroupInvitationsController {
  constructor(
    private readonly groupMembersService: GroupMembersService,
    private readonly groupInvitationsService: GroupInvitationsService,
  ) {}

  @Get('invitations')
  @ApiOperation({
    summary: 'List my group invitations',
    description: 'Returns all pending group invitations for the authenticated user.',
  })
  @ApiResponse({ status: 200, type: [MyInvitationResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  async listMyInvitations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyInvitationResponseDto[]> {
    return this.groupMembersService.listMyInvitations(user.id);
  }

  @Post(':id/invitations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send invitations',
    description:
      'Sends membership invitations to one or more users by @username. Admin only. ' +
      'Returns a per-user result for each username in the request.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiBody({ type: CreateInvitationDto })
  @ApiResponse({
    status: 200,
    type: BulkInvitationResponseDto,
    description: 'Per-user invitation results.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin.' })
  async sendInvitations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<BulkInvitationResponseDto> {
    return this.groupInvitationsService.sendInvitations(id, dto, user.id);
  }

  @Patch(':id/invitations/accept')
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
    return this.groupInvitationsService.acceptInvitation(id, user.id);
  }

  @Patch(':id/invitations/decline')
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
    return this.groupInvitationsService.declineInvitation(id, user.id);
  }

  @Delete(':id/invitations/:userId')
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
    return this.groupInvitationsService.revokeInvitation(id, userId, user.id);
  }
}
