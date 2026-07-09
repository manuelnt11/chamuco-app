# Inventory: members

---

## `group-members.controller.ts`

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse`
- `@/common/decorators/current-user.decorator` — `CurrentUser` decorator for extracting authenticated user
- `@/types/express` — `AuthenticatedUser` type
- `./group-members.service` — `GroupMembersService`
- `./dto/update-member-role.dto` — `UpdateMemberRoleDto`
- `./dto/member-response.dto` — `MemberResponseDto`
- `./dto/my-membership-response.dto` — `MyMembershipResponseDto`
- `./dto/pending-item-response.dto` — `PendingItemResponseDto`

### Definitions

- `GroupMembersController` (controller) — NestJS controller at `v1/groups/:id` handling member removal/leave, role updates, active member listing, pending member listing, and own membership query

### Exports

- `GroupMembersController` — named

---

## `group-members.controller.spec.ts`

### Imports

- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `AuthProvider`, `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `PlatformRole`, `ProfileVisibility`
- `./group-members.controller` — `GroupMembersController`
- `./group-members.service` — `GroupMembersService`
- `./dto/update-member-role.dto` — `UpdateMemberRoleDto` (type)
- `./dto/member-response.dto` — `MemberResponseDto` (type)
- `./dto/pending-item-response.dto` — `PendingItemResponseDto` (type)
- `@/types/express` — `AuthenticatedUser` (type)

### Definitions

- `mockAuthUser` (const) — fixture for an authenticated admin user
- `mockMemberResponse` (const) — fixture for a `MemberResponseDto`
- `mockPendingResponse` (const) — fixture for a `PendingItemResponseDto`

### Exports

- none

---

## `group-members.service.ts`

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException`
- `drizzle-orm` — `and`, `count`, `eq`, `inArray`, `isNull`
- `@chamuco/shared-types` — `GROUP_ADMIN_ROLES`, `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `NotificationChannel`, `NotificationType`
- `@/modules/assets/asset.utils` — `assetRowToAsset` conversion utility
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` token, `DrizzleClient` type
- `@/modules/users/schema/users.schema` — `users` Drizzle table
- `@/modules/assets/schema/assets.schema` — `assets` Drizzle table
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` for resolving asset URLs
- `@/modules/notifications/notifications.service` — `NotificationsService` for sending push notifications
- `@/modules/groups/schema/groups.schema` — `groups` Drizzle table
- `@/modules/groups/schema/group-members.schema` — `groupMembers` Drizzle table
- `@/modules/groups/schema/group-member-stats.schema` — `groupMemberStats` Drizzle table
- `./dto/update-member-role.dto` — `UpdateMemberRoleDto` (type)
- `./dto/member-response.dto` — `MemberResponseDto` (type)
- `./dto/pending-item-response.dto` — `PendingItemResponseDto` (type)
- `./dto/my-membership-response.dto` — `MyMembershipResponseDto` (type)
- `@/modules/groups/dto/my-invitation-response.dto` — `MyInvitationResponseDto` (type)

### Definitions

- `GroupMembersService` (service) — injectable service for group member management; exposes public helpers reused by `GroupJoinRequestsService` and `GroupInvitationsService`
- `removeMember` (function) — removes/kicks a member (REMOVED), lets a user leave (LEFT), or cancels a pending request/invitation (DELETE row); dissolves the group when the last active member leaves
- `updateMemberRole` (function) — promotes or demotes a member between MEMBER and ADMIN; handles OWNER transfer atomically in a transaction
- `getMyMembership` (function) — returns the caller's current membership status and role for a group
- `listMyInvitations` (function) — returns all INVITED memberships for the caller enriched with group info and resolved cover URL
- `listActiveMembers` (function) — returns all ACTIVE members with role, tier, and resolved avatar URL; requires caller to be an active member
- `listPendingMembers` (function) — returns all REQUEST and INVITED records with user info; requires caller to be a group admin
- `findMemberOrThrow` (function) — public helper: fetches any membership record or throws NotFoundException
- `assertGroupExists` (function) — public helper: fetches a non-deleted group or throws NotFoundException
- `assertGroupAdmin` (function) — public helper: throws ForbiddenException if caller lacks an active admin role
- `assertActiveMember` (function) — private helper: throws ForbiddenException if caller is not an active member
- `assertNotSoleAdmin` (function) — private helper: throws ConflictException if the target is the last admin in the group
- `batchResolveAvatarUrls` (function) — private helper: resolves avatar URLs for a list of user rows in parallel, returns a userId-to-URL map

### Exports

- `GroupMembersService` — named

---

## `group-members.service.spec.ts`

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException`
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `GroupVisibility`, `NotificationChannel`, `NotificationType`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token
- `@/modules/assets/asset-resolver.service` — `AssetResolverService`
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `./group-members.service` — `GroupMembersService`
- `./dto/update-member-role.dto` — `UpdateMemberRoleDto` (type)

### Definitions

- `makeMembership` (function) — factory helper that builds a mock `groupMembers` row for a given userId, status, and role

### Exports

- none
