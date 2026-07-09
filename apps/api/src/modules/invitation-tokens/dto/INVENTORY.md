# Inventory: dto

---

## create-invitation-token.dto.ts

### Imports

- `class-validator` — `IsEmail`, `IsEnum`, `IsOptional`, `IsString`, `IsUUID`, `MaxLength` for request body validation
- `@nestjs/swagger` — `ApiProperty`, `ApiPropertyOptional` for OpenAPI field documentation
- `@chamuco/shared-types` — `InvitationTokenContext` enum defining valid context types (REFERRAL, TRIP, GROUP)

### Definitions

- `CreateInvitationTokenDto` (class) — Request body DTO for creating an invitation token; validates context type, optional context UUID, optional recipient email, and optional note (≤500 chars)

### Exports

- `CreateInvitationTokenDto` — named

---

## invitation-token-create-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `@chamuco/shared-types` — `InvitationTokenCreateResponse` interface that this DTO implements

### Definitions

- `InvitationTokenCreateResponseDto` (class) — Response DTO for the create-token endpoint; exposes the raw token string, shareable URL, and active status

### Exports

- `InvitationTokenCreateResponseDto` — named

---

## invitation-token-dto.spec.ts

### Imports

- `@chamuco/shared-types` — `InvitationTokenContext` enum used to assert default values
- `./invitation-token-create-response.dto` — `InvitationTokenCreateResponseDto` under test
- `./invitation-token-resolve-response.dto` — `InvitationTokenResolveResponseDto` under test
- `./invitation-token-redeem-response.dto` — `InvitationTokenRedeemResponseDto` under test

### Definitions

- `describe('Invitation token DTOs — default values', ...)` — test suite asserting that each response DTO initialises its fields with the correct default values (token `''`, url `''`, isActive `true`, outcome `'INVITED'`, contextType `REFERRAL`)

### Exports

- _(none — test file)_

---

## invitation-token-redeem-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty`, `ApiPropertyOptional` for OpenAPI field documentation
- `@chamuco/shared-types` — `InvitationTokenContext` enum, `INVITATION_TOKEN_REDEMPTION_OUTCOMES` const array, `InvitationTokenRedeemResponse` interface, `InvitationTokenRedemptionOutcome` type

### Definitions

- `InvitationTokenRedeemResponseDto` (class) — Response DTO for the redeem-token endpoint; exposes the redemption outcome (e.g. `INVITED`), context type, and nullable context UUID

### Exports

- `InvitationTokenRedeemResponseDto` — named

---

## invitation-token-resolve-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty`, `ApiPropertyOptional` for OpenAPI field documentation
- `@chamuco/shared-types` — `InvitationTokenContext` enum, `InvitationTokenResolveResponse` interface

### Definitions

- `InvitationTokenResolveResponseDto` (class) — Response DTO for the resolve-token endpoint; exposes token string, context type, nullable context UUID, nullable context name, creator display name and username, optional note, active flag, and creation timestamp

### Exports

- `InvitationTokenResolveResponseDto` — named
