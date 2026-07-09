# Inventory: dto

---

## `base-announcement-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration

### Definitions

- `BaseAnnouncementResponseDto` (class) — Base response shape for announcements, exposing id, author username, content, and timestamps

### Exports

- `BaseAnnouncementResponseDto` — named

---

## `invitation-result.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `INVITATION_RESULT_STATUSES` (enum values array), `InvitationResult` (interface), `InvitationResultStatus` (type)

### Definitions

- `InvitationResultDto` (class) — Represents the outcome of a single invitation attempt for one username, implementing the shared `InvitationResult` contract

### Exports

- `InvitationResultDto` — named

---

## `paginated-query.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiPropertyOptional` for OpenAPI optional field decoration
- `class-transformer` — `Type` to coerce query string values to numbers
- `class-validator` — `IsInt`, `IsOptional`, `Max`, `Min` for validation decorators

### Definitions

- `PaginatedQueryDto` (class) — Common pagination query params with `limit` (1–100, default 20) and `offset` (≥0, default 0)

### Exports

- `PaginatedQueryDto` — named
