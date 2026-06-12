import type { NotificationType } from '../enums/notification-type.enum';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationsPage {
  data: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}
