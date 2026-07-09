# Inventory: members

---

## group-members.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch` (routing and HTTP utilities)
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (extracts authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user object)
- `./group-members.service` — `GroupMembersService` (business logic delegate)
- `./dto/update-member-role.dto` — `UpdateMemberRoleDto` (request body for role update)
- `./dto/member-response.dto` — `MemberResponseDto` (response shape for active members)
- `./dto/my-membership-response.dto` — `MyMembershipResponseDto` (response shape for own membership)
- `./dto/pending-item-response.dto` — `PendingItemResponseDto` (response shape for pending items)

### Definitions

- `GroupMembersController` (controller) — REST controller at `v1/groups/:id` handling member removal, role updates, and member listing endpoints

### Exports

- `GroupMembersController` — named

---

## group-members.service.ts

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException` (NestJS DI and HTTP exception utilities)
- `drizzle-orm` — `and`, `count`, `eq`, `inArray`, `isNull` (query builder operators)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `NotificationChannel`, `NotificationType` (shared domain enums)
- `@/modules/assets/asset.utils` — `assetRowToAsset` (converts DB asset row to domain Asset object)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and type for the Drizzle DB client)
- `@/modules/users/schema/users.schema` — `users` (Drizzle table reference)
- `@/modules/assets/schema/assets.schema` — `assets` (Drizzle table reference)
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (resolves asset to a signed or public URL)
- `@/modules/notifications/notifications.service` — `NotificationsService` (sends push/in-app notifications)
- `@/modules/groups/schema/groups.schema` — `groups` (Drizzle table reference)
- `@/modules/groups/schema/group-members.schema` — `groupMembers` (Drizzle table reference)
- `@/modules/groups/schema/group-member-stats.schema` — `groupMemberStats` (Drizzle table reference)
- `./dto/update-member-role.dto` — `UpdateMemberRoleDto` (type for role update input)
- `./dto/member-response.dto` — `MemberResponseDto` (type for active member response)
- `./dto/pending-item-response.dto` — `PendingItemResponseDto` (type for pending item response)
- `./dto/my-membership-response.dto` — `MyMembershipResponseDto` (type for own membership response)
- `@/modules/groups/dto/my-invitation-response.dto` — `MyInvitationResponseDto` (type for invitation listing response)

### Definitions

- `ADMIN_ROLES` (const) — tuple `[GroupRole.OWNER, GroupRole.ADMIN]` used for admin-level permission checks
- `GroupMembersService` (service) — handles member removal/leave, role promotion/demotion, active member listing, pending member listing, own membership query, and invitation listing; also exposes shared helper methods used by join-request and invitation services

### Exports

- `GroupMembersService` — named

---

## group-members.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS unit test utilities)
- `@chamuco/shared-types` — `AuthProvider`, `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `PlatformRole`, `ProfileVisibility` (shared enums for fixture data)
- `./group-members.controller` — `GroupMembersController` (class under test)
- `./group-members.service` — `GroupMembersService` (mocked dependency)
- `./dto/update-member-role.dto` — `UpdateMemberRoleDto` (type for test DTO)
- `./dto/member-response.dto` — `MemberResponseDto` (type for expected response fixture)
- `./dto/pending-item-response.dto` — `PendingItemResponseDto` (type for expected response fixture)
- `@/types/express` — `AuthenticatedUser` (type for mock authenticated user)

### Definitions

- `GroupMembersController` test suite — verifies that each controller method delegates to the correct `GroupMembersService` method with the correct arguments; also verifies that `NotFoundException` propagates from `getMyMembership`

### Exports

- _(none — test file)_

---

## group-members.service.spec.ts

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException` (assertion targets in tests)
- `@nestjs/testing` — `Test`, `TestingModule` (NestJS unit test utilities)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `GroupVisibility`, `NotificationChannel`, `NotificationType` (shared enums for fixture data and assertions)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for mocked Drizzle client)
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (mocked dependency)
- `@/modules/notifications/notifications.service` — `NotificationsService` (mocked dependency)
- `./group-members.service` — `GroupMembersService` (class under test)
- `./dto/update-member-role.dto` — `UpdateMemberRoleDto` (type for test DTOs)

### Definitions

- `GroupMembersService` test suite — comprehensive unit tests covering `removeMember` (self-leave, admin remove, withdrawal, sole-admin guard, group dissolution, notification), `updateMemberRole` (promote, demote, ownership transfer, sole-admin guard, notification), `listActiveMembers` (auth guard, avatar resolution, tier fallback), `listPendingMembers` (auth guard, mixed-status listing), `listMyInvitations` (empty, cover resolution, soft-delete filter), and `getMyMembership` (happy path and 404 cases)

### Exports

- _(none — test file)_
