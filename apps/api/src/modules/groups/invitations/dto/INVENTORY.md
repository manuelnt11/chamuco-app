# Inventory: dto

---

## bulk-invitation-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `INVITATION_RESULT_STATUSES` (enum array), `InvitationResult`, `InvitationResultStatus`, `BulkInvitationResponse` (shared type contracts)

### Definitions

- `InvitationResultDto` (class) — Response DTO for a single invitation result; implements `InvitationResult`; holds `username` and `status` (one of `INVITATION_RESULT_STATUSES`)
- `BulkInvitationResponseDto` (class) — Response DTO for a bulk invitation operation; implements `BulkInvitationResponse`; holds an array of `InvitationResultDto`

### Exports

- `InvitationResultDto` — named
- `BulkInvitationResponseDto` — named

---

## create-invitation.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-validator` — `ArrayMaxSize`, `ArrayMinSize`, `IsArray`, `IsString`, `Matches`, `MaxLength`, `MinLength` for request validation decorators

### Definitions

- `CreateInvitationDto` (class) — Request DTO for bulk group invitations; validates `usernames` as an array of 1–20 lowercase username strings (3–30 chars, matching `^[a-z0-9_-]+$`)

### Exports

- `CreateInvitationDto` — named
