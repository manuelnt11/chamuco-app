import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { groups } from '@/modules/groups/schema/groups.schema';
import { users } from '@/modules/users/schema/users.schema';

export const groupAnnouncements = pgTable(
  'group_announcements',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    groupId: uuid('group_id')
      .references(() => groups.id, { onDelete: 'restrict' })
      .notNull(),
    createdBy: uuid('created_by')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_group_announcements_group_id').on(t.groupId, t.createdAt)],
);

export const groupAnnouncementsRelations = relations(groupAnnouncements, ({ one }) => ({
  group: one(groups, { fields: [groupAnnouncements.groupId], references: [groups.id] }),
  creator: one(users, { fields: [groupAnnouncements.createdBy], references: [users.id] }),
}));
