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
import { TripParticipantsService } from './trip-participants.service';
import { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';
import { ParticipantResponseDto } from './dto/participant-response.dto';
import { MyParticipationResponseDto } from './dto/my-participation-response.dto';
import { PendingParticipantResponseDto } from './dto/pending-participant-response.dto';
import { MyTripInvitationResponseDto } from './dto/my-trip-invitation-response.dto';

@ApiTags('trip-participants')
@ApiBearerAuth()
@Controller('v1/trips')
export class TripParticipantsController {
  constructor(private readonly tripParticipantsService: TripParticipantsService) {}

  @Get('invitations')
  @ApiOperation({
    summary: 'List my trip invitations',
    description: 'Returns all pending trip invitations for the authenticated user.',
  })
  @ApiResponse({ status: 200, type: [MyTripInvitationResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  async listMyInvitations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyTripInvitationResponseDto[]> {
    return this.tripParticipantsService.listMyInvitations(user.id);
  }

  @Delete(':id/participants/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a participant or leave the trip',
    description:
      'When called by an organizer on another user: removes them. ' +
      'When called by the authenticated user on themselves: leaves if active, ' +
      'or withdraws a pending request or invitation.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'Participant removed or user left.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({
    description: 'Caller is not a trip organizer (when removing another user).',
  })
  @ApiConflictResponse({ description: 'Cannot remove the last organizer.' })
  @ApiNotFoundResponse({ description: 'Trip or user not found.' })
  async removeParticipant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.tripParticipantsService.removeParticipant(id, userId, user.id);
  }

  @Patch(':id/participants/:userId/confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Toggle participant confirmation',
    description:
      'Toggles a participant confirmation status between ACCEPTED and CONFIRMED. ' +
      'Organizer and co-organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the target participant' })
  @ApiResponse({ status: 204, description: 'Confirmation toggled.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer or co-organizer.' })
  @ApiNotFoundResponse({ description: 'Trip or active participant not found.' })
  async toggleParticipantConfirmation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.tripParticipantsService.toggleParticipantConfirmation(id, userId, user.id);
  }

  @Patch(':id/participants/:userId/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update a participant role',
    description:
      'Changes a participant role. To transfer ORGANIZER: only the current ORGANIZER can assign ORGANIZER to another active participant; the previous ORGANIZER becomes CO_ORGANIZER. Organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the target participant' })
  @ApiResponse({ status: 204, description: 'Role updated.' })
  @ApiBody({ type: UpdateParticipantRoleDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not the trip organizer.' })
  @ApiConflictResponse({ description: 'Cannot demote the last organizer.' })
  @ApiNotFoundResponse({ description: 'Trip or active participant not found.' })
  async updateParticipantRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateParticipantRoleDto,
  ): Promise<void> {
    return this.tripParticipantsService.updateParticipantRole(id, userId, dto, user.id);
  }

  @Get(':id/participants/me')
  @ApiOperation({
    summary: 'Get my participation',
    description:
      "Returns the authenticated user's current participation status and role for the trip.",
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: MyParticipationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiNotFoundResponse({ description: 'Trip not found, or caller is not a participant.' })
  async getMyParticipation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MyParticipationResponseDto> {
    return this.tripParticipantsService.getMyParticipation(id, user.id);
  }

  @Get(':id/participants')
  @ApiOperation({
    summary: 'List active participants',
    description:
      'Returns all active participants (ACCEPTED or CONFIRMED) with their role. Active participants only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: [ParticipantResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not an active participant.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async listActiveParticipants(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ParticipantResponseDto[]> {
    return this.tripParticipantsService.listActiveParticipants(id, user.id);
  }

  @Get(':id/participants/pending')
  @ApiOperation({
    summary: 'List pending requests and invitations',
    description: 'Returns all PENDING_REQUEST and INVITED participants. Organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: [PendingParticipantResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async listPendingParticipants(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PendingParticipantResponseDto[]> {
    return this.tripParticipantsService.listPendingParticipants(id, user.id);
  }
}
