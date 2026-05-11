import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { GroupMemberStatus, GroupRole } from '@chamuco/shared-types';
import { groups } from '@/modules/groups/schema/groups.schema';
import { users } from '@/modules/users/schema/users.schema';

export const groupMemberStatusEnum = pgEnum('group_member_status', [
  GroupMemberStatus.REQUEST,
  GroupMemberStatus.INVITED,
  GroupMemberStatus.ACTIVE,
  GroupMemberStatus.REJECTED,
  GroupMemberStatus.REMOVED,
  GroupMemberStatus.LEFT,
]);

export const groupRoleEnum = pgEnum('group_role', [
  GroupRole.OWNER,
  GroupRole.ADMIN,
  GroupRole.MEMBER,
]);

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .references(() => groups.id, { onDelete: 'restrict' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    status: groupMemberStatusEnum('status').notNull(),
    role: groupRoleEnum('role').notNull().default(GroupRole.MEMBER),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    initiatedBy: uuid('initiated_by')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    decidedBy: uuid('decided_by').references(() => users.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] })],
);

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
  initiator: one(users, {
    fields: [groupMembers.initiatedBy],
    references: [users.id],
    relationName: 'initiator',
  }),
  decider: one(users, {
    fields: [groupMembers.decidedBy],
    references: [users.id],
    relationName: 'decider',
  }),
}));
