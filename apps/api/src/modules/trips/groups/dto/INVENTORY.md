# Inventory: dto

---

## add-trip-group.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-validator` — `IsUUID` for UUID format validation

### Definitions

- `AddTripGroupDto` (class) — Request body for linking a group to a trip; validates that `groupId` is a valid UUID

### Exports

- `AddTripGroupDto` — named

---

## trip-group-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation

### Definitions

- `TripGroupResponseDto` (class) — Response shape for a trip-group association record; exposes `tripId`, `groupId`, and `addedAt` timestamp

### Exports

- `TripGroupResponseDto` — named

---

## trip-linked-group.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation

### Definitions

- `TripLinkedGroupDto` (class) — Response shape representing a group linked to a trip; exposes `id`, `name`, and `coverUrl` (nullable resolved cover image URL or Twemoji CDN URL)

### Exports

- `TripLinkedGroupDto` — named
