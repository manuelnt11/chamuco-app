# Inventory: dto

---

## `announcement-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@/common/dto/base-announcement-response.dto` — `BaseAnnouncementResponseDto` base class with shared announcement response fields

### Definitions

- `AnnouncementResponseDto` (class) — Response DTO for a group announcement, extending the base with a `groupId` field

### Exports

- `AnnouncementResponseDto` — named

---

## `create-announcement.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-transformer` — `Transform` for trimming string input
- `class-validator` — `IsNotEmpty`, `IsString`, `Matches`, `MaxLength` for input validation

### Definitions

- `CreateAnnouncementDto` (class) — Request DTO for creating a group announcement; validates `content` as a trimmed, non-empty string up to 2000 chars with no HTML tags

### Exports

- `CreateAnnouncementDto` — named

---

## `list-announcements-query.dto.ts`

### Imports

- `@/common/dto/paginated-query.dto` — `PaginatedQueryDto` base class providing pagination query parameters

### Definitions

- `ListAnnouncementsQueryDto` (class) — Query DTO for listing group announcements; inherits pagination fields from `PaginatedQueryDto` with no additions

### Exports

- `ListAnnouncementsQueryDto` — named

---

## `update-announcement.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-transformer` — `Transform` for trimming string input
- `class-validator` — `IsNotEmpty`, `IsString`, `Matches`, `MaxLength` for input validation

### Definitions

- `UpdateAnnouncementDto` (class) — Request DTO for updating a group announcement; validates `content` as a trimmed, non-empty string up to 2000 chars with no HTML tags

### Exports

- `UpdateAnnouncementDto` — named
