import type { notifications } from '@/modules/notifications/schema/notifications.schema';

export type NotificationRow = typeof notifications.$inferSelect;

export interface NotificationChannelStrategy {
  send(notification: NotificationRow, payload: Record<string, unknown>): Promise<void>;
}
