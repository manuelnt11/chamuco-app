# Inventory: dto

---

## `create-trip-announcement.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-transformer` — `Transform` for trimming input strings
- `class-validator` — `IsNotEmpty`, `IsString`, `Matches`, `MaxLength` for request validation

### Definitions

- `CreateTripAnnouncementDto` (class) — Request body DTO for creating a trip announcement; validates a single `content` string (max 2000 chars, no HTML tags)

### Exports

- `CreateTripAnnouncementDto` — named

---

## `list-trip-announcements-query.dto.ts`

### Imports

- `@/common/dto/paginated-query.dto` — `PaginatedQueryDto` base class providing pagination query parameters

### Definitions

- `ListTripAnnouncementsQueryDto` (class) — Query params DTO for listing trip announcements; extends `PaginatedQueryDto` with no additional fields

### Exports

- `ListTripAnnouncementsQueryDto` — named

---

## `trip-announcement-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `@/common/dto/base-announcement-response.dto` — `BaseAnnouncementResponseDto` base class providing common announcement response fields

### Definitions

- `TripAnnouncementResponseDto` (class) — Response DTO for a trip announcement; extends `BaseAnnouncementResponseDto` and adds a `tripId` UUID field

### Exports

- `TripAnnouncementResponseDto` — named

---

## `update-trip-announcement.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-transformer` — `Transform` for trimming input strings
- `class-validator` — `IsNotEmpty`, `IsString`, `Matches`, `MaxLength` for request validation

### Definitions

- `UpdateTripAnnouncementDto` (class) — Request body DTO for updating a trip announcement; validates a single `content` string (max 2000 chars, no HTML tags)

### Exports

- `UpdateTripAnnouncementDto` — named
