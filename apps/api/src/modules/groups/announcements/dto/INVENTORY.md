# Inventory: dto

---

## announcement-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation

### Definitions

- `AnnouncementResponseDto` (class) — Response shape for a single group announcement; exposes id, groupId, createdByUsername, content, createdAt, and updatedAt with Swagger metadata

### Exports

- `AnnouncementResponseDto` — named

---

## create-announcement.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-transformer` — `Transform` to trim whitespace from input strings
- `class-validator` — `IsNotEmpty`, `IsString`, `Matches`, `MaxLength` for input validation

### Definitions

- `CreateAnnouncementDto` (class) — Validates the body for creating a group announcement; enforces `content` as a non-empty string up to 2000 chars with no HTML tags allowed

### Exports

- `CreateAnnouncementDto` — named

---

## list-announcements-query.dto.ts

### Imports

- `@nestjs/swagger` — `ApiPropertyOptional` for optional OpenAPI field documentation
- `class-transformer` — `Type` to coerce query string values to numbers
- `class-validator` — `IsInt`, `IsOptional`, `Max`, `Min` for pagination validation

### Definitions

- `ListAnnouncementsQueryDto` (class) — Validates pagination query params for listing group announcements; `limit` defaults to 20 (max 100), `offset` defaults to 0

### Exports

- `ListAnnouncementsQueryDto` — named

---

## update-announcement.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-transformer` — `Transform` to trim whitespace from input strings
- `class-validator` — `IsNotEmpty`, `IsString`, `Matches`, `MaxLength` for input validation

### Definitions

- `UpdateAnnouncementDto` (class) — Validates the body for updating a group announcement; enforces `content` as a non-empty string up to 2000 chars with no HTML tags allowed

### Exports

- `UpdateAnnouncementDto` — named
