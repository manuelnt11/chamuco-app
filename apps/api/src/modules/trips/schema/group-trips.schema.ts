import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { groups } from '@/modules/groups/schema/groups.schema';
import { trips } from '@/modules/trips/schema/trips.schema';

// Linking a group to a trip: (1) counts the trip toward group stats/gamification,
// (2) triggers bulk invitations for all active group members (side-effect handled by GroupTripsService).
export const groupTrips = pgTable(
  'group_trips',
  {
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.tripId, t.groupId] }),
    index('idx_group_trips_group_id').on(t.groupId),
  ],
);

export const groupTripsRelations = relations(groupTrips, ({ one }) => ({
  trip: one(trips, { fields: [groupTrips.tripId], references: [trips.id] }),
  group: one(groups, { fields: [groupTrips.groupId], references: [groups.id] }),
}));
