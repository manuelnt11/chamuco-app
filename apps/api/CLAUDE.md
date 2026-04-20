# Chamuco API — AI Assistant Instructions

This file extends the root `CLAUDE.md` with rules specific to the `apps/api` NestJS package. Read the root `CLAUDE.md` first.

---

## Standing Rules

### 1. OpenAPI documentation on every backend change

Every NestJS controller endpoint must be fully documented with `@nestjs/swagger` decorators. When any of the following are modified:

- A controller method (new endpoint, changed path, changed HTTP method)
- A request DTO or response DTO
- An enum used in a request or response

Then verify and update:

- `@ApiTags`, `@ApiOperation`, `@ApiResponse` on the controller
- `@ApiProperty` on all DTO fields (type, description, example, required/optional)
- `@ApiBearerAuth()` if the endpoint requires authentication

No endpoint may be left without a summary (`@ApiOperation`), at least one `@ApiResponse`, and fully annotated DTO fields.

### 2. City fields — minimum length is 1

All city fields across all DTOs (`homeCity`, `birthCity`, `departure_city`, etc.) use **minimum length = 1** and maximum length = 100. The floor is 1 (not 2) because single-character city names are valid (e.g. "Å" in Norway). When adding a new city field:

- `@MinLength(1)` + `@MaxLength(100)` (or `@Length(1, 100)`)
- `@Matches(/^[\p{L}\s]+$/u)` — Unicode letters and spaces only, no digits or symbols
- `@Transform(({ value }) => sanitizeProperNoun(value))` — trims, collapses spaces, uppercases

### 3. Migration file on every schema change

When any Drizzle schema file (`*.schema.ts`) is modified — new table, new column, renamed column, dropped column, new index, constraint change — a migration file must be generated:

```bash
pnpm --filter db drizzle-kit generate
```

The generated `.sql` file must be committed alongside the schema change in the same PR. No schema change may be merged without its corresponding migration file. Destructive operations (column drops, renames) require a multi-step migration strategy — document the steps in the PR description.
