# Inventory: announcements

---

## group-announcements.controller.ts

### Imports

- `@nestjs/common` — Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query (HTTP method decorators, param binding, status codes)
- `@nestjs/swagger` — ApiBearerAuth, ApiBody, ApiBadRequestResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — CurrentUser (param decorator to extract authenticated user from request)
- `@/types/express` — AuthenticatedUser (type for the authenticated user object)
- `./group-announcements.service` — GroupAnnouncementsService (business logic provider)
- `./dto/create-announcement.dto` — CreateAnnouncementDto (request body for creation)
- `./dto/update-announcement.dto` — UpdateAnnouncementDto (request body for updates)
- `./dto/announcement-response.dto` — AnnouncementResponseDto (response shape)
- `./dto/list-announcements-query.dto` — ListAnnouncementsQueryDto (pagination query params)

### Definitions

- `GroupAnnouncementsController` (controller) — REST controller mounted at `v1/groups/:id`; exposes create, findAll, findOne, update, and remove endpoints for group announcements; writes require admin/owner role, reads require active membership

### Exports

- `GroupAnnouncementsController` — named

---

## group-announcements.controller.spec.ts

### Imports

- `class-transformer` — plainToInstance (instantiates DTOs from plain objects for validation tests)
- `class-validator` — validate (runs class-validator decorators against DTO instances)
- `@nestjs/testing` — Test, TestingModule (NestJS test harness)
- `@chamuco/shared-types` — AuthProvider, PlatformRole, ProfileVisibility (enums used to build the mock authenticated user)
- `@/types/express` — AuthenticatedUser (type for mock user fixture)
- `./group-announcements.controller` — GroupAnnouncementsController (unit under test)
- `./group-announcements.service` — GroupAnnouncementsService (mocked dependency)
- `./dto/create-announcement.dto` — CreateAnnouncementDto (DTO under validation test)
- `./dto/announcement-response.dto` — AnnouncementResponseDto (type for mock response fixture)
- `./dto/update-announcement.dto` — UpdateAnnouncementDto (DTO under validation test)
- `./dto/list-announcements-query.dto` — ListAnnouncementsQueryDto (DTO default-value test)

### Definitions

- No substantial non-exported declarations (test suites and fixtures only).

### Exports

- None (test file)

---

## group-announcements.service.ts

### Imports

- `@nestjs/common` — ForbiddenException, Inject, Injectable, Logger, NotFoundException (DI decorators and HTTP exceptions)
- `drizzle-orm` — and, count, desc, eq, inArray, isNull (query builder operators)
- `@chamuco/shared-types` — GroupMemberStatus, GroupRole, NotificationChannel, NotificationType (domain enums)
- `@/database/drizzle.provider` — DRIZZLE_CLIENT, DrizzleClient (injection token and typed DB client)
- `@/modules/users/schema/users.schema` — users (Drizzle table reference)
- `@/modules/groups/schema/groups.schema` — groups (Drizzle table reference)
- `@/modules/groups/schema/group-members.schema` — groupMembers (Drizzle table reference)
- `@/modules/notifications/notifications.service` — NotificationsService (push notification dispatch)
- `@/modules/groups/schema/group-announcements.schema` — groupAnnouncements (Drizzle table reference)
- `./dto/create-announcement.dto` — CreateAnnouncementDto (input type)
- `./dto/update-announcement.dto` — UpdateAnnouncementDto (input type)
- `./dto/announcement-response.dto` — AnnouncementResponseDto (output type)
- `./dto/list-announcements-query.dto` — ListAnnouncementsQueryDto (pagination input type)

### Definitions

- `ADMIN_ROLES` (const) — tuple `[GroupRole.OWNER, GroupRole.ADMIN]` used in `inArray` guard checks
- `GroupAnnouncementsService` (service) — implements create, findOne, findAll, update, remove for group announcements; enforces admin-only writes via `assertGroupAdmin`, member-only reads via `assertActiveMember`, and fires fire-and-forget push notifications on creation

### Exports

- `GroupAnnouncementsService` — named

---

## group-announcements.service.spec.ts

### Imports

- `@nestjs/common` — ForbiddenException, NotFoundException (exception classes asserted in tests)
- `@nestjs/testing` — Test, TestingModule (NestJS test harness)
- `@chamuco/shared-types` — GroupMemberStatus, GroupRole, GroupVisibility, NotificationChannel, NotificationType (enums used to build mock fixtures)
- `@/database/drizzle.provider` — DRIZZLE_CLIENT (injection token for mock DB client)
- `@/modules/notifications/notifications.service` — NotificationsService (mocked dependency)
- `./group-announcements.service` — GroupAnnouncementsService (unit under test)
- `./dto/create-announcement.dto` — CreateAnnouncementDto (input type for test DTOs)
- `./dto/update-announcement.dto` — UpdateAnnouncementDto (input type for test DTOs)

### Definitions

- `makeChain` (function) — builds a thenable Drizzle query-builder chain mock where every method (from, innerJoin, where, orderBy, limit, offset) returns itself and `await chain` resolves to the provided value; used to simulate select queries

### Exports

- None (test file)
