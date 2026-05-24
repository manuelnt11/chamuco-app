import { Controller, Get, HttpCode, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { NotificationsService } from './notifications.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NotificationsPageDto, toNotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the in-app notification feed',
    description:
      'Returns a cursor-paginated list of notifications for the authenticated user, ' +
      'ordered by creation time descending. Also returns the total unread count. ' +
      'Pass the returned `nextCursor` as `cursor` to fetch the next page.',
  })
  @ApiResponse({ status: 200, type: NotificationsPageDto })
  @ApiResponse({ status: 400, description: 'Invalid cursor — must be an ISO 8601 timestamp' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetNotificationsQueryDto,
  ): Promise<NotificationsPageDto> {
    const [{ items, nextCursor }, unreadCount] = await Promise.all([
      this.notificationsService.findAll(user.id, query.cursor, query.limit),
      this.notificationsService.countUnread(user.id),
    ]);
    return {
      data: items.map(toNotificationResponseDto),
      nextCursor,
      unreadCount,
    };
  }

  @Patch('read-all')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Sets readAt on every unread notification belonging to the authenticated user.',
  })
  @ApiResponse({ status: 204, description: 'All unread notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  async markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Mark a single notification as read',
    description:
      'Sets readAt on the specified notification. ' +
      'Silently succeeds if the notification is already read or belongs to a different user.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the notification to mark as read' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  async markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.notificationsService.markRead(user.id, id);
  }
}
