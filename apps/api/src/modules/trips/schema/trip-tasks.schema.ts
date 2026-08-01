import { relations, sql } from 'drizzle-orm';
import { check, index, pgTable, primaryKey, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { trips } from '@/modules/trips/schema/trips.schema';
import { users } from '@/modules/users/schema/users.schema';

export const tripTasks = pgTable(
  'trip_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 200 }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_trip_tasks_trip_id_owner_id').on(t.tripId, t.ownerId),
    // completedAt tracks completion only for personal tasks (ownerId set) — shared
    // tasks record per-participant completion in trip_task_completions instead.
    check(
      'trip_tasks_completed_only_when_personal',
      sql`${t.ownerId} IS NOT NULL OR ${t.completedAt} IS NULL`,
    ),
  ],
);

export const tripTaskCompletions = pgTable(
  'trip_task_completions',
  {
    taskId: uuid('task_id')
      .notNull()
      .references(() => tripTasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.userId] })],
);

export const tripTasksRelations = relations(tripTasks, ({ one, many }) => ({
  trip: one(trips, { fields: [tripTasks.tripId], references: [trips.id] }),
  owner: one(users, {
    fields: [tripTasks.ownerId],
    references: [users.id],
    relationName: 'taskOwner',
  }),
  creator: one(users, {
    fields: [tripTasks.createdBy],
    references: [users.id],
    relationName: 'taskCreator',
  }),
  completions: many(tripTaskCompletions),
}));

export const tripTaskCompletionsRelations = relations(tripTaskCompletions, ({ one }) => ({
  task: one(tripTasks, { fields: [tripTaskCompletions.taskId], references: [tripTasks.id] }),
  user: one(users, { fields: [tripTaskCompletions.userId], references: [users.id] }),
}));
