import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { NotificationsService } from './notifications.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NotificationsPageDto, toNotificationResponseDto } from './dto/notification-response.dto';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { DeleteFcmTokenDto } from './dto/delete-fcm-token.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'ISO 8601 timestamp cursor from the previous page.',
    example: '2026-05-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of notifications to return (1–50, default 20).',
    example: 20,
  })
  @ApiOperation({
    summary: 'Get the in-app notification feed',
    description:
      'Returns a cursor-paginated list of notifications for the authenticated user, ' +
      'ordered by creation time descending. Also returns the total unread count. ' +
      'Pass the returned `nextCursor` as `cursor` to fetch the next page.',
  })
  @ApiResponse({ status: 200, type: NotificationsPageDto })
  @ApiBadRequestResponse({ description: 'Invalid cursor — must be an ISO 8601 timestamp.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
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
  @ApiResponse({ status: 204, description: 'All unread notifications marked as read.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  async markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Mark a single notification as read',
    description:
      'Sets readAt on the specified notification. ' +
      'Idempotent — marking an already-read notification succeeds.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the notification to mark as read', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Notification marked as read.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post('fcm-token')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Register FCM token',
    description:
      "Upserts an FCM registration token for the current user's device. " +
      'Idempotent — registering the same token again updates last_used_at.',
  })
  @ApiBody({ type: RegisterFcmTokenDto })
  @ApiResponse({ status: 204, description: 'Token registered.' })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  async registerFcmToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterFcmTokenDto,
  ): Promise<void> {
    return this.notificationsService.registerToken(user.id, dto);
  }

  @Delete('fcm-token')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove FCM token',
    description:
      'Deletes the given FCM token on logout. ' + 'Returns 204 even if the token does not exist.',
  })
  @ApiBody({ type: DeleteFcmTokenDto })
  @ApiResponse({ status: 204, description: 'Token removed (or was not present).' })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  async deleteFcmToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteFcmTokenDto,
  ): Promise<void> {
    return this.notificationsService.deleteToken(user.id, dto);
  }
}
