# Inventory: dto

---

## create-trip.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-transformer` — `Transform`, `Type` for value transformation and nested type resolution
- `class-validator` — `IsBoolean`, `IsDateString`, `IsDefined`, `IsEnum`, `IsInt`, `IsNotEmpty`, `IsOptional`, `IsString`, `Length`, `Matches`, `MaxLength`, `Min`, `MinLength`, `registerDecorator`, `ValidateNested`, `ValidationArguments`, `ValidationOptions`, `ValidatorConstraint`, `ValidatorConstraintInterface` for field validation
- `@chamuco/shared-types` — `TripVisibility` enum
- `./trip-cover.dto` — `TripCoverDto` for nested cover validation
- `@/common/transforms/name.transform` — `sanitizeName`, `sanitizeProperNoun`, `sanitizeUpperCase` for string normalization

### Definitions

- `IsAfterOrEqualStartDateConstraint` (class) — Custom validator constraint that checks `endDate >= startDate` via string comparison
- `IsAfterOrEqualStartDate` (decorator) — Property decorator factory that registers `IsAfterOrEqualStartDateConstraint` on the target field
- `CreateTripDto` (class) — Request body DTO for `POST /v1/trips`; validates and sanitizes all fields required to create a trip including name, dates, capacity, locations, cover, and optional metadata

### Exports

- `CreateTripDto` — named

---

## my-trip-list-item-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `@chamuco/shared-types` — `TripRole` enum
- `./trip-response.dto` — `TripResponseDto` as the base class

### Definitions

- `MyTripListItemResponseDto` (class) — Extends `TripResponseDto`; adds `confirmedParticipantCount` and `userRole` fields for the authenticated user's trip list endpoint

### Exports

- `MyTripListItemResponseDto` — named

---

## transition-trip-status.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-validator` — `IsEnum` for enum validation
- `@chamuco/shared-types` — `TripStatus` enum

### Definitions

- `TransitionTripStatusDto` (class) — Request body DTO for trip status transition endpoints; validates that `status` is a valid `TripStatus` value

### Exports

- `TransitionTripStatusDto` — named

---

## trip-cover.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-validator` — `IsIn`, `IsNotEmpty`, `IsNumber`, `Max`, `Min`, `ValidateIf` for conditional and value validation
- `@/common/validators/cover-target.validator` — `IsValidCoverTarget` custom validator for the target field

### Definitions

- `TripCoverDto` (class) — Nested DTO for trip cover; accepts `source` of `'gcs'` or `'emoji'`, a `target` string validated by `IsValidCoverTarget`, and an optional `fileSize` (required when `source === 'gcs'`, max 5 MB)

### Exports

- `TripCoverDto` — named

---

## trip-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `@chamuco/shared-types` — `TripStatus`, `TripVisibility` enums

### Definitions

- `TripResponseDto` (class) — Response shape for a single trip; includes all core trip fields (id, name, description, status, visibility, dates, capacity, locations, timezone, currency, itinerary notes, agency, audit timestamps, `requiresConfirmation` flag, `feedbackOpenUntil` timestamp, and resolved `coverUrl`)

### Exports

- `TripResponseDto` — named

---

## update-trip.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-transformer` — `Transform`, `Type` for value transformation and nested type resolution
- `class-validator` — `IsDateString`, `IsEnum`, `IsInt`, `IsOptional`, `IsString`, `Length`, `Matches`, `MaxLength`, `Min`, `MinLength`, `ValidateNested` for optional field validation
- `@chamuco/shared-types` — `TripVisibility` enum
- `./trip-cover.dto` — `TripCoverDto` for optional nested cover validation
- `@/common/transforms/name.transform` — `sanitizeName`, `sanitizeProperNoun`, `sanitizeUpperCase` for string normalization

### Definitions

- `UpdateTripDto` (class) — Request body DTO for `PATCH /v1/trips/:id`; all fields are optional; mirrors `CreateTripDto` fields without `isTravelingParticipant` and without the custom `endDate >= startDate` cross-field constraint

### Exports

- `UpdateTripDto` — named
