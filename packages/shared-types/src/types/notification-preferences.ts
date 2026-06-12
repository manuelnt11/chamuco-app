import type { NotificationChannel } from '../enums/notification-channel.enum';
import type { NotificationType } from '../enums/notification-type.enum';

export type DisabledNotificationChannels = Partial<Record<NotificationType, NotificationChannel[]>>;
