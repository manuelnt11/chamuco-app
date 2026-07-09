# Inventory: dto

---

## create-group.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-transformer` — `Transform` (apply sanitizer), `Type` (nested DTO instantiation)
- `class-validator` — `IsDefined`, `IsEnum`, `IsNotEmpty`, `IsOptional`, `IsString`, `MaxLength`, `MinLength`, `ValidateNested` for request validation
- `@chamuco/shared-types` — `GroupVisibility` enum
- `@/common/transforms/name.transform` — `sanitizeName` transform applied to `name`
- `./group-cover.dto` — `GroupCoverDto` nested DTO

### Definitions

- `CreateGroupDto` (class) — Request body DTO for creating a group; validates `name` (2–100 chars, sanitized), optional `description` (max 500), `visibility` enum, and required nested `cover`

### Exports

- `CreateGroupDto` — named

---

## group-cover.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-validator` — `IsIn`, `IsNotEmpty`, `IsNumber`, `Max`, `Min`, `ValidateIf` for conditional validation
- `@/common/validators/cover-target.validator` — `IsValidCoverTarget` custom validator

### Definitions

- `GroupCoverDto` (class) — DTO for group cover; `source` is `'gcs' | 'emoji'`; `target` is validated by `IsValidCoverTarget`; `fileSize` is required (1–5 MB) only when `source === 'gcs'`

### Exports

- `GroupCoverDto` — named

---

## group-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `GroupVisibility` enum

### Definitions

- `GroupResponseDto` (class) — API response shape for a single group; includes `id`, `name`, `description`, `coverUrl` (resolved URL), `visibility`, `createdBy`, `createdAt`, `updatedAt`

### Exports

- `GroupResponseDto` — named

---

## group-search-result.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `GroupVisibility`, `MembershipStatus` enums

### Definitions

- `GroupSearchResultDto` (class) — Single item in a group search result; extends `GroupResponseDto` shape with `memberCount` and `membershipStatus` (`'none' | 'pending' | 'active'`)
- `GroupSearchResponseDto` (class) — Paginated wrapper for group search; contains `data` array of `GroupSearchResultDto` and `total` count

### Exports

- `GroupSearchResultDto` — named
- `GroupSearchResponseDto` — named

---

## groups.dto.spec.ts

### Imports

- `reflect-metadata` — side-effect import required by class-transformer/class-validator
- `class-transformer` — `plainToInstance` for hydrating plain objects into DTO instances
- `class-validator` — `validate` for running decorator-based validation
- `@chamuco/shared-types` — `GroupVisibility` enum
- `./group-cover.dto` — `GroupCoverDto` under test
- `./create-group.dto` — `CreateGroupDto` under test
- `./update-group.dto` — `UpdateGroupDto` under test

### Definitions

- `describe('GroupCoverDto', ...)` — validates emoji/gcs acceptance, rejects oversized emoji target, missing/zero `fileSize` for gcs
- `describe('CreateGroupDto', ...)` — validates missing `cover` rejection, `name` whitespace trimming via Transform, nested `GroupCoverDto` instantiation via Type
- `describe('UpdateGroupDto', ...)` — validates `name` trimming, nested cover instantiation, `null` description clears field, empty string description rejected

### Exports

- _(none — test file)_

---

## my-invitation-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration

### Definitions

- `InvitationGroupDto` (class) — Non-exported inline shape for the group embedded in an invitation; contains `id`, `name`, `coverUrl`
- `MyInvitationResponseDto` (class) — Response DTO for a pending group invitation received by the current user; contains nested `group` (`InvitationGroupDto`) and `initiatedAt` timestamp

### Exports

- `MyInvitationResponseDto` — named

---

## search-groups-query.dto.ts

### Imports

- `class-transformer` — `Type` to coerce query-string numbers
- `class-validator` — `IsInt`, `IsOptional`, `IsString`, `Max`, `MaxLength`, `Min`, `MinLength` for query param validation
- `@nestjs/swagger` — `ApiPropertyOptional` for OpenAPI optional field decoration

### Definitions

- `SearchGroupsQueryDto` (class) — Query params DTO for group search; optional `q` (1–100 chars name filter), `limit` (1–50, default 20), `offset` (≥0, default 0)

### Exports

- `SearchGroupsQueryDto` — named

---

## update-group.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-transformer` — `Transform` (apply sanitizer), `Type` (nested DTO instantiation)
- `class-validator` — `IsEnum`, `IsOptional`, `IsString`, `MaxLength`, `MinLength`, `ValidateNested` for request validation
- `@chamuco/shared-types` — `GroupVisibility` enum
- `@/common/transforms/name.transform` — `sanitizeName` transform applied to `name`
- `./group-cover.dto` — `GroupCoverDto` nested DTO

### Definitions

- `UpdateGroupDto` (class) — Request body DTO for partial group update (all fields optional); `name` (2–100, sanitized), `description` (1–500 or `null` to clear), `visibility` enum, `cover` nested DTO

### Exports

- `UpdateGroupDto` — named
