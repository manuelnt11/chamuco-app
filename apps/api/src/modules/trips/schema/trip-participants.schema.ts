import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { TripParticipantStatus, TripRole } from '@chamuco/shared-types';
import { trips } from '@/modules/trips/schema/trips.schema';
import { users } from '@/modules/users/schema/users.schema';

export const tripRoleEnum = pgEnum('trip_role', [
  TripRole.ORGANIZER,
  TripRole.CO_ORGANIZER,
  TripRole.PARTICIPANT,
]);

export const tripParticipantStatusEnum = pgEnum('trip_participant_status', [
  TripParticipantStatus.INVITED,
  TripParticipantStatus.PENDING_REQUEST,
  TripParticipantStatus.ACCEPTED,
  TripParticipantStatus.CONFIRMED,
  TripParticipantStatus.DECLINED,
]);

export const tripParticipants = pgTable(
  'trip_participants',
  {
    tripId: uuid('trip_id')
      .references(() => trips.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    role: tripRoleEnum('role').notNull(),
    status: tripParticipantStatusEnum('status').notNull(),
    isTraveler: boolean('is_traveler').notNull(),
    didTravel: boolean('did_travel'),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.tripId, t.userId] }),
    check(
      'participant_must_be_traveler',
      sql`${t.role} != 'PARTICIPANT' OR ${t.isTraveler} = true`,
    ),
    index('idx_trip_participants_user_id_status').on(t.userId, t.status),
    index('idx_trip_participants_trip_id_status').on(t.tripId, t.status),
  ],
);

export const tripParticipantsRelations = relations(tripParticipants, ({ one }) => ({
  trip: one(trips, { fields: [tripParticipants.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripParticipants.userId], references: [users.id] }),
}));
