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
import { GroupAnnouncementsService } from './group-announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';
import { ListAnnouncementsQueryDto } from './dto/list-announcements-query.dto';

@ApiTags({ name: 'group-announcements', parent: 'groups' })
@ApiBearerAuth()
@Controller('v1/groups/:id')
export class GroupAnnouncementsController {
  constructor(private readonly groupAnnouncementsService: GroupAnnouncementsService) {}

  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a group announcement',
    description:
      'Broadcasts a one-way announcement to all active group members via push notification. Admin or owner only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiBody({ type: CreateAnnouncementDto })
  @ApiResponse({ status: 201, description: 'Announcement created.', type: AnnouncementResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin or owner.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    return this.groupAnnouncementsService.create(id, user.id, user.username, dto);
  }

  @Get('announcements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List group announcements',
    description:
      'Returns paginated announcements in reverse-chronological order. Active members only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of announcements.',
    schema: {
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/AnnouncementResponseDto' } },
        total: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not an active group member.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListAnnouncementsQueryDto,
  ): Promise<{ items: AnnouncementResponseDto[]; total: number }> {
    return this.groupAnnouncementsService.findAll(id, user.id, query);
  }

  @Get('announcements/:announcementId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single group announcement', description: 'Active members only.' })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'announcementId', type: String, description: 'Announcement UUID' })
  @ApiResponse({ status: 200, description: 'Announcement found.', type: AnnouncementResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not an active group member.' })
  @ApiNotFoundResponse({ description: 'Group or announcement not found.' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
  ): Promise<AnnouncementResponseDto> {
    return this.groupAnnouncementsService.findOne(id, announcementId, user.id);
  }

  @Patch('announcements/:announcementId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a group announcement',
    description: 'Admin or owner only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'announcementId', type: String, description: 'Announcement UUID' })
  @ApiBody({ type: UpdateAnnouncementDto })
  @ApiResponse({ status: 200, description: 'Announcement updated.', type: AnnouncementResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin or owner.' })
  @ApiNotFoundResponse({ description: 'Group or announcement not found.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
    @Body() dto: UpdateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    return this.groupAnnouncementsService.update(id, announcementId, user.id, dto);
  }

  @Delete('announcements/:announcementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a group announcement',
    description: 'Admin or owner only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'announcementId', type: String, description: 'Announcement UUID' })
  @ApiNoContentResponse({ description: 'Announcement deleted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin or owner.' })
  @ApiNotFoundResponse({ description: 'Group or announcement not found.' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
  ): Promise<void> {
    return this.groupAnnouncementsService.remove(id, announcementId, user.id);
  }
}
