# Inventory: invitations

---

## `trip-invitations.controller.ts`

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`; HTTP method decorators, param parsing, and status codes
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse`; OpenAPI documentation decorators
- `@/common/decorators/current-user.decorator` — `CurrentUser`; extracts the authenticated user from the request
- `@/types/express` — `AuthenticatedUser`; type for the authenticated user object
- `./trip-invitations.service` — `TripInvitationsService`; service that handles invitation business logic
- `./dto/create-trip-invitation.dto` — `CreateTripInvitationDto`; DTO for the bulk invitation request body
- `./dto/bulk-trip-invitation-response.dto` — `BulkTripInvitationResponseDto`; DTO for the bulk invitation response

### Definitions

- `TripInvitationsController` (controller) — REST controller mounted at `v1/trips` exposing send, accept, decline, and revoke invitation endpoints

### Exports

- `TripInvitationsController` — named

---

## `trip-invitations.controller.spec.ts`

### Imports

- `@nestjs/testing` — `Test`, `TestingModule`; NestJS test module utilities
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`; enums used to build the mock auth user fixture
- `./trip-invitations.controller` — `TripInvitationsController`; unit under test
- `./trip-invitations.service` — `TripInvitationsService`; mocked dependency
- `./dto/create-trip-invitation.dto` — `CreateTripInvitationDto`; type import for test payloads
- `./dto/bulk-trip-invitation-response.dto` — `BulkTripInvitationResponseDto`; type import for test payloads
- `@/types/express` — `AuthenticatedUser`; type for the mock auth user fixture

### Definitions

- `mockAuthUser` (const) — fixture representing an authenticated organizer user for all controller tests

### Exports

- none (test file)

---

## `trip-invitations.service.ts`

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `Inject`, `Injectable`, `Logger`; NestJS DI, exception classes, and logger
- `drizzle-orm` — `and`, `eq`, `inArray`; Drizzle ORM query builder helpers
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripStatus`; shared domain enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient`; injection token and type for the database client
- `@/database/db-errors` — `isUniqueViolation`; detects PostgreSQL unique constraint violations
- `@/modules/users/schema/users.schema` — `users`; Drizzle table reference for users
- `@/modules/trips/schema/trips.schema` — `trips`; Drizzle table reference for trips
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants`; Drizzle table reference for trip_participants
- `@/modules/notifications/notifications.service` — `NotificationsService`; sends push and email notifications
- `@/modules/trips/participants/trip-participants.service` — `TripParticipantsService`; asserts organizer role and looks up participant records
- `@/modules/trips/participants/trip-participants.constants` — `ACTIVE_STATUSES`, `ORGANIZER_ROLES`; sets of statuses/roles used for membership checks
- `./dto/create-trip-invitation.dto` — `CreateTripInvitationDto`; input type for `sendInvitations`
- `./dto/bulk-trip-invitation-response.dto` — `BulkTripInvitationResponseDto`, `TripInvitationResultDto`; output types for `sendInvitations`

### Definitions

- `TripInvitationsService` (service) — handles bulk invite dispatch with per-user status resolution, accept/decline/revoke flows, capacity enforcement, and fire-and-forget notification delivery

### Exports

- `TripInvitationsService` — named

---

## `trip-invitations.service.spec.ts`

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `ForbiddenException`, `NotFoundException`; NestJS exceptions used in test assertions
- `@nestjs/testing` — `Test`, `TestingModule`; NestJS test module utilities
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripStatus`; domain enums used in fixtures and assertions
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`; injection token for the mock DB client
- `./trip-invitations.service` — `TripInvitationsService`; unit under test
- `@/modules/trips/participants/trip-participants.service` — `TripParticipantsService`; mocked dependency
- `@/modules/notifications/notifications.service` — `NotificationsService`; mocked dependency
- `./dto/create-trip-invitation.dto` — `CreateTripInvitationDto`; type import for test payloads

### Definitions

- `makeParticipation` (function) — factory helper that produces a `tripParticipants` row fixture with a given `userId`, `status`, and optional `role`

### Exports

- none (test file)
