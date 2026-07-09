# Inventory: schema

---

## group-trips.schema.ts

### Imports

- `drizzle-orm` — `relations` for defining ORM-level relationships
- `drizzle-orm/pg-core` — `index`, `pgTable`, `primaryKey`, `timestamp`, `uuid` for table and column builders
- `@/modules/groups/schema/groups.schema` — `groups` table reference for FK
- `@/modules/trips/schema/trips.schema` — `trips` table reference for FK

### Definitions

- `groupTrips` (const) — Drizzle table for `group_trips`; composite PK on `(trip_id, group_id)`, index on `group_id`; links a group to a trip triggering bulk invitations and group stats
- `groupTripsRelations` (const) — Drizzle relations for `groupTrips`; defines `trip` and `group` one-to-one associations

### Exports

- `groupTrips` — named
- `groupTripsRelations` — named

---

## group-trips.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for inspecting table metadata in tests
- `./group-trips.schema` — `groupTrips`, `groupTripsRelations` under test

### Definitions

- `describe('group_trips schema', ...)` (const) — test suite verifying table name, columns, composite PK, `group_id` index, `added_at` type, and relations export

### Exports

- _(none — test file)_

---

## trip-announcements.schema.ts

### Imports

- `drizzle-orm` — `relations` for ORM-level relationships
- `drizzle-orm/pg-core` — `index`, `pgTable`, `text`, `timestamp`, `uuid` for table and column builders
- `@/modules/trips/schema/trips.schema` — `trips` table reference for FK
- `@/modules/users/schema/users.schema` — `users` table reference for FK

### Definitions

- `tripAnnouncements` (const) — Drizzle table for `trip_announcements`; UUID PK, FKs to `trips` and `users` (restrict on delete), composite index on `(trip_id, created_at)`
- `tripAnnouncementsRelations` (const) — Drizzle relations defining `trip` and `creator` one-to-one associations

### Exports

- `tripAnnouncements` — named
- `tripAnnouncementsRelations` — named

---

## trip-destinations.schema.ts

### Imports

- `drizzle-orm` — `relations`, `sql` for raw SQL expressions in constraints
- `drizzle-orm/pg-core` — `char`, `check`, `integer`, `pgTable`, `text`, `timestamp`, `unique`, `uuid` for table and column builders
- `@/modules/trips/schema/trips.schema` — `trips` table reference for FK

### Definitions

- `tripDestinations` (const) — Drizzle table for `trip_destinations`; UUID PK, ordered by `position` (integer ≥ 1), 2-char `country_code`, unique constraint on `(trip_id, position)`, CHECK on `position >= 1`
- `tripDestinationsRelations` (const) — Drizzle relations defining `trip` one-to-one association

### Exports

- `tripDestinations` — named
- `tripDestinationsRelations` — named

---

## trip-destinations.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for inspecting table metadata in tests
- `./trip-destinations.schema` — `tripDestinations`, `tripDestinationsRelations` under test

### Definitions

- `describe('trip_destinations schema', ...)` (const) — test suite verifying table name, columns, unique constraint on `(trip_id, position)`, CHECK constraint, `created_at` type, and relations export

### Exports

- _(none — test file)_

---

## trip-participants.schema.ts

### Imports

- `drizzle-orm` — `relations`, `sql` for raw SQL in CHECK constraints
- `drizzle-orm/pg-core` — `boolean`, `check`, `index`, `pgEnum`, `pgTable`, `primaryKey`, `timestamp`, `uuid` for table and column builders
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole` enums used to populate pg enums
- `@/modules/trips/schema/trips.schema` — `trips` table reference for FK
- `@/modules/users/schema/users.schema` — `users` table reference for FKs (`user_id`, `initiated_by`, `decided_by`)

### Definitions

- `tripRoleEnum` (const) — Drizzle pgEnum `trip_role` seeded from `TripRole` values (ORGANIZER, CO_ORGANIZER, PARTICIPANT)
- `tripParticipantStatusEnum` (const) — Drizzle pgEnum `trip_participant_status` seeded from `TripParticipantStatus` values
- `tripParticipants` (const) — Drizzle table for `trip_participants`; composite PK on `(trip_id, user_id)`, CHECK `participant_must_be_traveler`, indexes on `(user_id, status)` and `(trip_id, status)`
- `tripParticipantsRelations` (const) — Drizzle relations defining `trip`, `user`, `initiator`, and `decider` one-to-one associations

### Exports

- `tripRoleEnum` — named
- `tripParticipantStatusEnum` — named
- `tripParticipants` — named
- `tripParticipantsRelations` — named

---

## trip-participants.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for inspecting table metadata in tests
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole` for enum value assertions
- `./trip-participants.schema` — `tripParticipants`, `tripParticipantsRelations`, `tripParticipantStatusEnum`, `tripRoleEnum` under test

### Definitions

- `describe('trip_participants schema', ...)` (const) — test suite verifying table name, columns, composite PK, CHECK constraint, indexes, timestamptz columns, enum values, and relations export

### Exports

- _(none — test file)_

---

## trips.schema.ts

### Imports

- `drizzle-orm` — `relations`, `sql` for raw SQL in CHECK constraints
- `drizzle-orm/pg-core` — `char`, `check`, `date`, `integer`, `pgEnum`, `pgTable`, `text`, `timestamp`, `uuid`, `varchar` for table and column builders
- `@chamuco/shared-types` — `TripStatus`, `TripVisibility` enums used to populate pg enums
- `@/modules/assets/schema/assets.schema` — `assets` table reference for `cover` FK
- `@/modules/users/schema/users.schema` — `users` table reference for `created_by` FK

### Definitions

- `tripStatusEnum` (const) — Drizzle pgEnum `trip_status` seeded from `TripStatus` values (DRAFT, OPEN, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- `tripVisibilityEnum` (const) — Drizzle pgEnum `trip_visibility` seeded from `TripVisibility` values (PUBLIC, PRIVATE)
- `trips` (const) — Drizzle table for `trips`; UUID PK, varchar name, optional cover asset FK, status/visibility enums, date range with CHECK `end_date >= start_date`, CHECK `participant_capacity >= 1`, departure/landing country+city, placeholder `agency_id` (FK deferred to agencies module)
- `tripsRelations` (const) — Drizzle relations defining `coverAsset` and `creator` one-to-one associations

### Exports

- `tripStatusEnum` — named
- `tripVisibilityEnum` — named
- `trips` — named
- `tripsRelations` — named

---

## trips.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for inspecting table metadata in tests
- `@chamuco/shared-types` — `TripStatus`, `TripVisibility` for enum value assertions
- `./trips.schema` — `tripStatusEnum`, `trips`, `tripsRelations`, `tripVisibilityEnum` under test

### Definitions

- `describe('trips schema', ...)` (const) — test suite verifying table name, columns, CHECK constraints, timestamptz columns, enum values for status and visibility, and relations export

### Exports

- _(none — test file)_
