import {
  Body,
  Controller,
  Delete,
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
import { TripInvitationsService } from './trip-invitations.service';
import { CreateTripInvitationDto } from './dto/create-trip-invitation.dto';
import { BulkTripInvitationResponseDto } from './dto/bulk-trip-invitation-response.dto';

@ApiTags('trip-invitations')
@ApiBearerAuth()
@Controller('v1/trips')
export class TripInvitationsController {
  constructor(private readonly tripInvitationsService: TripInvitationsService) {}

  @Post(':id/invitations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send trip invitations',
    description:
      'Sends trip invitations to one or more users by @username. Organizer only. ' +
      'Returns a per-user result for each username in the request.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiBody({ type: CreateTripInvitationDto })
  @ApiResponse({
    status: 200,
    type: BulkTripInvitationResponseDto,
    description: 'Per-user invitation results.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer.' })
  async sendInvitations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTripInvitationDto,
  ): Promise<BulkTripInvitationResponseDto> {
    return this.tripInvitationsService.sendInvitations(id, dto, user.id);
  }

  @Patch(':id/invitations/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Accept a trip invitation',
    description: 'Accepts a pending trip invitation for the authenticated user.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 204, description: 'Invitation accepted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiConflictResponse({ description: 'No pending invitation found, or trip is at capacity.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tripInvitationsService.acceptInvitation(id, user.id);
  }

  @Patch(':id/invitations/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Decline a trip invitation',
    description: 'Declines a pending trip invitation for the authenticated user.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 204, description: 'Invitation declined.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiConflictResponse({ description: 'No pending invitation found.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async declineInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tripInvitationsService.declineInvitation(id, user.id);
  }

  @Delete(':id/invitations/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke a trip invitation',
    description: 'Revokes a pending invitation. Organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the invitee' })
  @ApiResponse({ status: 204, description: 'Invitation revoked.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer.' })
  @ApiConflictResponse({ description: 'No pending invitation found.' })
  @ApiNotFoundResponse({ description: 'Trip or user not found.' })
  async revokeInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.tripInvitationsService.revokeInvitation(id, userId, user.id);
  }
}
