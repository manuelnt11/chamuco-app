# Inventory: dto

---

## `bulk-trip-invitation-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `BulkInvitationResponse` interface implemented by the response DTO
- `@/common/dto/invitation-result.dto` — `InvitationResultDto` re-exported and used as array element type

### Definitions

- `BulkTripInvitationResponseDto` (class) — response DTO for bulk trip invitation operations; contains a `results` array of `InvitationResultDto`

### Exports

- `TripInvitationResultDto` — barrel re-export (re-exports `InvitationResultDto` as `TripInvitationResultDto`)
- `BulkTripInvitationResponseDto` — named

---

## `create-trip-invitation.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-validator` — `ArrayMaxSize`, `ArrayMinSize`, `IsArray`, `IsString`, `Matches`, `MaxLength`, `MinLength` for request validation

### Definitions

- `CreateTripInvitationDto` (class) — request DTO for creating trip invitations; accepts an array of 1–20 usernames (lowercase, 3–30 chars, matching `^[a-z0-9_-]+$`)

### Exports

- `CreateTripInvitationDto` — named
