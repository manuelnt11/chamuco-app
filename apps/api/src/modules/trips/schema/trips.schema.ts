import { relations, sql } from 'drizzle-orm';
import {
  char,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { TripStatus, TripVisibility } from '@chamuco/shared-types';
import { assets } from '@/modules/assets/schema/assets.schema';
import { users } from '@/modules/users/schema/users.schema';

export const tripStatusEnum = pgEnum('trip_status', [
  TripStatus.DRAFT,
  TripStatus.OPEN,
  TripStatus.CONFIRMED,
  TripStatus.IN_PROGRESS,
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
]);

export const tripVisibilityEnum = pgEnum('trip_visibility', [
  TripVisibility.PUBLIC,
  TripVisibility.PRIVATE,
]);

export const trips = pgTable(
  'trips',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    cover: uuid('cover').references(() => assets.id, { onDelete: 'restrict' }),
    status: tripStatusEnum('status').notNull().default(TripStatus.DRAFT),
    visibility: tripVisibilityEnum('visibility').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    defaultTimezone: varchar('default_timezone', { length: 60 }),
    defaultCurrency: char('default_currency', { length: 3 }),
    participantCapacity: integer('participant_capacity').notNull(),
    departureCountry: char('departure_country', { length: 2 }).notNull(),
    departureCity: text('departure_city').notNull(),
    landingCountry: char('landing_country', { length: 2 }).notNull(),
    landingCity: text('landing_city').notNull(),
    itineraryNotes: text('itinerary_notes'),
    // FK to agencies.id added when agencies module ships
    agencyId: uuid('agency_id'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('trips_date_order', sql`${table.endDate} >= ${table.startDate}`),
    check('trips_participant_capacity_min', sql`${table.participantCapacity} >= 2`),
  ],
);

export const tripsRelations = relations(trips, ({ one }) => ({
  coverAsset: one(assets, { fields: [trips.cover], references: [assets.id] }),
  creator: one(users, { fields: [trips.createdBy], references: [users.id] }),
}));
