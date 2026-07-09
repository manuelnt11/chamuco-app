# Inventory: dto

---

## search-trips-query.dto.ts

### Imports

- `class-transformer` — `Type` for transforming query string values to numbers
- `class-validator` — `IsInt`, `IsOptional`, `IsString`, `Max`, `MaxLength`, `Min`, `MinLength` for validation decorators
- `@nestjs/swagger` — `ApiPropertyOptional` for OpenAPI documentation

### Definitions

- `SearchTripsQueryDto` (class) — Query DTO for the trip discovery search endpoint; exposes optional `q` (text filter, 1–100 chars), `limit` (1–50, default 20), and `offset` (≥0, default 0) pagination parameters

### Exports

- `SearchTripsQueryDto` — named

---

## trip-search-result.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation
- `@chamuco/shared-types` — `MembershipStatus` enum used as the type for `participationStatus`

### Definitions

- `TripSearchDestinationDto` (class) — Nested DTO representing a single trip destination with `city` and `countryCode` (ISO 3166-1 alpha-2)
- `TripSearchResultDto` (class) — DTO for a single trip in search results; includes id, name, description, start/end dates, capacity, confirmed participant count, destinations array, and the requesting user's participation status
- `TripSearchResponseDto` (class) — Paginated wrapper for trip search results; contains a `data` array of `TripSearchResultDto` and a `total` count of matching trips before pagination

### Exports

- `TripSearchDestinationDto` — named
- `TripSearchResultDto` — named
- `TripSearchResponseDto` — named
