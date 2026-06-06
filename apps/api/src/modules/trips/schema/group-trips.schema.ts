import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { groups } from '@/modules/groups/schema/groups.schema';
import { trips } from '@/modules/trips/schema/trips.schema';

// Linking a group to a trip triggers bulk trip invitations for all active group members.
// This side-effect is handled by GroupTripsService, not enforced at the DB level.
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
  (t) => [primaryKey({ columns: [t.tripId, t.groupId] })],
);

export const groupTripsRelations = relations(groupTrips, ({ one }) => ({
  trip: one(trips, { fields: [groupTrips.tripId], references: [trips.id] }),
  group: one(groups, { fields: [groupTrips.groupId], references: [groups.id] }),
}));
