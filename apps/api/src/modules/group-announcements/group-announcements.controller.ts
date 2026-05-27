import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
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
import { GroupAnnouncementsService } from './group-announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';
import { ListAnnouncementsQueryDto } from './dto/list-announcements-query.dto';

@ApiTags('group-announcements')
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
}
