# Inventory: join-requests

---

## trip-join-requests.controller.ts

### Imports

- `@nestjs/common` — `Controller`, `Delete`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` for routing and HTTP utilities
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` for OpenAPI documentation decorators
- `@/common/decorators/current-user.decorator` — `CurrentUser` decorator to extract the authenticated user from the request
- `@/types/express` — `AuthenticatedUser` type representing the authenticated user shape
- `./trip-join-requests.service` — `TripJoinRequestsService` for business logic delegation

### Definitions

- `TripJoinRequestsController` (controller) — REST controller mounted at `v1/trips/:id`; exposes four endpoints for the join-request lifecycle (submit, accept, reject, withdraw)

### Exports

- `TripJoinRequestsController` — named

---

## trip-join-requests.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS unit test scaffolding
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` for constructing the mock authenticated user
- `./trip-join-requests.controller` — `TripJoinRequestsController` (subject under test)
- `./trip-join-requests.service` — `TripJoinRequestsService` (mocked provider)
- `@/types/express` — `AuthenticatedUser` type for mock user fixture

### Definitions

- `mockAuthUser` (const) — fixture representing a fully-populated `AuthenticatedUser` used across all test cases

### Exports

- _(none — test file)_

---

## trip-join-requests.service.ts

### Imports

- `@nestjs/common` — `ConflictException`, `Inject`, `Injectable`, `Logger` for DI, logging, and HTTP exceptions
- `drizzle-orm` — `and`, `count`, `eq`, `inArray` for composing SQL query conditions
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripVisibility` for domain enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token and `DrizzleClient` type
- `@/database/db-errors` — `isUniqueViolation` helper to detect PostgreSQL unique-constraint errors
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table reference
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` Drizzle table reference
- `@/modules/notifications/notifications.service` — `NotificationsService` for sending push notifications
- `@/modules/trips/participants/trip-participants.service` — `TripParticipantsService` for shared trip/participant assertion helpers

### Definitions

- `ACTIVE_STATUSES` (const) — tuple of `ACCEPTED` and `CONFIRMED` statuses used for capacity checks and active-participation guards
- `TripJoinRequestsService` (service) — injectable service implementing the four join-request operations: submit, accept, reject, and withdraw; also contains a private `assertCapacityAvailable` helper
- `submitJoinRequest` (function) — validates trip visibility, checks for conflicting participation states, then inserts or resets a `PENDING_REQUEST` row; handles concurrent unique-violation race condition
- `acceptJoinRequest` (function) — verifies organizer role and capacity, transitions `PENDING_REQUEST` → `ACCEPTED`, fires a `TRIP_JOIN_ACCEPTED` push notification (errors swallowed with logging)
- `rejectJoinRequest` (function) — verifies organizer role, transitions `PENDING_REQUEST` → `DECLINED`
- `withdrawJoinRequest` (function) — deletes the `PENDING_REQUEST` row for the requesting user
- `assertCapacityAvailable` (function) — private; counts active travelers against `participantCapacity` and throws `ConflictException` if at or over limit

### Exports

- `TripJoinRequestsService` — named

---

## trip-join-requests.service.spec.ts

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException` for asserting thrown exception types
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS unit test scaffolding
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripVisibility` for fixtures and assertions
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for the mock DB provider
- `./trip-join-requests.service` — `TripJoinRequestsService` (subject under test)
- `@/modules/trips/participants/trip-participants.service` — `TripParticipantsService` (mocked)
- `@/modules/notifications/notifications.service` — `NotificationsService` (mocked)

### Definitions

- `makeParticipation` (function) — factory helper (>5 lines) that builds a partial `tripParticipants` row fixture for a given userId and status
- `requestParticipation`, `invitedParticipation`, `activeParticipation`, `declinedParticipation` (const) — pre-built participation fixtures used across describe blocks

### Exports

- _(none — test file)_
