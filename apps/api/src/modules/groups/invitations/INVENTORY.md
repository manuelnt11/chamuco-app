# Inventory: invitations

---

## group-invitations.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` (routing and HTTP decorators)
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (parameter decorator to extract authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user object)
- `@/modules/groups/members/group-members.service` — `GroupMembersService` (provides `listMyInvitations`)
- `./group-invitations.service` — `GroupInvitationsService` (provides send/accept/decline/revoke invitation methods)
- `./dto/create-invitation.dto` — `CreateInvitationDto` (request body for sending invitations)
- `./dto/bulk-invitation-response.dto` — `BulkInvitationResponseDto` (response shape for bulk invitation results)
- `@/modules/groups/dto/my-invitation-response.dto` — `MyInvitationResponseDto` (response shape for listing caller's invitations)

### Definitions

- `GroupInvitationsController` (controller) — NestJS controller under `v1/groups` that exposes five endpoints: list my invitations, send invitations (bulk, admin-only), accept an invitation, decline an invitation, and revoke an invitation (admin-only)

### Exports

- `GroupInvitationsController` — named

---

## group-invitations.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` (enums for constructing the mock authenticated user)
- `./group-invitations.controller` — `GroupInvitationsController` (subject under test)
- `@/modules/groups/members/group-members.service` — `GroupMembersService` (mocked provider)
- `./group-invitations.service` — `GroupInvitationsService` (mocked provider)
- `./dto/create-invitation.dto` — `CreateInvitationDto` (type for test DTOs)
- `./dto/bulk-invitation-response.dto` — `BulkInvitationResponseDto` (type for mock return values)
- `@/modules/groups/dto/my-invitation-response.dto` — `MyInvitationResponseDto` (type for mock return values)
- `@/types/express` — `AuthenticatedUser` (type for the mock authenticated user)

### Definitions

- `mockAuthUser` (const) — stub `AuthenticatedUser` used across all tests
- `mockInvitationResponse` (const) — stub `MyInvitationResponseDto` used across all tests

### Exports

- none (test file)

---

## group-invitations.service.ts

### Imports

- `@nestjs/common` — `ConflictException`, `Inject`, `Injectable`, `Logger` (DI decorators and HTTP exception)
- `drizzle-orm` — `and`, `eq`, `inArray` (Drizzle query condition helpers)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `NotificationChannel`, `NotificationType` (domain enums)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and type for the Drizzle DB client)
- `@/modules/users/schema/users.schema` — `users` (Drizzle table reference)
- `@/modules/groups/schema/group-members.schema` — `groupMembers` (Drizzle table reference)
- `@/modules/groups/schema/group-member-stats.schema` — `groupMemberStats` (Drizzle table reference)
- `@/modules/groups/schema/groups.schema` — `groups` (Drizzle table reference)
- `@/modules/notifications/notifications.service` — `NotificationsService` (sends push/email notifications)
- `@/modules/groups/members/group-members.service` — `GroupMembersService` (provides `assertGroupAdmin` and `findMemberOrThrow`)
- `./dto/create-invitation.dto` — `CreateInvitationDto` (input type for `sendInvitations`)
- `./dto/bulk-invitation-response.dto` — `BulkInvitationResponseDto`, `InvitationResultDto` (output types for `sendInvitations`)

### Definitions

- `ADMIN_ROLES` (const) — tuple of `[GroupRole.OWNER, GroupRole.ADMIN]` used to filter admin members when notifying
- `GroupInvitationsService` (service) — injectable NestJS service that implements all invitation lifecycle operations: `sendInvitations` (bulk, with per-user status results and notification), `acceptInvitation` (INVITED → ACTIVE with stats upsert and admin notification), `declineInvitation` (INVITED → REJECTED), and `revokeInvitation` (admin deletes an INVITED row)

### Exports

- `GroupInvitationsService` — named

---

## group-invitations.service.spec.ts

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException` (exception classes asserted in tests)
- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `NotificationChannel`, `NotificationType` (enums for constructing stubs and asserting calls)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for mock DB)
- `./group-invitations.service` — `GroupInvitationsService` (subject under test)
- `@/modules/groups/members/group-members.service` — `GroupMembersService` (mocked provider)
- `@/modules/notifications/notifications.service` — `NotificationsService` (mocked provider)
- `./dto/create-invitation.dto` — `CreateInvitationDto` (type for test DTOs)

### Definitions

- `makeMembership` (function) — factory that constructs a partial group membership object for a given userId, status, and role

### Exports

- none (test file)
