import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from '@/modules/users/schema/users.schema';

export const userFcmTokens = pgTable(
  'user_fcm_tokens',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    token: text('token').notNull(),
    deviceHint: varchar('device_hint', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.token] }),
    index('idx_user_fcm_tokens_user_id').on(t.userId),
  ],
);

export const userFcmTokensRelations = relations(userFcmTokens, ({ one }) => ({
  user: one(users, { fields: [userFcmTokens.userId], references: [users.id] }),
}));
