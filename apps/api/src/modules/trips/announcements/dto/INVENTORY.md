# Inventory: dto

---

## create-trip-announcement.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-transformer` — `Transform` for trimming string input before validation
- `class-validator` — `IsNotEmpty`, `IsString`, `Matches`, `MaxLength` for request validation

### Definitions

- `CreateTripAnnouncementDto` (class) — Request body for creating a trip announcement; validates `content` as a non-empty string up to 2000 chars with no HTML tags allowed

### Exports

- `CreateTripAnnouncementDto` — named

---

## list-trip-announcements-query.dto.ts

### Imports

- `@nestjs/swagger` — `ApiPropertyOptional` for optional OpenAPI field documentation
- `class-transformer` — `Type` for coercing query string values to numbers
- `class-validator` — `IsInt`, `IsOptional`, `Max`, `Min` for pagination query validation

### Definitions

- `ListTripAnnouncementsQueryDto` (class) — Query params DTO for paginating trip announcements; exposes `limit` (1–100, default 20) and `offset` (≥0, default 0)

### Exports

- `ListTripAnnouncementsQueryDto` — named

---

## trip-announcement-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI response field documentation

### Definitions

- `TripAnnouncementResponseDto` (class) — Response shape for a single trip announcement; exposes `id`, `tripId`, `createdByUsername`, `content`, `createdAt`, and `updatedAt`

### Exports

- `TripAnnouncementResponseDto` — named

---

## update-trip-announcement.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-transformer` — `Transform` for trimming string input before validation
- `class-validator` — `IsNotEmpty`, `IsString`, `Matches`, `MaxLength` for request validation

### Definitions

- `UpdateTripAnnouncementDto` (class) — Request body for updating a trip announcement; validates `content` as a non-empty string up to 2000 chars with no HTML tags allowed

### Exports

- `UpdateTripAnnouncementDto` — named
