import { relations } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { DeliveryStatus, NotificationChannel } from '@chamuco/shared-types';
import { notifications } from '@/modules/notifications/schema/notifications.schema';

export const notificationChannelEnum = pgEnum('notification_channel', [
  NotificationChannel.PUSH,
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
]);

export const deliveryStatusEnum = pgEnum('delivery_status', [
  DeliveryStatus.PENDING,
  DeliveryStatus.SENT,
  DeliveryStatus.FAILED,
]);

export const notificationDeliveries = pgTable(
  'notification_deliveries',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    notificationId: uuid('notification_id')
      .references(() => notifications.id, { onDelete: 'cascade' })
      .notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    status: deliveryStatusEnum('status').notNull().default(DeliveryStatus.PENDING),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_notification_deliveries_status').on(t.status)],
);

export const notificationDeliveriesRelations = relations(notificationDeliveries, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationDeliveries.notificationId],
    references: [notifications.id],
  }),
}));
