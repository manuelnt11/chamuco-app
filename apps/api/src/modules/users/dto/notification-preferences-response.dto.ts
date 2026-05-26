import { ApiProperty } from '@nestjs/swagger';
import {
  DisabledNotificationChannels,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';

export class NotificationPreferencesResponseDto {
  @ApiProperty({
    type: 'object',
    description:
      'Map of notification types to channels that are disabled for the user. ' +
      'A missing key means all channels are enabled for that type.',
    example: {
      [NotificationType.PASSPORT_EXPIRING_SOON]: [NotificationChannel.EMAIL],
      [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
    },
    additionalProperties: {
      type: 'array',
      items: { type: 'string', enum: Object.values(NotificationChannel) },
    },
  })
  optOuts!: DisabledNotificationChannels;
}
