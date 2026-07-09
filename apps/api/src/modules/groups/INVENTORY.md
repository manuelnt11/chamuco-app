# Inventory: groups

---

## groups.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for building the test module
- `@chamuco/shared-types` — `AuthProvider`, `GroupVisibility`, `PlatformRole`, `ProfileVisibility` enums used in fixtures
- `./groups.controller` — `GroupsController` (class under test)
- `./groups.service` — `GroupsService` (mocked provider)
- `./discovery/groups-discovery.service` — `GroupsDiscoveryService` (mocked provider)
- `./dto/create-group.dto` — `CreateGroupDto` type
- `./dto/update-group.dto` — `UpdateGroupDto` type
- `./dto/group-response.dto` — `GroupResponseDto` type
- `./dto/group-search-result.dto` — `GroupSearchResponseDto` type
- `./dto/search-groups-query.dto` — `SearchGroupsQueryDto` type
- `@/types/express` — `AuthenticatedUser` type

### Definitions

- `mockAuthUser` (const) — fixture representing a fully-populated authenticated user (PlatformRole.USER)
- `mockGroupResponse` (const) — fixture representing a `GroupResponseDto` with PUBLIC visibility
- `GroupsController` describe block (function) — unit tests covering createGroup, listMyGroups, searchGroups, getGroup, updateGroup, deleteGroup; verifies each handler delegates to the correct service method

### Exports

- none

---

## groups.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`, `Query` HTTP/routing decorators and pipes
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBearerAuth`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiQuery`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` OpenAPI documentation decorators
- `@/common/decorators/current-user.decorator` — `CurrentUser` parameter decorator that extracts the authenticated user from the request
- `@/types/express` — `AuthenticatedUser` type
- `./groups.service` — `GroupsService` for create/get/update/delete operations
- `./discovery/groups-discovery.service` — `GroupsDiscoveryService` for list and search operations
- `./dto/create-group.dto` — `CreateGroupDto`
- `./dto/update-group.dto` — `UpdateGroupDto`
- `./dto/group-response.dto` — `GroupResponseDto`
- `./dto/search-groups-query.dto` — `SearchGroupsQueryDto`
- `./dto/group-search-result.dto` — `GroupSearchResponseDto`

### Definitions

- `GroupsController` (controller) — REST controller at `v1/groups`; exposes POST (create), GET (list own), GET search (discover public), GET :id (fetch one), PATCH :id (update), DELETE :id (soft-delete); delegates to `GroupsService` and `GroupsDiscoveryService`

### Exports

- `GroupsController` — named

---

## groups.module.ts

### Imports

- `@nestjs/common` — `Module` decorator
- `@/modules/notifications/notifications.module` — `NotificationsModule` (imported for notification side-effects used by sub-services)
- `./invitations/group-invitations.controller` — `GroupInvitationsController`
- `./members/group-members.controller` — `GroupMembersController`
- `./join-requests/group-join-requests.controller` — `GroupJoinRequestsController`
- `./announcements/group-announcements.controller` — `GroupAnnouncementsController`
- `./groups.controller` — `GroupsController`
- `./groups.service` — `GroupsService`
- `./discovery/groups-discovery.service` — `GroupsDiscoveryService`
- `./members/group-members.service` — `GroupMembersService`
- `./invitations/group-invitations.service` — `GroupInvitationsService`
- `./join-requests/group-join-requests.service` — `GroupJoinRequestsService`
- `./announcements/group-announcements.service` — `GroupAnnouncementsService`

### Definitions

- `GroupsModule` (module) — NestJS feature module that wires all group-domain controllers and services; registers controllers in order so literal routes (`/invitations`) precede parameterized (`/:id`); exports `GroupsService` for use by other modules

### Exports

- `GroupsModule` — named

---

## groups.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `NotFoundException` for assertion checks
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `AuthProvider`, `GroupMemberStatus`, `GroupRole`, `GroupVisibility`, `PlatformRole`, `ProfileVisibility` enums used in fixtures
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token (mocked)
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (mocked)
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` (mocked)
- `./groups.service` — `GroupsService` (class under test)
- `./dto/create-group.dto` — `CreateGroupDto` type
- `./dto/update-group.dto` — `UpdateGroupDto` type
- `@/types/express` — `AuthenticatedUser` type

### Definitions

- `mockUser` (const) — fixture for a standard authenticated user
- `mockCoverAssetRow` (const) — fixture for an emoji asset DB row
- `mockGroupRow` (const) — fixture for a group DB row
- `mockGroupRowWithCover` (const) — `mockGroupRow` extended with embedded `coverAsset` (relational query shape)
- `mockOwnerMembership` (const) — fixture for an ACTIVE/OWNER group-member row
- `mockResolvedCover` (const) — fixture for a resolved asset with a public URL
- `GroupsService` describe block (function) — unit tests for createGroup, findById, getGroup, updateGroup, deleteGroup; covers GCS interactions, transaction paths, cover replacement, visibility checks, and error cases

### Exports

- none

---

## groups.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `Inject`, `Injectable`, `NotFoundException`
- `drizzle-orm` — `and`, `count`, `eq`, `inArray`, `isNull`, `ne` query helpers
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `GroupVisibility` enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/assets/schema/assets.schema` — `assets` Drizzle table
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` for URL resolution
- `@/modules/assets/asset.utils` — `assetRowToAsset` conversion helper
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` for GCS operations
- `@/modules/cloud-storage/cloud-storage.constants` — `PUBLIC_OBJECT_PREFIXES` set of GCS prefixes that require `makePublic`
- `@/types/express` — `AuthenticatedUser` type
- `./schema/groups.schema` — `groups` Drizzle table
- `./schema/group-members.schema` — `groupMembers` Drizzle table
- `./schema/group-member-stats.schema` — `groupMemberStats` Drizzle table
- `./dto/create-group.dto` — `CreateGroupDto` type
- `./dto/update-group.dto` — `UpdateGroupDto` type
- `./dto/group-response.dto` — `GroupResponseDto` type

### Definitions

- `GroupsService` (service) — core service for group CRUD; manages cover asset lifecycle (create/replace/delete via GCS + Drizzle), enforces visibility rules (PRIVATE→PUBLIC guard), soft-deletes groups (nulls cover FK before asset cleanup), and maps DB rows to `GroupResponseDto`
- `createGroup` (function) — transactional: inserts cover asset, group row, creator membership, and member-stats row; calls `makePublic` post-commit for public-prefix GCS covers
- `findById` (function) — returns the group row or null; filters soft-deleted rows
- `getGroup` (function) — returns `GroupResponseDto`; enforces PRIVATE group membership check before fetching
- `updateGroup` (function) — patches metadata and/or replaces cover asset in a transaction; enforces admin role and PRIVATE→PUBLIC non-owner-member guard; cleans up old GCS asset post-commit
- `deleteGroup` (function) — owner-only soft-delete; nulls cover FK, then deletes asset record and GCS object post-commit
- `fetchAndMapGroup` (function) — private helper; fetches group with embedded `coverAsset`, resolves cover URL via `AssetResolverService`, and builds `GroupResponseDto`

### Exports

- `GroupsService` — named
