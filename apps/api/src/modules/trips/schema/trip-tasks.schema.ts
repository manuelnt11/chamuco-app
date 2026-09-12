import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { TripTaskScope } from '@chamuco/shared-types';
import { trips } from '@/modules/trips/schema/trips.schema';
import { users } from '@/modules/users/schema/users.schema';

export const tripTaskScopeEnum = pgEnum('trip_task_scope', [
  TripTaskScope.SHARED,
  TripTaskScope.PERSONAL,
  TripTaskScope.ORGANIZER,
]);

export const tripTasks = pgTable(
  'trip_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    scope: tripTaskScopeEnum('scope').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    completedBy: uuid('completed_by').references(() => users.id, { onDelete: 'restrict' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_trip_tasks_trip_id_scope').on(t.tripId, t.scope),
    // completedAt tracks a single completion status for PERSONAL (owner: createdBy) and
    // ORGANIZER (any organizer/co-organizer) tasks — SHARED tasks record per-participant
    // completion in trip_task_completions instead.
    check(
      'trip_tasks_completed_at_not_shared',
      sql`${t.scope} != 'SHARED' OR ${t.completedAt} IS NULL`,
    ),
    // completedBy records which organizer completed an ORGANIZER task — extra accountability
    // since it carries more responsibility than a SHARED/PERSONAL task. Not tracked for
    // PERSONAL (owner is self-evident) or SHARED (per-participant rows already say who).
    check(
      'trip_tasks_completed_by_organizer_only',
      sql`${t.scope} = 'ORGANIZER' OR ${t.completedBy} IS NULL`,
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
