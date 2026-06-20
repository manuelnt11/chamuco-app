import type { NotificationType } from '@chamuco/shared-types';
import type { notifications } from '@/modules/notifications/schema/notifications.schema';

export type NotificationRow = typeof notifications.$inferSelect;

export interface DispatchableNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
}

export type RenderedNotification = NotificationRow & {
  title: string;
  body: string;
  url: string | null;
};

export interface NotificationChannelStrategy {
  send(notification: DispatchableNotification, payload: Record<string, unknown>): Promise<void>;
}
