import { relations, sql } from 'drizzle-orm';
import { char, check, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { trips } from '@/modules/trips/schema/trips.schema';

export const tripDestinations = pgTable(
  'trip_destinations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    countryCode: char('country_code', { length: 2 }).notNull(),
    city: text('city').notNull(),
    label: text('label'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('trip_destinations_trip_id_position_unique').on(t.tripId, t.position),
    check('trip_destinations_position_min', sql`${t.position} >= 1`),
  ],
);

export const tripDestinationsRelations = relations(tripDestinations, ({ one }) => ({
  trip: one(trips, { fields: [tripDestinations.tripId], references: [trips.id] }),
}));
