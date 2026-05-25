import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@chamuco/shared-types';
import type { NotificationRow } from '@/modules/notifications/channel-strategies/notification-channel.strategy';

export class NotificationResponseDto {
  @ApiProperty({ description: 'UUID of the notification.', example: 'a1b2c3d4-...' })
  id!: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Notification type identifying the event that triggered it.',
    example: NotificationType.TRIP_INVITATION,
  })
  type!: NotificationType;

  @ApiProperty({ description: 'Short title of the notification.', example: 'New trip invitation' })
  title!: string;

  @ApiProperty({
    description: 'Full body text of the notification.',
    example: 'You have been invited to join Summer Trip 2026.',
  })
  body!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the notification was read, or null if unread.',
    example: '2026-05-24T12:00:00.000Z',
    nullable: true,
    type: String,
  })
  readAt!: string | null;

  @ApiProperty({
    description:
      'Event payload used for deep-linking — shape depends on `type` (e.g. `{ tripId }` for trip events, `{ countryCode }` for passport events). Null when no payload was stored.',
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: { tripId: 'a1b2c3d4-...' },
  })
  data!: Record<string, unknown> | null;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the notification was created.',
    example: '2026-05-24T10:00:00.000Z',
  })
  createdAt!: string;
}

export class NotificationsPageDto {
  @ApiProperty({
    type: [NotificationResponseDto],
    description: 'Notifications for the current page.',
  })
  data!: NotificationResponseDto[];

  @ApiProperty({
    description:
      'Cursor to pass as `cursor` in the next request to get the following page. Null when there are no more pages.',
    example: '2026-05-20T08:00:00.000Z',
    nullable: true,
    type: String,
  })
  nextCursor!: string | null;

  @ApiProperty({ description: 'Total number of unread notifications for the user.', example: 3 })
  unreadCount!: number;
}

export function toNotificationResponseDto(row: NotificationRow): NotificationResponseDto {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    data: (row.data ?? null) as Record<string, unknown> | null,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
