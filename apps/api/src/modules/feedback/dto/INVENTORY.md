# Inventory: dto

---

## create-feedback.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty`, `ApiPropertyOptional` for OpenAPI field documentation
- `class-transformer` — `Transform` for trimming string input before validation
- `class-validator` — `IsIn`, `IsOptional`, `IsString`, `MaxLength`, `MinLength` for field validation

### Definitions

- `CreateFeedbackDto` (class) — Request body DTO for submitting user feedback; validates a required `comment` (10–2000 chars) plus optional contextual metadata: `currentPage`, `userAgent`, `viewportSize`, `language`, and `theme`

### Exports

- `CreateFeedbackDto` — named

---

## feedback-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `@chamuco/shared-types` — `FeedbackResponse` interface implemented by this DTO for compile-time structural compatibility

### Definitions

- `FeedbackResponseDto` (class) — Response DTO for feedback submission; exposes a single `issueUrl` string containing the URL of the created GitHub issue

### Exports

- `FeedbackResponseDto` — named
