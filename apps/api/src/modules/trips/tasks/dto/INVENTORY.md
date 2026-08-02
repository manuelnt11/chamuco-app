# Inventory: dto

---

## create-trip-task.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-transformer` — `Transform` for input sanitization
- `class-validator` — `IsEnum`, `IsString`, `MaxLength`, `MinLength` for field validation
- `@chamuco/shared-types` — `TripTaskScope` enum
- `@/common/transforms/name.transform` — `sanitizeName` (trims and collapses whitespace, no case change)

### Definitions

- `CreateTripTaskDto` (class) — Request body DTO for creating a trip task; `scope` (SHARED requires ORGANIZER/CO_ORGANIZER, PERSONAL is owned by the creator) and `title` (1-200 chars, trimmed via `sanitizeName` so a whitespace-only value fails `MinLength(1)`)

### Exports

- `CreateTripTaskDto` — named

---

## set-trip-task-completion.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-validator` — `IsBoolean` for field validation

### Definitions

- `SetTripTaskCompletionDto` (class) — Request body DTO for toggling a trip task's completion state; single `completed` boolean field

### Exports

- `SetTripTaskCompletionDto` — named

---

## trip-task-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `@chamuco/shared-types` — `TripTaskScope` enum

### Definitions

- `TripTaskResponseDto` (class) — Response shape for a trip task; exposes `id`, `tripId`, `scope`, `title`, `completed` (resolved for the requesting user), `ownerId` (null for SHARED), `createdBy`, `createdAt`

### Exports

- `TripTaskResponseDto` — named

---

## trip-task.dto.spec.ts

### Imports

- `reflect-metadata` — side-effect import required for class-transformer/class-validator metadata reflection
- `class-transformer` — `plainToInstance` for constructing DTO instances from plain objects
- `class-validator` — `validate` for running validation rules against DTO instances
- `@chamuco/shared-types` — `TripTaskScope`
- `./create-trip-task.dto` — `CreateTripTaskDto` (subject under test)
- `./update-trip-task.dto` — `UpdateTripTaskDto` (subject under test)

### Definitions

- `describe('CreateTripTaskDto', ...)` — Test suite covering: `title` trim/whitespace-collapse, rejection of a whitespace-only `title`, rejection of an invalid `scope`
- `describe('UpdateTripTaskDto', ...)` — Test suite covering: `title` trim/whitespace-collapse, rejection of a whitespace-only `title`

### Exports

- _(none — spec file, not exported)_

---

## update-trip-task.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-transformer` — `Transform` for input sanitization
- `class-validator` — `IsString`, `MaxLength`, `MinLength` for field validation
- `@/common/transforms/name.transform` — `sanitizeName` (trims and collapses whitespace, no case change)

### Definitions

- `UpdateTripTaskDto` (class) — Request body DTO for renaming a trip task; single required `title` field (1-200 chars, trimmed via `sanitizeName` so a whitespace-only value fails `MinLength(1)`)

### Exports

- `UpdateTripTaskDto` — named
