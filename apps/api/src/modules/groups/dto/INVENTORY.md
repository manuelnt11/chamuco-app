# Inventory: dto

---

## `create-group.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotation
- `class-transformer` — `Transform`, `Type` for value transformation and nested class instantiation
- `class-validator` — `IsDefined`, `IsEnum`, `IsNotEmpty`, `IsOptional`, `IsString`, `MaxLength`, `MinLength`, `ValidateNested` for validation decorators
- `@chamuco/shared-types` — `GroupVisibility` enum
- `@/common/transforms/name.transform` — `sanitizeName` transform function
- `./group-cover.dto` — `GroupCoverDto` nested DTO

### Definitions

- `CreateGroupDto` (class) — Request DTO for creating a new group; validates name (2–100 chars, sanitized), optional description (max 500 chars), visibility enum, and required nested cover

### Exports

- `CreateGroupDto` — named

---

## `group-cover.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotation
- `class-validator` — `IsIn`, `IsNotEmpty`, `IsNumber`, `Max`, `Min`, `ValidateIf` for validation decorators
- `@/common/validators/cover-target.validator` — `IsValidCoverTarget` custom validator

### Definitions

- `FIVE_MB` (const) — Local constant for the 5 MB file size ceiling (5 × 1024 × 1024 bytes); not exported
- `GroupCoverDto` (class) — Nested DTO for group cover; accepts `source` of `'gcs'` or `'emoji'`, `target` (object key or emoji character), and conditional `fileSize` required when source is `'gcs'`

### Exports

- `GroupCoverDto` — named

---

## `group-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotation
- `@chamuco/shared-types` — `GroupVisibility` enum

### Definitions

- `GroupResponseDto` (class) — Response DTO for a single group; exposes `id`, `name`, `description`, `coverUrl`, `visibility`, `createdBy`, `createdAt`, `updatedAt`

### Exports

- `GroupResponseDto` — named

---

## `group-search-result.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotation
- `@chamuco/shared-types` — `GroupVisibility`, `MembershipStatus` enums; `GroupSearchResult`, `GroupSearchResponse` interfaces

### Definitions

- `GroupSearchResultDto` (class) — Response DTO for a single search hit; implements `GroupSearchResult`; mirrors `GroupResponseDto` fields and adds `memberCount` and `membershipStatus`
- `GroupSearchResponseDto` (class) — Paginated search response; implements `GroupSearchResponse`; wraps an array of `GroupSearchResultDto` and a `total` count

### Exports

- `GroupSearchResultDto` — named
- `GroupSearchResponseDto` — named

---

## `groups.dto.spec.ts`

### Imports

- `reflect-metadata` — side-effect polyfill required for decorator metadata
- `class-transformer` — `plainToInstance` for constructing DTO instances from plain objects
- `class-validator` — `validate` for running validation constraints
- `@chamuco/shared-types` — `GroupVisibility` enum
- `./group-cover.dto` — `GroupCoverDto` under test
- `./create-group.dto` — `CreateGroupDto` under test
- `./update-group.dto` — `UpdateGroupDto` under test

### Definitions

- `describe('GroupCoverDto', ...)` (function) — Tests valid emoji/gcs covers, rejects oversized emoji targets, rejects missing or zero fileSize for gcs source
- `describe('CreateGroupDto', ...)` (function) — Tests that cover is required, that name whitespace is trimmed via Transform, and that nested cover is instantiated as `GroupCoverDto`
- `describe('UpdateGroupDto', ...)` (function) — Tests name trimming, nested cover instantiation, null description clearing, and rejection of empty string description

### Exports

- _(none — test file, no exports)_

---

## `my-invitation-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotation

### Definitions

- `InvitationGroupDto` (class) — Non-exported internal DTO for the group snapshot inside an invitation; exposes `id`, `name`, `coverUrl`
- `MyInvitationResponseDto` (class) — Response DTO for a pending group invitation directed at the current user; contains a nested `group` (`InvitationGroupDto`) and `initiatedAt` timestamp

### Exports

- `MyInvitationResponseDto` — named

---

## `search-groups-query.dto.ts`

### Imports

- `class-transformer` — `Type` for coercing query-string numbers
- `class-validator` — `IsInt`, `IsOptional`, `IsString`, `Max`, `MaxLength`, `Min`, `MinLength` for validation decorators
- `@nestjs/swagger` — `ApiPropertyOptional` for optional OpenAPI field annotation

### Definitions

- `SearchGroupsQueryDto` (class) — Query-parameter DTO for the group search endpoint; optional `q` (name filter, 1–100 chars), `limit` (1–50, default 20), `offset` (>=0, default 0)

### Exports

- `SearchGroupsQueryDto` — named

---

## `update-group.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field annotation
- `class-transformer` — `Transform`, `Type` for value transformation and nested class instantiation
- `class-validator` — `IsEnum`, `IsOptional`, `IsString`, `MaxLength`, `MinLength`, `ValidateNested` for validation decorators
- `@chamuco/shared-types` — `GroupVisibility` enum
- `@/common/transforms/name.transform` — `sanitizeName` transform function
- `./group-cover.dto` — `GroupCoverDto` nested DTO

### Definitions

- `UpdateGroupDto` (class) — Request DTO for partial group updates; all fields optional; `name` (2–100 chars, sanitized), `description` (1–500 chars or null to clear), `visibility` enum, and optional nested `cover`

### Exports

- `UpdateGroupDto` — named
