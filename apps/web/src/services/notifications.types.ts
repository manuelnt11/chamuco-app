import type { NotificationType } from '@chamuco/shared-types';

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
  unreadCount: number;
}
