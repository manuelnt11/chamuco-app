# Inventory: discovery

---

## trip-discovery.service.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable` decorators for DI and service registration
- `drizzle-orm` — `and`, `asc`, `count`, `eq`, `ilike`, `inArray` query-builder helpers
- `@chamuco/shared-types` — `MembershipStatus`, `TripParticipantStatus`, `TripStatus`, `TripVisibility` enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table reference
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` Drizzle table reference
- `@/modules/trips/schema/trip-destinations.schema` — `tripDestinations` Drizzle table reference
- `./dto/search-trips-query.dto` — `SearchTripsQueryDto` type (query params shape)
- `./dto/trip-search-result.dto` — `TripSearchResponseDto` type (paginated response shape)

### Definitions

- `ACTIVE_STATUSES` (const) — array of `TripParticipantStatus` values (`ACCEPTED`, `CONFIRMED`) that count toward confirmed participant totals
- `PENDING_STATUSES` (const) — array of `TripParticipantStatus` values (`PENDING_REQUEST`, `INVITED`) that map to `'pending'` participation status
- `TripDiscoveryService` (service) — NestJS injectable that implements public trip search with pagination, confirmed-count aggregation, per-caller participation status, and batch-loaded destinations

### Exports

- `TripDiscoveryService` — named

---

## trip-discovery.service.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for constructing the isolated NestJS test module
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripStatus`, `TripVisibility` enums used in mock data and assertions
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` token used to provide the mock DB client
- `./trip-discovery.service` — `TripDiscoveryService` class under test
- `./dto/search-trips-query.dto` — `SearchTripsQueryDto` type for typed query fixtures

### Definitions

- `mockTripRow` (const) — representative trip DB row fixture used across test cases
- `mockDestinationRow` (const) — representative trip destination DB row fixture

### Exports

- _(none — test file, no exports)_
