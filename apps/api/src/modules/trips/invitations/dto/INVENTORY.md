# Inventory: dto

---

## bulk-trip-invitation-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` decorator for OpenAPI field documentation
- `@chamuco/shared-types` — `INVITATION_RESULT_STATUSES` (enum values array), `InvitationResult` (interface), `InvitationResultStatus` (type), `BulkInvitationResponse` (interface)

### Definitions

- `TripInvitationResultDto` (class) — DTO for a single invitation result item; holds `username` and `status` fields; implements `InvitationResult`
- `BulkTripInvitationResponseDto` (class) — DTO for the bulk invitation response envelope; holds an array of `TripInvitationResultDto`; implements `BulkInvitationResponse`

### Exports

- `TripInvitationResultDto` — named
- `BulkTripInvitationResponseDto` — named

---

## create-trip-invitation.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` decorator for OpenAPI field documentation
- `class-validator` — `ArrayMaxSize`, `ArrayMinSize`, `IsArray`, `IsString`, `Matches`, `MaxLength`, `MinLength` validation decorators

### Definitions

- `CreateTripInvitationDto` (class) — Request DTO for bulk trip invitations; validates `usernames` as a non-empty array (1–20 items) of lowercase alphanumeric strings (3–30 chars, matching `^[a-z0-9_-]+$`)

### Exports

- `CreateTripInvitationDto` — named
