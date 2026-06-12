import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationType } from '../enums/notification-type.enum';

export type DisabledNotificationChannels = Partial<Record<NotificationType, NotificationChannel[]>>;
