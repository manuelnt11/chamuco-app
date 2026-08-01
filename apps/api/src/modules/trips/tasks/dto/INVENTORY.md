# Inventory: dto

---

## create-trip-task.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-validator` — `IsEnum`, `IsString`, `MaxLength`, `MinLength` for field validation
- `@chamuco/shared-types` — `TripTaskScope` enum

### Definitions

- `CreateTripTaskDto` (class) — Request body DTO for creating a trip task; `scope` (SHARED requires ORGANIZER/CO_ORGANIZER, PERSONAL is owned by the creator) and `title` (1-200 chars)

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

## update-trip-task.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotations
- `class-validator` — `IsString`, `MaxLength`, `MinLength` for field validation

### Definitions

- `UpdateTripTaskDto` (class) — Request body DTO for renaming a trip task; single required `title` field (1-200 chars)

### Exports

- `UpdateTripTaskDto` — named
