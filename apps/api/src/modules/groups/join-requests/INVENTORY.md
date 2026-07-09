# Inventory: join-requests

---

## group-join-requests.controller.ts

### Imports

- `@nestjs/common` — `Controller`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` (routing and HTTP utilities)
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (extracts authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user object)
- `./group-join-requests.service` — `GroupJoinRequestsService` (service handling join-request business logic)

### Definitions

- `GroupJoinRequestsController` (controller) — REST controller mounted at `v1/groups/:id`; exposes submit, accept, and reject join-request endpoints

### Exports

- `GroupJoinRequestsController` — named

---

## group-join-requests.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` (enums used to build mock authenticated user)
- `./group-join-requests.controller` — `GroupJoinRequestsController` (class under test)
- `./group-join-requests.service` — `GroupJoinRequestsService` (mocked dependency)
- `@/types/express` — `AuthenticatedUser` (type for mock user fixture)

### Definitions

- `GroupJoinRequestsController` test suite (class) — verifies that each controller method delegates correctly to `GroupJoinRequestsService` with the right arguments

### Exports

- none

---

## group-join-requests.service.ts

### Imports

- `@nestjs/common` — `ConflictException`, `Inject`, `Injectable`, `Logger` (DI, logging, and HTTP exceptions)
- `drizzle-orm` — `and`, `eq` (query condition builders)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `NotificationChannel`, `NotificationType` (domain enums for membership states and notifications)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and typed Drizzle client)
- `@/modules/groups/schema/group-members.schema` — `groupMembers` (Drizzle table reference)
- `@/modules/groups/schema/group-member-stats.schema` — `groupMemberStats` (Drizzle table reference)
- `@/modules/groups/schema/groups.schema` — `groups` (Drizzle table reference)
- `@/modules/notifications/notifications.service` — `NotificationsService` (sends push notifications after state transitions)
- `@/modules/groups/members/group-members.service` — `GroupMembersService` (shared helpers: `assertGroupExists`, `assertGroupAdmin`, `findMemberOrThrow`)

### Definitions

- `GroupJoinRequestsService` (service) — handles the full lifecycle of group join requests: submit (insert or update back to REQUEST), accept (REQUEST → ACTIVE inside a transaction + stats upsert + push notification), reject (REQUEST → REJECTED), and withdraw (delete REQUEST row)

### Exports

- `GroupJoinRequestsService` — named

---

## group-join-requests.service.spec.ts

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException` (exception classes asserted in tests)
- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `NotificationChannel`, `NotificationType`, `GroupVisibility` (enums for fixture construction and assertion)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for mocked Drizzle client)
- `./group-join-requests.service` — `GroupJoinRequestsService` (class under test)
- `@/modules/groups/members/group-members.service` — `GroupMembersService` (mocked dependency)
- `@/modules/notifications/notifications.service` — `NotificationsService` (mocked dependency)

### Definitions

- `GroupJoinRequestsService` test suite (class) — full unit-test coverage for `submitJoinRequest`, `acceptJoinRequest`, `rejectJoinRequest`, and `withdrawJoinRequest`; uses Drizzle query-builder mocks and verifies all conflict, forbidden, and not-found paths

### Exports

- none
