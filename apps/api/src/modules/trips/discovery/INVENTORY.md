# Inventory: discovery

---

## `trip-discovery.service.ts`

### Imports

- `@nestjs/common` — `Inject`, `Injectable` decorators
- `drizzle-orm` — `and`, `asc`, `count`, `eq`, `ilike`, `inArray` query helpers
- `@chamuco/shared-types` — `MembershipStatus`, `TripParticipantStatus`, `TripStatus`, `TripVisibility` enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` token, `DrizzleClient` type
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table schema
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` Drizzle table schema
- `@/modules/trips/schema/trip-destinations.schema` — `tripDestinations` Drizzle table schema
- `@/modules/trips/participants/trip-participants.constants` — `ACTIVE_STATUSES` constant
- `./dto/search-trips-query.dto` — `SearchTripsQueryDto` type (import only)
- `./dto/trip-search-result.dto` — `TripSearchResponseDto` type (import only)

### Definitions

- `PENDING_STATUSES` (const) — module-level array of `TripParticipantStatus` values representing pending participation states (`PENDING_REQUEST`, `INVITED`)
- `TripDiscoveryService` (class) — NestJS injectable service that queries publicly visible OPEN trips with pagination, confirmed participant counts, destinations, and caller participation status

### Exports

- `TripDiscoveryService` — named

---

## `trip-discovery.service.spec.ts`

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for building the test module
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripStatus`, `TripVisibility` enums used in fixtures
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for mock provider
- `./trip-discovery.service` — `TripDiscoveryService` class under test
- `./dto/search-trips-query.dto` — `SearchTripsQueryDto` type for test query fixtures

### Definitions

- `mockTripRow` (const) — fixture object representing a single trip database row
- `mockDestinationRow` (const) — fixture object representing a single trip destination row

### Exports

- _(none — test file, no exports)_
