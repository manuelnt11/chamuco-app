import { Body, Controller, Get, HttpCode, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { UsersPreferencesService } from './users-preferences.service';
import { NotificationPreferencesResponseDto } from './dto/notification-preferences-response.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersPreferencesController {
  constructor(private readonly usersPreferencesService: UsersPreferencesService) {}

  @Get('me/preferences')
  @ApiOperation({
    summary: "Get the current user's preferences",
    description: "Returns the authenticated user's preferences: language, currency, theme.",
  })
  @ApiResponse({ status: 200, type: UserPreferencesResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User preferences not found.' })
  getPreferences(@CurrentUser() user: AuthenticatedUser): Promise<UserPreferencesResponseDto> {
    return this.usersPreferencesService.getPreferences(user.id);
  }

  @Patch('me/preferences')
  @HttpCode(200)
  @ApiBody({ type: UpdateUserPreferencesDto })
  @ApiOperation({
    summary: "Update the current user's preferences",
    description: 'Updates any subset of preference fields: language, currency, theme.',
  })
  @ApiResponse({ status: 200, type: UserPreferencesResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed — invalid enum value.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User preferences not found.' })
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.usersPreferencesService.updatePreferences(user.id, dto);
  }

  @Get('me/notification-preferences')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the current user's notification preferences",
    description:
      'Returns which notification channels are disabled per notification type. ' +
      'A missing key means all channels are enabled for that type. ' +
      'IN_APP delivery (the notifications row) is always created regardless of preferences.',
  })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User preferences not found.' })
  getNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.usersPreferencesService.getNotificationPreferences(user.id);
  }

  @Patch('me/notification-preferences')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiBody({ type: UpdateNotificationPreferencesDto })
  @ApiOperation({
    summary: "Update the current user's notification preferences",
    description:
      'Replaces the notification channel preferences with the provided map. ' +
      'Keys are NotificationType values; values are arrays of NotificationChannel values to disable. ' +
      'Invalid keys or channel values are silently ignored. ' +
      'To re-enable all channels for a type, omit the key.',
  })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed — body must be an object.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User preferences not found.' })
  updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.usersPreferencesService.updateNotificationPreferences(user.id, dto);
  }
}
