# Inventory: join-requests

---

## group-join-requests.controller.ts

### Imports

- `@nestjs/common` — `Controller`, `Delete`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` (routing and HTTP utilities)
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (extracts authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user object)
- `./group-join-requests.service` — `GroupJoinRequestsService` (service handling join-request business logic)

### Definitions

- `GroupJoinRequestsController` (controller) — REST controller mounted at `v1/groups/:id`; exposes submit, accept, reject, and withdraw join-request endpoints
- `submitJoinRequest` (function) — `POST /v1/groups/:id/join-request`
- `acceptJoinRequest` (function) — `PATCH /v1/groups/:id/join-requests/:userId/accept`
- `rejectJoinRequest` (function) — `PATCH /v1/groups/:id/join-requests/:userId/reject`
- `withdrawJoinRequest` (function) — `DELETE /v1/groups/:id/join-request`; authenticated user withdraws their own pending join request

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

- `GroupJoinRequestsController` test suite (class) — verifies that each controller method (including `withdrawJoinRequest`) delegates correctly to `GroupJoinRequestsService` with the right arguments

### Exports

- none

---

## group-join-requests.service.ts

### Imports

- `@nestjs/common` — `ConflictException`, `Inject`, `Injectable`, `Logger` (DI, logging, and HTTP exceptions)
- `drizzle-orm` — `and`, `eq`, `inArray`, `isNull` (query condition builders)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `NotificationChannel`, `NotificationType` (domain enums for membership states and notifications)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and typed Drizzle client)
- `@/modules/groups/schema/group-members.schema` — `groupMembers` (Drizzle table reference)
- `@/modules/groups/schema/group-member-stats.schema` — `groupMemberStats` (Drizzle table reference)
- `@/modules/groups/schema/groups.schema` — `groups` (Drizzle table reference; its `coverAsset` relation is used via `with:` in `listMyPendingRequests`)
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (resolves cover asset rows to ready-to-use URLs)
- `@/modules/assets/asset.utils` — `assetRowToAsset` (converts a raw asset row into the `Asset` domain shape)
- `@/modules/notifications/notifications.service` — `NotificationsService` (sends push notifications after state transitions)
- `@/modules/groups/members/group-members.service` — `GroupMembersService` (shared helpers: `assertGroupExists`, `assertGroupAdmin`, `findMemberOrThrow`)
- `./dto/my-group-join-request-response.dto` — `MyGroupJoinRequestResponseDto` (type-only import for `listMyPendingRequests`' return shape)

### Definitions

- `GroupJoinRequestsService` (service) — handles the full lifecycle of group join requests: submit (insert or update back to REQUEST), accept (REQUEST → ACTIVE inside a transaction + stats upsert + push notification), reject (REQUEST → REJECTED), withdraw (atomic delete filtered by REQUEST status — a zero-row `.returning()` result means the request was already accepted/rejected concurrently, surfaced as `ConflictException` rather than racing), and `listMyPendingRequests` (lists the authenticated user's own pending REQUESTs across groups, with `coverUrl` resolved via the relational `coverAsset` join and defaulted to `null` — never thrown — when the cover can't be resolved)

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
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (mocked dependency)

### Definitions

- `GroupJoinRequestsService` test suite (class) — full unit-test coverage for `submitJoinRequest`, `acceptJoinRequest`, `rejectJoinRequest`, `withdrawJoinRequest` (including the concurrent-accept race, where a matching `findMemberOrThrow` read is followed by a zero-row atomic delete), and `listMyPendingRequests` (mapped cover URL, null cover asset, and failed-resolve cases — none of which throw)

### Exports

- none

---

## dto/my-group-join-request-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field documentation)
- `@chamuco/shared-types` — `GroupVisibility` (enum for the `visibility` field)

### Definitions

- `MyGroupJoinRequestResponseDto` (class) — response shape for `GET /v1/groups/join-requests/mine`: `groupId`, `name`, `coverUrl` (nullable — null when the cover asset can't be resolved), `visibility`, `initiatedAt`

### Exports

- `MyGroupJoinRequestResponseDto` — named
