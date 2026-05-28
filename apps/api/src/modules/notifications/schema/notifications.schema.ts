import { desc, relations } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { NotificationType } from '@chamuco/shared-types';
import { users } from '@/modules/users/schema/users.schema';

export const notificationTypeEnum = pgEnum('notification_type', [
  NotificationType.GROUP_INVITATION,
  NotificationType.GROUP_JOIN_ACCEPTED,
  NotificationType.GROUP_ANNOUNCEMENT,
  NotificationType.TRIP_INVITATION,
  NotificationType.TRIP_ANNOUNCEMENT,
  NotificationType.TRIP_KEY_DATE_REMINDER,
  NotificationType.TRIP_COMPLETED,
  NotificationType.PASSPORT_EXPIRING_SOON,
  NotificationType.PASSPORT_EXPIRED,
  NotificationType.ACHIEVEMENT_UNLOCKED,
]);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: notificationTypeEnum('type').notNull(),
    data: jsonb('data'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_notifications_user_id_created_at').on(t.userId, desc(t.createdAt))],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
