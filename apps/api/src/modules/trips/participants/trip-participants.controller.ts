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
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ExportField, ExportFormat } from '@chamuco/shared-types';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { ExportParticipantsQueryDto } from './dto/export-participants-query.dto';
import { ALL_EXPORT_FIELDS, TripParticipantsService } from './trip-participants.service';
import { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';
import { ParticipantResponseDto } from './dto/participant-response.dto';
import { MyParticipationResponseDto } from './dto/my-participation-response.dto';
import { PendingParticipantResponseDto } from './dto/pending-participant-response.dto';
import { MyTripInvitationResponseDto } from './dto/my-trip-invitation-response.dto';

const EXPORT_CONTENT_TYPES: Record<ExportFormat, string> = {
  [ExportFormat.XLSX]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [ExportFormat.CSV]: 'text/csv; charset=utf-8',
  [ExportFormat.ODS]: 'application/vnd.oasis.opendocument.spreadsheet',
};

const EXPORT_EXTENSIONS: Record<ExportFormat, string> = {
  [ExportFormat.XLSX]: 'xlsx',
  [ExportFormat.CSV]: 'csv',
  [ExportFormat.ODS]: 'ods',
};

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

  @Get(':id/participants/export')
  @ApiOperation({
    summary: 'Export participant data',
    description:
      'Downloads a spreadsheet with profile data for all active (ACCEPTED/CONFIRMED) participants. ' +
      'Organizer and co-organizer only. ' +
      'Supported formats: csv (default), xlsx, ods. ' +
      'Use the fields param to select specific columns; omit for all columns.',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.oasis.opendocument.spreadsheet',
  )
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: false })
  @ApiQuery({
    name: 'fields',
    enum: ExportField,
    isArray: true,
    required: false,
    description: 'Comma-separated or repeated. Defaults to all fields.',
  })
  @ApiResponse({
    status: 200,
    description: 'Spreadsheet file with participant profile data.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer or co-organizer.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async exportParticipants(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ExportParticipantsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const format = query.format ?? ExportFormat.CSV;
    const fields = query.fields ?? ALL_EXPORT_FIELDS;

    const buffer = await this.tripParticipantsService.exportParticipants(
      id,
      user.id,
      format,
      fields,
    );

    res.set({
      'Content-Type': EXPORT_CONTENT_TYPES[format],
      'Content-Disposition': `attachment; filename="participants-${id}.${EXPORT_EXTENSIONS[format]}"`,
    });
    return new StreamableFile(buffer);
  }
}
