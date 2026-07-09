# Inventory: announcements

---

## trip-announcements.controller.spec.ts

### Imports

- `class-transformer` — `plainToInstance` for DTO transformation in tests
- `class-validator` — `validate` for DTO validation assertions
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module bootstrapping
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` for mock user construction
- `@/types/express` — `AuthenticatedUser` type for mock authenticated user shape
- `./trip-announcements.controller` — `TripAnnouncementsController` (subject under test)
- `./trip-announcements.service` — `TripAnnouncementsService` (mocked dependency)
- `./dto/create-trip-announcement.dto` — `CreateTripAnnouncementDto` for request body tests
- `./dto/trip-announcement-response.dto` — `TripAnnouncementResponseDto` type for response shape assertions
- `./dto/update-trip-announcement.dto` — `UpdateTripAnnouncementDto` for DTO validation tests
- `./dto/list-trip-announcements-query.dto` — `ListTripAnnouncementsQueryDto` for default value tests

### Definitions

- (no exported or substantial non-exported declarations — file is a test suite only)

### Exports

- (none)

---

## trip-announcements.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`, `Query` for HTTP routing and parameter binding
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiBadRequestResponse`, `ApiForbiddenResponse`, `ApiNoContentResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` for OpenAPI documentation
- `@/common/decorators/current-user.decorator` — `CurrentUser` parameter decorator to extract authenticated user
- `@/types/express` — `AuthenticatedUser` type for typed current-user parameter
- `./trip-announcements.service` — `TripAnnouncementsService` injected dependency
- `./dto/create-trip-announcement.dto` — `CreateTripAnnouncementDto` request body type
- `./dto/update-trip-announcement.dto` — `UpdateTripAnnouncementDto` request body type
- `./dto/trip-announcement-response.dto` — `TripAnnouncementResponseDto` response type
- `./dto/list-trip-announcements-query.dto` — `ListTripAnnouncementsQueryDto` query params type

### Definitions

- `TripAnnouncementsController` (controller) — NestJS REST controller under `v1/trips/:id/announcements` exposing create, findAll, findOne, update, and remove endpoints for trip announcements; organizer/co-organizer write access, accepted/confirmed participant read access

### Exports

- `TripAnnouncementsController` — named

---

## trip-announcements.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `NotFoundException` for exception assertion tests
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module bootstrapping
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripVisibility` for mock data construction
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for mock DB provider
- `@/modules/notifications/notifications.service` — `NotificationsService` (mocked dependency)
- `./trip-announcements.service` — `TripAnnouncementsService` (subject under test)
- `./dto/create-trip-announcement.dto` — `CreateTripAnnouncementDto` type for test payloads
- `./dto/update-trip-announcement.dto` — `UpdateTripAnnouncementDto` type for test payloads

### Definitions

- `makeParticipant` (function) — factory helper that builds a mock `tripParticipants` row given userId, role, and status
- `makeChain` (function) — factory helper that builds a chainable Drizzle query builder mock (from/innerJoin/where/orderBy/limit/offset/then) resolving to a given value

### Exports

- (none)

---

## trip-announcements.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException` for DI, logging, and HTTP exceptions
- `drizzle-orm` — `and`, `count`, `desc`, `eq`, `inArray` for query building
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripStatus` for domain enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/users/schema/users.schema` — `users` table reference
- `@/modules/trips/schema/trips.schema` — `trips` table reference
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` table reference
- `@/modules/notifications/notifications.service` — `NotificationsService` for dispatching push notifications
- `@/modules/trips/schema/trip-announcements.schema` — `tripAnnouncements` table reference
- `./dto/create-trip-announcement.dto` — `CreateTripAnnouncementDto` type
- `./dto/update-trip-announcement.dto` — `UpdateTripAnnouncementDto` type
- `./dto/trip-announcement-response.dto` — `TripAnnouncementResponseDto` type
- `./dto/list-trip-announcements-query.dto` — `ListTripAnnouncementsQueryDto` type

### Definitions

- `ORGANIZER_ROLES` (const) — readonly tuple `[TripRole.ORGANIZER, TripRole.CO_ORGANIZER]` used in DB queries for organizer authorization checks
- `READER_STATUSES` (const) — readonly tuple `[TripParticipantStatus.ACCEPTED, TripParticipantStatus.CONFIRMED]` used in DB queries for read access checks
- `TripAnnouncementsService` (service) — injectable NestJS service providing create, findOne, findAll, update, and remove operations for trip announcements; enforces organizer-only writes, accepted/confirmed participant reads, blocks announcements on DRAFT trips, and fire-and-forget dispatches push notifications to all accepted/confirmed participants (excluding the caller) on create

### Exports

- `TripAnnouncementsService` — named
