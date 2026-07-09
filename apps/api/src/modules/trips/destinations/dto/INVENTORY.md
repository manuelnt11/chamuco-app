# Inventory: dto

---

## create-destination.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-transformer` — `Transform` for input sanitization transforms
- `class-validator` — `IsOptional`, `IsString`, `Length`, `Matches`, `MaxLength`, `MinLength` for field validation
- `@/common/transforms/name.transform` — `sanitizeProperNoun`, `sanitizeUpperCase` for normalizing city and country code inputs

### Definitions

- `CreateDestinationDto` (class) — Request body DTO for creating a trip destination; validates and sanitizes `countryCode` (ISO 3166-1 alpha-2, uppercased), `city` (Unicode letters/spaces, proper-noun cased), and optional `label`

### Exports

- `CreateDestinationDto` — named

---

## destination-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations

### Definitions

- `DestinationResponseDto` (class) — Response shape for a trip destination; exposes `id`, `tripId`, `position`, `countryCode`, `city`, `label`, and `createdAt`
- `DestinationWriteResponseDto` (class) — Extends `DestinationResponseDto` with `requiresConfirmation` flag that is `true` when the trip is `IN_PROGRESS` (edit requires organizer confirmation and notifies participants)

### Exports

- `DestinationResponseDto` — named
- `DestinationWriteResponseDto` — named

---

## destination.dto.spec.ts

### Imports

- `reflect-metadata` — side-effect import required for class-transformer/class-validator metadata reflection
- `class-transformer` — `plainToInstance` for constructing DTO instances from plain objects
- `class-validator` — `validate` for running validation rules against DTO instances
- `./create-destination.dto` — `CreateDestinationDto` (subject under test)
- `./update-destination.dto` — `UpdateDestinationDto` (subject under test)

### Definitions

- `describe('CreateDestinationDto', ...)` — Test suite covering: uppercase transform on `countryCode`, `sanitizeProperNoun` on `city`, valid DTO acceptance, rejection of wrong-length `countryCode`, rejection of digits in `city`, acceptance of optional `label`
- `describe('UpdateDestinationDto', ...)` — Test suite covering: uppercase transform when `countryCode` provided, `sanitizeProperNoun` when `city` provided, empty DTO acceptance (all fields optional), partial update with only `city`, rejection of digits in `city` when provided

### Exports

- _(none — spec file, not exported)_

---

## reorder-destinations.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-validator` — `ArrayMinSize`, `IsArray`, `IsUUID` for validating the ordered UUID array

### Definitions

- `ReorderDestinationsDto` (class) — Request body DTO for reordering trip destinations; accepts `destinationIds` as an ordered array of UUID v4 strings (all trip destinations must be included; array index 0 maps to position 1)

### Exports

- `ReorderDestinationsDto` — named

---

## update-destination.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-transformer` — `Transform` for input sanitization transforms
- `class-validator` — `IsOptional`, `IsString`, `Length`, `Matches`, `MaxLength`, `MinLength` for field validation
- `@/common/transforms/name.transform` — `sanitizeProperNoun`, `sanitizeUpperCase` for normalizing city and country code inputs

### Definitions

- `UpdateDestinationDto` (class) — Request body DTO for partially updating a trip destination; all fields (`countryCode`, `city`, `label`) are optional and apply the same validation/sanitization rules as `CreateDestinationDto`

### Exports

- `UpdateDestinationDto` — named
