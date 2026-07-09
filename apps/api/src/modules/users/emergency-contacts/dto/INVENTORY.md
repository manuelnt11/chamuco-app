# Inventory: dto

---

## emergency-contact.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty`, `OmitType`, `PartialType` for OpenAPI documentation and DTO composition utilities
- `class-transformer` — `Transform` for trimming string fields before validation
- `class-validator` — `IsBoolean`, `IsString`, `IsUUID`, `Matches`, `MaxLength`, `MinLength` for field-level validation decorators

### Definitions

- `EmergencyContactDto` (class) — Full DTO for an emergency contact; validates id (UUID), fullName (2–100 chars, trimmed), phoneCountryCode (E.164 format, e.g. +57), phoneLocalNumber (4–14 digits), relationship (2–50 chars, trimmed), and isPrimary (boolean)
- `UpdateEmergencyContactDto` (class) — Partial update DTO derived from `EmergencyContactDto` with all fields optional and `id` omitted; used for PATCH operations

### Exports

- `EmergencyContactDto` — named
- `UpdateEmergencyContactDto` — named

---

## emergency-contact.dto.spec.ts

### Imports

- `reflect-metadata` — polyfill required for class-transformer/class-validator decorator reflection
- `class-transformer` — `plainToInstance` to hydrate plain objects into DTO class instances
- `class-validator` — `validate` to run decorator-based validation and collect errors
- `./emergency-contact.dto` — `EmergencyContactDto`, `UpdateEmergencyContactDto` under test

### Definitions

- `VALID_ID` (const) — fixture UUID used as a valid id value across test cases
- `validContact` (const) — baseline valid payload object reused across `EmergencyContactDto` test cases

### Exports

- _(none — test file only)_
