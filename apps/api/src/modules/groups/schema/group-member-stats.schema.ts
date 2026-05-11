import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { GroupMemberTier } from '@chamuco/shared-types';
import { groups } from '@/modules/groups/schema/groups.schema';
import { users } from '@/modules/users/schema/users.schema';

export const groupMemberTierEnum = pgEnum('group_member_tier', [
  GroupMemberTier.NEWCOMER,
  GroupMemberTier.NOVICE,
  GroupMemberTier.EXPLORER,
  GroupMemberTier.VETERAN,
]);

export const groupMemberStats = pgTable(
  'group_member_stats',
  {
    groupId: uuid('group_id')
      .references(() => groups.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    tier: groupMemberTierEnum('tier').notNull().default(GroupMemberTier.NEWCOMER),
    groupTripsCompleted: integer('group_trips_completed').notNull().default(0),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull(),
    activeStreak: integer('active_streak').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] })],
);

export const groupMemberStatsRelations = relations(groupMemberStats, ({ one }) => ({
  group: one(groups, { fields: [groupMemberStats.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMemberStats.userId], references: [users.id] }),
}));
