# Inventory: invitations

---

## `group-invitations.controller.ts`

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse`
- `@/common/decorators/current-user.decorator` — `CurrentUser` parameter decorator
- `@/types/express` — `AuthenticatedUser` type
- `@/modules/groups/members/group-members.service` — `GroupMembersService`
- `./group-invitations.service` — `GroupInvitationsService`
- `./dto/create-invitation.dto` — `CreateInvitationDto`
- `./dto/bulk-invitation-response.dto` — `BulkInvitationResponseDto`
- `@/modules/groups/dto/my-invitation-response.dto` — `MyInvitationResponseDto`

### Definitions

- `GroupInvitationsController` (controller) — NestJS controller mounted at `v1/groups` handling the full group invitation lifecycle
- `listMyInvitations` (function) — GET `/v1/groups/invitations`; returns all pending invitations for the authenticated user
- `sendInvitations` (function) — POST `/v1/groups/:id/invitations`; sends bulk invitations by username; admin only; returns per-user results
- `acceptInvitation` (function) — PATCH `/v1/groups/:id/invitations/accept`; transitions caller's INVITED record to ACTIVE
- `declineInvitation` (function) — PATCH `/v1/groups/:id/invitations/decline`; transitions caller's INVITED record to REJECTED
- `revokeInvitation` (function) — DELETE `/v1/groups/:id/invitations/:userId`; deletes an invitee's INVITED record; admin only

### Exports

- `GroupInvitationsController` — named

---

## `group-invitations.controller.spec.ts`

### Imports

- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`
- `./group-invitations.controller` — `GroupInvitationsController`
- `@/modules/groups/members/group-members.service` — `GroupMembersService`
- `./group-invitations.service` — `GroupInvitationsService`
- `./dto/create-invitation.dto` — `CreateInvitationDto` type
- `./dto/bulk-invitation-response.dto` — `BulkInvitationResponseDto` type
- `@/modules/groups/dto/my-invitation-response.dto` — `MyInvitationResponseDto` type
- `@/types/express` — `AuthenticatedUser` type

### Definitions

- `mockAuthUser` (const) — shared `AuthenticatedUser` fixture for all test cases
- `mockInvitationResponse` (const) — shared `MyInvitationResponseDto` fixture
- `GroupInvitationsController` describe block — unit tests for all five controller methods using mocked service providers

### Exports

- _(none)_

---

## `group-invitations.service.ts`

### Imports

- `@nestjs/common` — `ConflictException`, `Inject`, `Injectable`, `Logger`
- `drizzle-orm` — `and`, `eq`, `inArray`
- `@chamuco/shared-types` — `GROUP_ADMIN_ROLES`, `GroupMemberStatus`, `GroupRole`, `NotificationChannel`, `NotificationType`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient`
- `@/modules/users/schema/users.schema` — `users` table reference
- `@/modules/groups/schema/group-members.schema` — `groupMembers` table reference
- `@/modules/groups/schema/group-member-stats.schema` — `groupMemberStats` table reference
- `@/modules/groups/schema/groups.schema` — `groups` table reference
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `@/modules/groups/members/group-members.service` — `GroupMembersService`
- `./dto/create-invitation.dto` — `CreateInvitationDto` type
- `./dto/bulk-invitation-response.dto` — `BulkInvitationResponseDto`, `InvitationResultDto` types

### Definitions

- `GroupInvitationsService` (service) — Injectable NestJS service managing the full group invitation lifecycle
- `sendInvitations` (function) — admin-only; resolves each username to a per-user result (INVITED, ALREADY_MEMBER, ALREADY_INVITED, HAS_PENDING_REQUEST, NOT_FOUND); re-invites REJECTED/REMOVED/LEFT members; fires push + email notifications
- `acceptInvitation` (function) — transitions INVITED → ACTIVE in a DB transaction, upserts `groupMemberStats`, notifies group admins via push
- `declineInvitation` (function) — transitions INVITED → REJECTED; throws `ConflictException` if no pending invitation exists
- `revokeInvitation` (function) — admin-only; deletes the INVITED membership row; throws `ConflictException` if target is not INVITED

### Exports

- `GroupInvitationsService` — named

---

## `group-invitations.service.spec.ts`

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException`
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `NotificationChannel`, `NotificationType`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`
- `./group-invitations.service` — `GroupInvitationsService`
- `@/modules/groups/members/group-members.service` — `GroupMembersService`
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `./dto/create-invitation.dto` — `CreateInvitationDto` type

### Definitions

- `makeMembership` (function) — non-exported factory helper that builds a `groupMembers`-shaped fixture given userId, status, and optional role
- `GroupInvitationsService` describe block — unit tests covering `sendInvitations`, `acceptInvitation`, `declineInvitation`, and `revokeInvitation` with mocked Drizzle client and service dependencies

### Exports

- _(none)_
