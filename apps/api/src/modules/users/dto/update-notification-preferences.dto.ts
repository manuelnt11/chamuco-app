import { ApiProperty } from '@nestjs/swagger';
import {
  DisabledNotificationChannels,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { IsObject } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    type: 'object',
    description:
      'Map of notification types to the channels that should be suppressed. ' +
      'Omitting a key means all channels are enabled for that type. ' +
      'IN_APP delivery (the notifications row) is always created regardless of preferences.',
    example: {
      [NotificationType.PASSPORT_EXPIRING_SOON]: [NotificationChannel.EMAIL],
      [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
    },
    additionalProperties: {
      type: 'array',
      items: { type: 'string', enum: Object.values(NotificationChannel) },
    },
  })
  @IsObject()
  disabledChannels!: DisabledNotificationChannels;
}
