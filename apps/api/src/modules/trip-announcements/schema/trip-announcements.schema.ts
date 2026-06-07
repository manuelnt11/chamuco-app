import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { trips } from '@/modules/trips/schema/trips.schema';
import { users } from '@/modules/users/schema/users.schema';

export const tripAnnouncements = pgTable(
  'trip_announcements',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tripId: uuid('trip_id')
      .references(() => trips.id, { onDelete: 'restrict' })
      .notNull(),
    createdBy: uuid('created_by')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_trip_announcements_trip_id').on(t.tripId, t.createdAt)],
);

export const tripAnnouncementsRelations = relations(tripAnnouncements, ({ one }) => ({
  trip: one(trips, { fields: [tripAnnouncements.tripId], references: [trips.id] }),
  creator: one(users, { fields: [tripAnnouncements.createdBy], references: [users.id] }),
}));
