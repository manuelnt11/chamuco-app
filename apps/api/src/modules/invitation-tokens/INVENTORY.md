# Inventory: invitation-tokens

---

## invitation-tokens.controller.spec.ts

### Imports

- `@nestjs/common` — `NotFoundException` for testing 404 branch
- `@nestjs/testing` — `Test`, `TestingModule` for building the test module
- `@chamuco/shared-types` — `AuthProvider`, `InvitationTokenContext`, `PlatformRole`, `ProfileVisibility` for fixture data
- `./invitation-tokens.controller` — `InvitationTokensController` (subject under test)
- `./invitation-tokens.service` — `InvitationTokensService` (mocked provider)
- `./dto/create-invitation-token.dto` — `CreateInvitationTokenDto` (type-only, fixture typing)
- `./dto/invitation-token-create-response.dto` — `InvitationTokenCreateResponseDto` (type-only)
- `./dto/invitation-token-resolve-response.dto` — `InvitationTokenResolveResponseDto` (type-only)
- `./dto/invitation-token-redeem-response.dto` — `InvitationTokenRedeemResponseDto` (type-only)
- `@/types/express` — `AuthenticatedUser` (type-only, mock user shape)

### Definitions

- `mockUser` (const) — fixture `AuthenticatedUser` used across test cases
- `mockCreateResponse` (const) — fixture `InvitationTokenCreateResponseDto` returned by mocked service
- `mockResolveResponse` (const) — fixture `InvitationTokenResolveResponseDto` returned by mocked service
- `mockRedeemResponse` (const) — fixture `InvitationTokenRedeemResponseDto` returned by mocked service

### Exports

- (none — test file)

---

## invitation-tokens.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Get`, `HttpCode`, `HttpStatus`, `NotFoundException`, `Param`, `Patch`, `Post`, `Query` for routing and HTTP utilities
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiQuery`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` for OpenAPI documentation
- `@/common/decorators/current-user.decorator` — `CurrentUser` to inject the authenticated user
- `@/common/decorators/public.decorator` — `Public` to bypass auth guard on resolve endpoint
- `@chamuco/shared-types` — `InvitationTokenContext` enum for query parameter typing
- `@/types/express` — `AuthenticatedUser` (type-only)
- `./invitation-tokens.service` — `InvitationTokensService`
- `./dto/create-invitation-token.dto` — `CreateInvitationTokenDto`
- `./dto/invitation-token-create-response.dto` — `InvitationTokenCreateResponseDto`
- `./dto/invitation-token-resolve-response.dto` — `InvitationTokenResolveResponseDto`
- `./dto/invitation-token-redeem-response.dto` — `InvitationTokenRedeemResponseDto`

### Definitions

- `InvitationTokensController` (controller) — REST controller at `v1/invitation-tokens`; exposes five endpoints: create token (POST /), get open token (GET /open), resolve token (GET /:token, public), redeem token (POST /:token/redeem), toggle token (PATCH /:token/toggle)

### Exports

- `InvitationTokensController` — named

---

## invitation-tokens.module.ts

### Imports

- `@nestjs/common` — `Module`
- `@/modules/email/email.module` — `EmailModule` (provides `EmailService` for targeted invitation emails)
- `./invitation-tokens.controller` — `InvitationTokensController`
- `./invitation-tokens.service` — `InvitationTokensService`

### Definitions

- `InvitationTokensModule` (module) — registers `InvitationTokensController` and `InvitationTokensService`; imports `EmailModule`

### Exports

- `InvitationTokensModule` — named

---

## invitation-tokens.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `ForbiddenException`, `NotFoundException` for exception assertion
- `@nestjs/testing` — `Test`, `TestingModule`
- `@nestjs/config` — `ConfigService` (mocked)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `InvitationTokenContext`, `TripParticipantStatus`, `TripRole` for fixture data
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token (mocked)
- `./invitation-tokens.service` — `InvitationTokensService` (subject under test)
- `@/modules/email/email.service` — `EmailService` (mocked)
- `./dto/create-invitation-token.dto` — `CreateInvitationTokenDto` (type-only)

### Definitions

- `makeOpenTripToken` (function) — factory that builds a mock `invitationTokens` row for trip context with optional overrides

### Exports

- (none — test file)

---

## invitation-tokens.service.ts

### Imports

- `crypto` — `randomBytes` for secure token generation
- `@nestjs/common` — `BadRequestException`, `ConflictException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException`
- `drizzle-orm` — `and`, `desc`, `eq`, `isNull`, `sql` for query building
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `InvitationTokenContext`, `TripParticipantStatus`, `TripRole`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient`
- `@nestjs/config` — `ConfigService` for reading `FRONTEND_URL`
- `@/modules/users/schema/users.schema` — `users` table
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` table
- `@/modules/groups/schema/groups.schema` — `groups` table
- `@/modules/groups/schema/group-members.schema` — `groupMembers` table
- `@/modules/trips/schema/trips.schema` — `trips` table
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` table
- `./schema/invitation-tokens.schema` — `invitationTokens` table
- `@/modules/email/email.service` — `EmailService`
- `@/modules/email/email-template.enum` — `EmailTemplate`
- `./dto/create-invitation-token.dto` — `CreateInvitationTokenDto` (type-only)
- `./dto/invitation-token-create-response.dto` — `InvitationTokenCreateResponseDto` (type-only)
- `./dto/invitation-token-resolve-response.dto` — `InvitationTokenResolveResponseDto` (type-only)
- `./dto/invitation-token-redeem-response.dto` — `InvitationTokenRedeemResponseDto` (type-only)

### Definitions

- `InvitationTokensService` (service) — core business logic for invitation tokens; manages token creation (with upsert), resolution, redemption, toggling, and permission enforcement
- `createToken` (function) — validates caller permissions, optionally checks recipient email uniqueness, upserts token row, fires invitation email asynchronously for targeted links
- `findOpenToken` (function) — enforces same permissions as `createToken`, returns existing open (non-targeted) token for a context or null
- `resolveToken` (function) — public lookup returning token metadata and creator/context info; used by the frontend pre-login invitation page
- `redeemToken` (function) — validates active state and redeem count, then delegates to `processRedemption` inside a DB transaction; appends redeemer record
- `toggleToken` (function) — flips `isActive` on an open link; rejects targeted links; checks organizer/admin permission when caller is not the creator
- `processRedemption` (function, private) — dispatches to `redeemTripToken`, `redeemGroupToken`, or returns `REFERRAL_RECORDED` based on `contextType`
- `redeemTripToken` (function, private) — handles all trip participant state transitions (CONFIRMED→ALREADY_MEMBER, INVITED/ACCEPTED→ALREADY_INVITED, PENDING_REQUEST→REQUEST_ACCEPTED, absent/other→INVITED)
- `redeemGroupToken` (function, private) — handles all group member state transitions (ACTIVE→ALREADY_MEMBER, INVITED→ALREADY_INVITED, REQUEST→REQUEST_ACCEPTED, other/absent→INVITED)
- `assertCreatePermission` (function, private) — checks that caller is ORGANIZER/CO_ORGANIZER for trips or OWNER/ADMIN for groups; referral tokens bypass check
- `resolveContextName` (function, private) — queries trip or group name by `contextId` for use in email and resolve responses

### Exports

- `InvitationTokensService` — named
