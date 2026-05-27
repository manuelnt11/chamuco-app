import { NotificationChannel } from './notification-channel.enum';
import { NotificationType } from './notification-type.enum';

export type DisabledNotificationChannels = Partial<Record<NotificationType, NotificationChannel[]>>;
