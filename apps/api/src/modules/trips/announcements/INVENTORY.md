# Inventory: announcements

---

## `trip-announcements.controller.ts`

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`, `Query`
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiBadRequestResponse`, `ApiForbiddenResponse`, `ApiNoContentResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse`
- `@/common/decorators/current-user.decorator` — `CurrentUser` parameter decorator to extract authenticated user
- `@/types/express` — `AuthenticatedUser` type for typed current-user parameter
- `./trip-announcements.service` — `TripAnnouncementsService` injected dependency
- `./dto/create-trip-announcement.dto` — `CreateTripAnnouncementDto` request body type
- `./dto/update-trip-announcement.dto` — `UpdateTripAnnouncementDto` request body type
- `./dto/trip-announcement-response.dto` — `TripAnnouncementResponseDto` response type
- `./dto/list-trip-announcements-query.dto` — `ListTripAnnouncementsQueryDto` query params type

### Definitions

- `TripAnnouncementsController` (controller) — NestJS REST controller at `v1/trips/:id/announcements` with create, findAll, findOne, update, and remove endpoints; organizer/co-organizer write access, accepted/confirmed participant read access

### Exports

- `TripAnnouncementsController` — named

---

## `trip-announcements.controller.spec.ts`

### Imports

- `class-transformer` — `plainToInstance` for DTO transformation in DTO-level tests
- `class-validator` — `validate` for constraint validation in DTO-level tests
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module bootstrapping
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` for mock user construction
- `@/types/express` — `AuthenticatedUser` type for typed mock user
- `./trip-announcements.controller` — `TripAnnouncementsController` subject under test
- `./trip-announcements.service` — `TripAnnouncementsService` mocked provider
- `./dto/create-trip-announcement.dto` — `CreateTripAnnouncementDto` for controller and DTO tests
- `./dto/trip-announcement-response.dto` — `TripAnnouncementResponseDto` type for mock return value
- `./dto/update-trip-announcement.dto` — `UpdateTripAnnouncementDto` for controller and DTO tests
- `./dto/list-trip-announcements-query.dto` — `ListTripAnnouncementsQueryDto` for defaults test

### Definitions

- (no exported or substantial non-exported declarations — test suite only)

### Exports

- (none)

---

## `trip-announcements.service.ts`

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException`
- `drizzle-orm` — `and`, `count`, `desc`, `eq`, `inArray` for query building
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripStatus`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/users/schema/users.schema` — `users` table reference
- `@/modules/trips/schema/trips.schema` — `trips` table reference
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` table reference
- `@/modules/notifications/notifications.service` — `NotificationsService` for push notification dispatch
- `@/modules/trips/schema/trip-announcements.schema` — `tripAnnouncements` table reference
- `@/modules/trips/participants/trip-participants.constants` — `ORGANIZER_ROLES` constant
- `./dto/create-trip-announcement.dto` — `CreateTripAnnouncementDto` type
- `./dto/update-trip-announcement.dto` — `UpdateTripAnnouncementDto` type
- `./dto/trip-announcement-response.dto` — `TripAnnouncementResponseDto` type
- `./dto/list-trip-announcements-query.dto` — `ListTripAnnouncementsQueryDto` type

### Definitions

- `READER_STATUSES` (const) — module-level tuple of `ACCEPTED` and `CONFIRMED` statuses used to gate read access
- `TripAnnouncementsService` (service) — manages trip announcements CRUD; enforces organizer-only writes, accepted/confirmed participant reads, blocks creates on DRAFT trips, and fire-and-forget dispatches push notifications to all eligible participants (excluding the caller) on create

### Exports

- `TripAnnouncementsService` — named

---

## `trip-announcements.service.spec.ts`

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `NotFoundException` for exception assertions
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module bootstrapping
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripVisibility` for mock data construction
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for mocked DB provider
- `@/modules/notifications/notifications.service` — `NotificationsService` mocked provider
- `./trip-announcements.service` — `TripAnnouncementsService` subject under test
- `./dto/create-trip-announcement.dto` — `CreateTripAnnouncementDto` type for test payloads
- `./dto/update-trip-announcement.dto` — `UpdateTripAnnouncementDto` type for test payloads

### Definitions

- `makeParticipant` (function) — factory helper that builds a mock `tripParticipants` row given userId, role, and status
- `makeChain` (function) — factory helper that returns a chainable Drizzle query builder mock (from/innerJoin/where/orderBy/limit/offset/then) resolving to a given value

### Exports

- (none)
