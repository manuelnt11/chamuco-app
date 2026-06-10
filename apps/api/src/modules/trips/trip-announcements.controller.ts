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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { TripAnnouncementsService } from './trip-announcements.service';
import { CreateTripAnnouncementDto } from './dto/create-trip-announcement.dto';
import { UpdateTripAnnouncementDto } from './dto/update-trip-announcement.dto';
import { TripAnnouncementResponseDto } from './dto/trip-announcement-response.dto';
import { ListTripAnnouncementsQueryDto } from './dto/list-trip-announcements-query.dto';

@ApiTags('trip-announcements')
@ApiBearerAuth()
@Controller('v1/trips/:id')
export class TripAnnouncementsController {
  constructor(private readonly tripAnnouncementsService: TripAnnouncementsService) {}

  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a trip announcement',
    description:
      'Broadcasts a one-way announcement to all accepted and confirmed participants via push notification. Organizer or co-organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiBody({ type: CreateTripAnnouncementDto })
  @ApiResponse({
    status: 201,
    description: 'Announcement created.',
    type: TripAnnouncementResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer or co-organizer.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTripAnnouncementDto,
  ): Promise<TripAnnouncementResponseDto> {
    return this.tripAnnouncementsService.create(id, user.id, user.username, dto);
  }

  @Get('announcements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List trip announcements',
    description:
      'Returns paginated announcements in reverse-chronological order. Accepted or confirmed participants only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of announcements.',
    schema: {
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/TripAnnouncementResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not an accepted or confirmed participant.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListTripAnnouncementsQueryDto,
  ): Promise<{ items: TripAnnouncementResponseDto[]; total: number }> {
    return this.tripAnnouncementsService.findAll(id, user.id, query);
  }

  @Get('announcements/:announcementId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single trip announcement',
    description: 'Accepted or confirmed participants only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'announcementId', type: String, description: 'Announcement UUID' })
  @ApiResponse({
    status: 200,
    description: 'Announcement found.',
    type: TripAnnouncementResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not an accepted or confirmed participant.' })
  @ApiNotFoundResponse({ description: 'Trip or announcement not found.' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
  ): Promise<TripAnnouncementResponseDto> {
    return this.tripAnnouncementsService.findOne(id, announcementId, user.id);
  }

  @Patch('announcements/:announcementId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a trip announcement',
    description: 'Organizer or co-organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'announcementId', type: String, description: 'Announcement UUID' })
  @ApiBody({ type: UpdateTripAnnouncementDto })
  @ApiResponse({
    status: 200,
    description: 'Announcement updated.',
    type: TripAnnouncementResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer or co-organizer.' })
  @ApiNotFoundResponse({ description: 'Trip or announcement not found.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
    @Body() dto: UpdateTripAnnouncementDto,
  ): Promise<TripAnnouncementResponseDto> {
    return this.tripAnnouncementsService.update(id, announcementId, user.id, dto);
  }

  @Delete('announcements/:announcementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a trip announcement',
    description: 'Organizer or co-organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'announcementId', type: String, description: 'Announcement UUID' })
  @ApiNoContentResponse({ description: 'Announcement deleted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer or co-organizer.' })
  @ApiNotFoundResponse({ description: 'Trip or announcement not found.' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
  ): Promise<void> {
    return this.tripAnnouncementsService.remove(id, announcementId, user.id);
  }
}
