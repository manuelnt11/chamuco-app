# Inventory: dto

---

## `bulk-invitation-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `BulkInvitationResponse` interface implemented by the response DTO
- `@/common/dto/invitation-result.dto` — `InvitationResultDto` re-exported and used as array item type

### Definitions

- `BulkInvitationResponseDto` (class) — response DTO for bulk group invitation operations; holds an array of per-username results

### Exports

- `BulkInvitationResponseDto` — named
- `InvitationResultDto` — barrel re-export

---

## `create-invitation.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-validator` — `ArrayMaxSize`, `ArrayMinSize`, `IsArray`, `IsString`, `Matches`, `MaxLength`, `MinLength` for request validation

### Definitions

- `CreateInvitationDto` (class) — request DTO for bulk group invitations; validates an array of 1–20 lowercase usernames (3–30 chars, `a-z0-9_-` pattern)

### Exports

- `CreateInvitationDto` — named
