# Inventory: dto

---

## register-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `ResolvedAsset` (type), `AuthProvider` (enum), `PlatformRole` (enum)
- `@/modules/assets/dto/resolved-asset.dto` — `ResolvedAssetDto` for nested avatar type reference

### Definitions

- `RegisterResponseDto` (class) — OpenAPI-annotated response shape returned after a successful user registration; includes id, username, displayName, avatar, authProvider, timezone, platformRole, agencyId, createdAt, updatedAt, lastActiveAt

### Exports

- `RegisterResponseDto` — named

---

## register.dto.spec.ts

### Imports

- `class-transformer` — `plainToInstance` for constructing DTO instances from plain objects
- `class-validator` — `validate` for running decorator-based validation
- `./register.dto` — `RegisterDto` (the class under test)

### Definitions

- `validBase` (const) — shared fixture object with all required fields for a valid `RegisterDto`; used across test suites

### Exports

- _(none — test file)_

---

## register.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-transformer` — `Type`, `Transform` for deserialization and value normalization
- `class-validator` — `ArrayMinSize`, `IsArray`, `IsEmail`, `IsObject`, `IsOptional`, `IsString`, `IsTimeZone`, `Length`, `Matches`, `MaxLength`, `ValidateNested` for field validation
- `@/modules/users/profile/dto/date-of-birth.dto` — `DateOfBirthDto` for nested dateOfBirth object
- `@/modules/users/travel-docs/dto/nationality.dto` — `CreateNationalityDto` for nested nationalities array
- `@/modules/users/emergency-contacts/dto/emergency-contact.dto` — `EmergencyContactDto` for nested emergencyContacts array
- `@/modules/users/profile/dto/minimum-age.validator` — `IsMinimumAge` custom validator for age gate on dateOfBirth
- `@/common/transforms/name.transform` — `sanitizeProperNoun` transform (trims, collapses spaces, uppercases proper nouns)

### Definitions

- `RegisterDto` (class) — request body DTO for new user registration; validates and normalizes username (lowercased), displayName (trimmed), firstName/lastName (uppercased via `sanitizeProperNoun`), dateOfBirth (nested, minimum age 16), homeCountry (ISO alpha-2), homeCity (optional), phoneCountryCode (E.164), phoneLocalNumber (digits only), nationalities (optional array), emergencyContacts (optional array), email (optional, normalized), and timezone (optional IANA)

### Exports

- `RegisterDto` — named

---

## username-check-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration

### Definitions

- `UsernameCheckResponseDto` (class) — OpenAPI-annotated response shape for username availability checks; exposes `available` (boolean) and `username` (normalized lowercase string)

### Exports

- `UsernameCheckResponseDto` — named
