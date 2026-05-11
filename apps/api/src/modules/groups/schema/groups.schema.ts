import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { GroupVisibility } from '@chamuco/shared-types';
import { assets } from '@/modules/assets/schema/assets.schema';
import { users } from '@/modules/users/schema/users.schema';

export const groupVisibilityEnum = pgEnum('group_visibility', [
  GroupVisibility.PUBLIC,
  GroupVisibility.PRIVATE,
]);

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  cover: uuid('cover').references(() => assets.id, { onDelete: 'restrict' }),
  visibility: groupVisibilityEnum('visibility').notNull(),
  createdBy: uuid('created_by')
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const groupsRelations = relations(groups, ({ one }) => ({
  coverAsset: one(assets, { fields: [groups.cover], references: [assets.id] }),
  creator: one(users, { fields: [groups.createdBy], references: [users.id] }),
}));
