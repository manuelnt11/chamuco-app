# Inventory: join-requests

---

## `trip-join-requests.controller.ts`

### Imports

- `@nestjs/common` — `Controller`, `Delete`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse`
- `@/common/decorators/current-user.decorator` — `CurrentUser` decorator for extracting authenticated user
- `@/types/express` — `AuthenticatedUser` type (type-only import)
- `./trip-join-requests.service` — `TripJoinRequestsService`

### Definitions

- `TripJoinRequestsController` (controller) — NestJS controller mounted at `v1/trips/:id` handling join-request lifecycle endpoints
- `submitJoinRequest` (function) — `POST /v1/trips/:id/join-request`; submits a join request for the authenticated user
- `acceptJoinRequest` (function) — `PATCH /v1/trips/:id/join-requests/:userId/accept`; organizer accepts a pending join request
- `rejectJoinRequest` (function) — `PATCH /v1/trips/:id/join-requests/:userId/reject`; organizer rejects a pending join request
- `withdrawJoinRequest` (function) — `DELETE /v1/trips/:id/join-request`; authenticated user withdraws their own pending join request

### Exports

- `TripJoinRequestsController` — named

---

## `trip-join-requests.controller.spec.ts`

### Imports

- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`
- `@google-cloud/storage` — mocked via `jest.mock`
- `./trip-join-requests.controller` — `TripJoinRequestsController`
- `./trip-join-requests.service` — `TripJoinRequestsService`
- `@/types/express` — `AuthenticatedUser` type (type-only import)

### Definitions

- `mockAuthUser` (const) — fixture representing a fully-populated `AuthenticatedUser` used across all test cases

### Exports

- none

---

## `trip-join-requests.service.ts`

### Imports

- `@nestjs/common` — `ConflictException`, `Inject`, `Injectable`, `Logger`
- `drizzle-orm` — `and`, `eq`, `inArray`
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripVisibility`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient`
- `@/database/db-errors` — `isUniqueViolation`
- `@/modules/trips/schema/trips.schema` — `trips` (Drizzle table reference; its `coverAsset` relation is used via `with:` in `listMyPendingRequests`)
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants`
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (resolves cover asset rows to ready-to-use URLs)
- `@/modules/assets/asset.utils` — `assetRowToAsset` (converts a raw asset row into the `Asset` domain shape)
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `@/modules/trips/participants/trip-participants.service` — `TripParticipantsService`
- `@/modules/trips/participants/trip-participants.constants` — `ACTIVE_STATUSES`
- `./dto/my-trip-join-request-response.dto` — `MyTripJoinRequestResponseDto` (type-only import for `listMyPendingRequests`' return shape)

### Definitions

- `TripJoinRequestsService` (service) — injectable service managing the full join-request lifecycle for trips
- `submitJoinRequest` (function) — validates trip visibility, checks for existing participation, inserts or resets a `PENDING_REQUEST` record; handles concurrent unique-violation race condition
- `acceptJoinRequest` (function) — asserts organizer role, validates `PENDING_REQUEST` status and capacity, transitions to `ACCEPTED`, sends `TRIP_JOIN_ACCEPTED` push notification (errors swallowed with logging)
- `rejectJoinRequest` (function) — asserts organizer role, validates `PENDING_REQUEST` status, transitions to `DECLINED`
- `withdrawJoinRequest` (function) — atomic delete filtered by `PENDING_REQUEST` status; a zero-row `.returning()` result means the request was already accepted/rejected concurrently, surfaced as `ConflictException` rather than racing
- `listMyPendingRequests` (function) — lists the authenticated user's own pending `PENDING_REQUEST`s across trips, with `coverUrl` resolved via the relational `coverAsset` join and defaulted to `null` — never thrown — when the cover can't be resolved

### Exports

- `TripJoinRequestsService` — named

---

## `trip-join-requests.service.spec.ts`

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException`
- `@nestjs/testing` — `Test`, `TestingModule`
- `@google-cloud/storage` — mocked via `jest.mock`
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripVisibility`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`
- `./trip-join-requests.service` — `TripJoinRequestsService`
- `@/modules/trips/participants/trip-participants.service` — `TripParticipantsService`
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (mocked dependency)

### Definitions

- `makeParticipation` (function) — factory helper building a partial `tripParticipants` row fixture for a given `userId` and `status`
- `requestParticipation` (const) — fixture with status `PENDING_REQUEST`
- `invitedParticipation` (const) — fixture with status `INVITED`
- `activeParticipation` (const) — fixture with status `CONFIRMED`
- `declinedParticipation` (const) — fixture with status `DECLINED`
- `TripJoinRequestsService` test suite (class) — includes coverage of the concurrent-accept race in `withdrawJoinRequest` (zero-row atomic delete) and the null-coverUrl/failed-resolve paths in `listMyPendingRequests`

### Exports

- none

---

## `dto/my-trip-join-request-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field documentation)
- `@chamuco/shared-types` — `TripVisibility` (enum for the `visibility` field)

### Definitions

- `MyTripJoinRequestResponseDto` (class) — response shape for `GET /v1/trips/join-requests/mine`: `tripId`, `name`, `coverUrl` (nullable), `visibility`, `startDate`, `endDate`, `initiatedAt`

### Exports

- `MyTripJoinRequestResponseDto` — named
