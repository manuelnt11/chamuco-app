# Inventory: dto

---

## public-profile-response.dto.spec.ts

### Imports

- `./public-profile-response.dto` — `KeyStatsDto`, `PublicProfileResponseDto` (DTOs under test)

### Definitions

- `KeyStatsDto` instantiation test (describe block) — verifies all numeric stat fields can be assigned
- `PublicProfileResponseDto` instantiation test (describe block) — verifies all profile fields including nullable ones can be assigned

### Exports

- _(none — test file only)_

---

## public-profile-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field decoration)
- `@chamuco/shared-types` — `ProfileVisibility` (enum), `KeyStats` (interface implemented by `KeyStatsDto`), `ResolvedAsset` (type for avatar field)
- `./user-response.dto` — `ResolvedAssetDto` (used as nested type for `avatar`)

### Definitions

- `KeyStatsDto` (class) — OpenAPI-annotated DTO implementing `KeyStats`; exposes `tripsCompleted`, `countriesVisited`, `citiesVisited`, `kmTraveled`, `tripsAsOrganizer`
- `PublicProfileResponseDto` (class) — OpenAPI-annotated response shape for a user's public profile; includes `username`, `displayName`, `avatar`, `bio`, `profileVisibility`, `travelerScore` (null in MVP), `achievements`, `recognitions`, `keyStats` (null in MVP), `discoveryMap`

### Exports

- `KeyStatsDto` — named
- `PublicProfileResponseDto` — named

---

## search-users-query.dto.ts

### Imports

- `class-transformer` — `Type` (coerces query-string number to `Number`)
- `class-validator` — `IsInt`, `IsOptional`, `IsString`, `Max`, `MaxLength`, `Min`, `MinLength` (field validation decorators)
- `@nestjs/swagger` — `ApiPropertyOptional` (OpenAPI optional field decoration)

### Definitions

- `SearchUsersQueryDto` (class) — Query-parameter DTO for `GET /users/search`; `q` (optional string, 1–100 chars; `@`-prefix triggers username-only search) and `limit` (optional int 1–20, default 10)

### Exports

- `SearchUsersQueryDto` — named

---

## update-avatar.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field decoration)
- `class-validator` — `IsIn`, `IsNotEmpty`, `IsNumber`, `IsOptional`, `IsString`, `Max`, `MaxLength`, `Min`, `ValidateIf` (field validation decorators)

### Definitions

- `TWO_MB` (const) — File-size ceiling constant (2 × 1024 × 1024 bytes); used in `@Max` and `@ApiProperty`
- `UpdateAvatarDto` (class) — Request body for `PATCH /users/:id/avatar`; `source` discriminates `'gcs'` vs `'emoji'`; `target` is the GCS object key or emoji character; `fileSize` is required only when `source === 'gcs'` via `@ValidateIf`

### Exports

- `UpdateAvatarDto` — named

---

## update-user.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field decoration)
- `class-validator` — `IsEnum`, `IsNotEmpty`, `IsOptional`, `IsString`, `IsTimeZone`, `MaxLength` (field validation decorators)
- `@chamuco/shared-types` — `ProfileVisibility` (enum for `profileVisibility` field)

### Definitions

- `UpdateUserDto` (class) — Partial request body for `PATCH /users/:id`; optional fields `displayName` (string, max 100), `timezone` (IANA time zone string), `profileVisibility` (`ProfileVisibility` enum)

### Exports

- `UpdateUserDto` — named

---

## user-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field decoration)
- `@chamuco/shared-types` — `ResolvedAsset` (type), `AuthProvider`, `PlatformRole`, `ProfileVisibility` (enums)
- `@/modules/assets/dto/resolved-asset.dto` — `ResolvedAssetDto` (nested DTO for avatar; re-exported from this file)

### Definitions

- `UserResponseDto` (class) — Full authenticated-user response shape; fields: `id`, `username`, `displayName`, `avatar`, `authProvider`, `timezone`, `profileVisibility`, `platformRole`, `agencyId`, `createdAt`, `updatedAt`, `lastActiveAt`

### Exports

- `ResolvedAssetDto` — named (re-export from `@/modules/assets/dto/resolved-asset.dto`)
- `UserResponseDto` — named

---

## user-search-result.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field decoration)
- `@chamuco/shared-types` — `ResolvedAsset` (type for avatar field)
- `@/modules/assets/dto/resolved-asset.dto` — `ResolvedAssetDto` (nested DTO for avatar)

### Definitions

- `UserSearchResultDto` (class) — Minimal user projection returned in search results; fields: `id`, `username`, `displayName`, `avatar`
- `UserSearchResponseDto` (class) — Paginated wrapper for search results; fields: `data` (array of `UserSearchResultDto`), `total` (pre-pagination count)

### Exports

- `UserSearchResultDto` — named
- `UserSearchResponseDto` — named

---

## username-availability.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field decoration)

### Definitions

- `UsernameAvailabilityDto` (class) — Response DTO for `GET /users/username-availability`; fields: `available` (boolean), `username` (normalized/lowercased form)

### Exports

- `UsernameAvailabilityDto` — named
