# Inventory: announcements

---

## `group-announcements.controller.ts`

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`, `Query` for routing and request handling
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiBadRequestResponse`, `ApiForbiddenResponse`, `ApiNoContentResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` for OpenAPI documentation
- `@/common/decorators/current-user.decorator` — `CurrentUser` parameter decorator to extract the authenticated user
- `@/types/express` — `AuthenticatedUser` type for the injected user object
- `./group-announcements.service` — `GroupAnnouncementsService` for business logic delegation
- `./dto/create-announcement.dto` — `CreateAnnouncementDto` request body type
- `./dto/update-announcement.dto` — `UpdateAnnouncementDto` request body type
- `./dto/announcement-response.dto` — `AnnouncementResponseDto` response shape
- `./dto/list-announcements-query.dto` — `ListAnnouncementsQueryDto` pagination query params

### Definitions

- `GroupAnnouncementsController` (controller) — NestJS controller mounted at `v1/groups/:id` handling CRUD for group announcements; enforces admin-only writes and member-only reads via the service layer

### Exports

- `GroupAnnouncementsController` — named

---

## `group-announcements.controller.spec.ts`

### Imports

- `class-transformer` — `plainToInstance` to instantiate and transform DTOs in validation tests
- `class-validator` — `validate` to run decorator-based validation in DTO tests
- `@nestjs/testing` — `Test`, `TestingModule` for building the NestJS test module
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` for constructing the mock authenticated user
- `@/types/express` — `AuthenticatedUser` type for the mock user fixture
- `./group-announcements.controller` — `GroupAnnouncementsController` under test
- `./group-announcements.service` — `GroupAnnouncementsService` to provide a mock
- `./dto/create-announcement.dto` — `CreateAnnouncementDto` for DTO validation tests
- `./dto/announcement-response.dto` — `AnnouncementResponseDto` type for mock data
- `./dto/update-announcement.dto` — `UpdateAnnouncementDto` for DTO validation tests
- `./dto/list-announcements-query.dto` — `ListAnnouncementsQueryDto` for defaults test

### Definitions

- (no exported declarations; file contains Jest `describe` suites covering `GroupAnnouncementsController`, `CreateAnnouncementDto`, `UpdateAnnouncementDto`, and `ListAnnouncementsQueryDto`)

### Exports

- (none — test file)

---

## `group-announcements.service.ts`

### Imports

- `@nestjs/common` — `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException` for DI, logging, and HTTP exceptions
- `drizzle-orm` — `and`, `count`, `desc`, `eq`, `inArray`, `isNull` for query composition
- `@chamuco/shared-types` — `GROUP_ADMIN_ROLES`, `GroupMemberStatus`, `NotificationChannel`, `NotificationType` for role/status constants and notification enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token and `DrizzleClient` type
- `@/modules/users/schema/users.schema` — `users` table reference for username joins
- `@/modules/groups/schema/groups.schema` — `groups` table reference for existence checks
- `@/modules/groups/schema/group-members.schema` — `groupMembers` table reference for membership checks
- `@/modules/notifications/notifications.service` — `NotificationsService` for fire-and-forget push dispatch
- `@/modules/groups/schema/group-announcements.schema` — `groupAnnouncements` table reference
- `./dto/create-announcement.dto` — `CreateAnnouncementDto` input type
- `./dto/update-announcement.dto` — `UpdateAnnouncementDto` input type
- `./dto/announcement-response.dto` — `AnnouncementResponseDto` return type
- `./dto/list-announcements-query.dto` — `ListAnnouncementsQueryDto` pagination input type

### Definitions

- `GroupAnnouncementsService` (service) — injectable service providing announcement CRUD with role-based access control and fire-and-forget push notification dispatch to active members
- `create` (function) — inserts a new announcement and asynchronously notifies all active members except the caller via push
- `findOne` (function) — fetches a single announcement by ID for active group members; joins `users` for the author username
- `findAll` (function) — returns paginated announcements in reverse-chronological order with a total count for active members
- `update` (function) — updates announcement content for group admins/owners; re-fetches author username for the response
- `remove` (function) — hard-deletes an announcement for group admins/owners
- `assertGroupAdmin` (function) — private guard; throws `NotFoundException` or `ForbiddenException` unless the caller is an active admin or owner
- `assertActiveMember` (function) — private guard; throws `ForbiddenException` unless the caller is an active group member
- `assertGroupExists` (function) — private guard; throws `NotFoundException` if the group is soft-deleted or absent
- `toDto` (function) — private mapper from a Drizzle row subset to `AnnouncementResponseDto`

### Exports

- `GroupAnnouncementsService` — named

---

## `group-announcements.service.spec.ts`

### Imports

- `@nestjs/common` — `ForbiddenException`, `NotFoundException` for asserting thrown exceptions
- `@nestjs/testing` — `Test`, `TestingModule` for the NestJS test module
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `GroupVisibility`, `NotificationChannel`, `NotificationType` for mock data and assertion values
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for the mock DB provider
- `@/modules/notifications/notifications.service` — `NotificationsService` to provide a mock
- `./group-announcements.service` — `GroupAnnouncementsService` under test
- `./dto/create-announcement.dto` — `CreateAnnouncementDto` type for test inputs
- `./dto/update-announcement.dto` — `UpdateAnnouncementDto` type for test inputs

### Definitions

- `makeChain` (function) — builds a thenable Drizzle query-builder chain mock where every chainable method returns itself and `await` resolves to the supplied value; used across all service method tests

### Exports

- (none — test file)
