# Inventory: invitations

---

## trip-invitations.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` (HTTP method decorators, param parsing, status codes)
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (extracts authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user object)
- `./trip-invitations.service` — `TripInvitationsService` (service handling invitation business logic)
- `./dto/create-trip-invitation.dto` — `CreateTripInvitationDto` (DTO for bulk invitation request body)
- `./dto/bulk-trip-invitation-response.dto` — `BulkTripInvitationResponseDto` (DTO for bulk invitation response)

### Definitions

- `TripInvitationsController` (controller) — REST controller for `v1/trips` routes handling send, accept, decline, and revoke invitation operations

### Exports

- `TripInvitationsController` — named

---

## trip-invitations.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test utilities)
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` (enums for constructing mock auth user)
- `@google-cloud/storage` — mocked via `jest.mock` to prevent GCS initialization in tests
- `./trip-invitations.controller` — `TripInvitationsController` (unit under test)
- `./trip-invitations.service` — `TripInvitationsService` (mocked dependency)
- `./dto/create-trip-invitation.dto` — `CreateTripInvitationDto` (type import for test payloads)
- `./dto/bulk-trip-invitation-response.dto` — `BulkTripInvitationResponseDto` (type import for test payloads)
- `@/types/express` — `AuthenticatedUser` (type for mock auth user fixture)

### Definitions

- `mockAuthUser` (const) — fixture representing an authenticated organizer user for controller tests

### Exports

- none (test file)

---

## trip-invitations.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `Inject`, `Injectable`, `Logger` (NestJS DI, exceptions, logging)
- `drizzle-orm` — `and`, `count`, `eq`, `inArray` (query builders for Drizzle ORM)
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripStatus` (shared domain enums)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and type for the database client)
- `@/database/db-errors` — `isUniqueViolation` (helper to detect PostgreSQL unique constraint violations)
- `@/modules/users/schema/users.schema` — `users` (Drizzle schema for users table)
- `@/modules/trips/schema/trips.schema` — `trips` (Drizzle schema for trips table)
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` (Drizzle schema for trip_participants table)
- `@/modules/notifications/notifications.service` — `NotificationsService` (sends push/email notifications)
- `@/modules/trips/participants/trip-participants.service` — `TripParticipantsService` (checks organizer role and looks up participant records)
- `./dto/create-trip-invitation.dto` — `CreateTripInvitationDto` (input type for sendInvitations)
- `./dto/bulk-trip-invitation-response.dto` — `BulkTripInvitationResponseDto`, `TripInvitationResultDto` (output types for sendInvitations)

### Definitions

- `ORGANIZER_ROLES` (const) — tuple of `[ORGANIZER, CO_ORGANIZER]` used to query organizer participants
- `ACTIVE_STATUSES` (const) — tuple of `[ACCEPTED, CONFIRMED]` used for capacity checks and member-status checks
- `TripInvitationsService` (service) — handles bulk invite dispatch, per-user status resolution, accept/decline/revoke flows, capacity enforcement, and notification fire-and-forget
- `assertCapacityAvailable` (function, private) — queries current confirmed/accepted traveler count and throws `ConflictException` if trip is at capacity

### Exports

- `TripInvitationsService` — named

---

## trip-invitations.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `ForbiddenException`, `NotFoundException` (NestJS exceptions used in assertions)
- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test utilities)
- `@google-cloud/storage` — mocked via `jest.mock` to prevent GCS initialization in tests
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripStatus` (domain enums used in fixtures and assertions)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for the mock DB client)
- `./trip-invitations.service` — `TripInvitationsService` (unit under test)
- `@/modules/trips/participants/trip-participants.service` — `TripParticipantsService` (mocked dependency)
- `@/modules/notifications/notifications.service` — `NotificationsService` (mocked dependency)
- `./dto/create-trip-invitation.dto` — `CreateTripInvitationDto` (type import for test payloads)

### Definitions

- `makeParticipation` (function) — factory helper producing a `tripParticipants` row fixture with a given userId, status, and optional role

### Exports

- none (test file)
