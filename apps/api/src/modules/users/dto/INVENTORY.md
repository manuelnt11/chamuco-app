# Inventory: dto

---

## `public-profile-response.dto.spec.ts`

### Imports

- `./public-profile-response.dto` — `KeyStatsDto`, `PublicProfileResponseDto` (classes under test)

### Definitions

- `KeyStatsDto instantiation test` (const) — verifies all numeric stat fields can be assigned
- `PublicProfileResponseDto instantiation test` (const) — verifies all profile fields including nullable ones can be assigned

### Exports

- none

---

## `public-profile-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `ProfileVisibility` (enum), `KeyStats` (type), `ResolvedAsset` (type)
- `./user-response.dto` — `ResolvedAssetDto` (re-used asset response shape)

### Definitions

- `KeyStatsDto` (class) — implements `KeyStats`; five numeric fields: `tripsCompleted`, `countriesVisited`, `citiesVisited`, `kmTraveled`, `tripsAsOrganizer`
- `PublicProfileResponseDto` (class) — publicly visible profile shape: `username`, `displayName`, `avatar`, `bio`, `profileVisibility`, `travelerScore`, `achievements`, `recognitions`, `keyStats`, `discoveryMap`

### Exports

- `KeyStatsDto` — named
- `PublicProfileResponseDto` — named

---

## `search-users-query.dto.ts`

### Imports

- `class-transformer` — `Type` for query-param coercion
- `class-validator` — `IsInt`, `IsOptional`, `IsString`, `Max`, `MaxLength`, `Min`, `MinLength` for validation decorators
- `@nestjs/swagger` — `ApiPropertyOptional` for OpenAPI decoration

### Definitions

- `SearchUsersQueryDto` (class) — query params for user search: optional `q` string (1–100 chars; `@` prefix targets username-only match) and optional `limit` integer (1–20, default 10)

### Exports

- `SearchUsersQueryDto` — named

---

## `update-avatar.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-validator` — `IsIn`, `IsNotEmpty`, `IsNumber`, `IsOptional`, `IsString`, `Max`, `MaxLength`, `Min`, `ValidateIf` for validation decorators

### Definitions

- `TWO_MB` (const) — local constant `2 * 1024 * 1024` used as the file-size ceiling
- `UpdateAvatarDto` (class) — request body for avatar update: `source` (`'gcs' | 'emoji'`), `target` (objectKey or emoji character, max 8 chars when emoji), optional `fileSize` (required for GCS, 1–2 MB)

### Exports

- `UpdateAvatarDto` — named

---

## `update-user.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-validator` — `IsEnum`, `IsNotEmpty`, `IsOptional`, `IsString`, `IsTimeZone`, `MaxLength` for validation decorators
- `@chamuco/shared-types` — `ProfileVisibility` (enum)

### Definitions

- `UpdateUserDto` (class) — PATCH body for user profile: optional `displayName` (max 100 chars), optional `timezone` (IANA timezone string), optional `profileVisibility` (enum)

### Exports

- `UpdateUserDto` — named

---

## `user-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `ResolvedAsset` (type), `AuthProvider` (enum), `PlatformRole` (enum), `ProfileVisibility` (enum)
- `@/modules/assets/dto/resolved-asset.dto` — `ResolvedAssetDto` (re-exported from this file)

### Definitions

- `UserResponseDto` (class) — full authenticated-user response shape: `id`, `username`, `displayName`, `avatar`, `authProvider`, `timezone`, `profileVisibility`, `platformRole`, `agencyId`, `createdAt`, `updatedAt`, `lastActiveAt`

### Exports

- `ResolvedAssetDto` — barrel re-export (re-exported from `@/modules/assets/dto/resolved-asset.dto`)
- `UserResponseDto` — named

---

## `user-search-result.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `ResolvedAsset` (type), `UserSearchResult` (interface), `UserSearchResponse` (interface)
- `@/modules/assets/dto/resolved-asset.dto` — `ResolvedAssetDto` for avatar typing

### Definitions

- `UserSearchResultDto` (class) — implements `UserSearchResult`; single search hit: `id`, `username`, `displayName`, `avatar`
- `UserSearchResponseDto` (class) — implements `UserSearchResponse`; paginated search envelope: `data` (array of `UserSearchResultDto`), `total` (count before pagination)

### Exports

- `UserSearchResultDto` — named
- `UserSearchResponseDto` — named

---

## `username-availability.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration

### Definitions

- `UsernameAvailabilityDto` (class) — response for username availability check: `available` (boolean), `username` (normalized/lowercased form)

### Exports

- `UsernameAvailabilityDto` — named
