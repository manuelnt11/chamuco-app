---
name: autodoc
description: Review changes since main branch and update all documentation, OpenAPI decorators, and migration files accordingly
---

You are running the `/autodoc` command for the Chamuco App project. Your job is to audit all changes made since the `main` branch and ensure the documentation, API specs, and database migrations are fully up to date.

This command is the primary documentation maintenance tool during the implementation phase.

## Step 1 — Identify changed files

Run:

```bash
git diff main...HEAD --name-only
```

Categorize each changed file into one or more of these buckets:

- **Controller / DTO** — files under `apps/api/src/**/*.controller.ts` or `**/*.dto.ts`
- **Schema** — files matching `**/*.schema.ts` (Drizzle schema definitions)
- **Documentation** — files under `documentation/`
- **Feature implementation** — any source file that implements a feature with a corresponding design doc

## Step 2 — Apply relevant rules for each changed file

For each changed file, apply the relevant rule from CLAUDE.md:

### Rule 3: OpenAPI documentation (for controllers and DTOs)

When any of the following are modified:

- A controller method (new endpoint, changed path, changed HTTP method)
- A request DTO or response DTO
- An enum used in a request or response

Then verify and update:

- `@ApiTags`, `@ApiOperation`, `@ApiResponse` on the controller
- `@ApiProperty` on all DTO fields (type, description, example, required/optional)
- `@ApiBearerAuth()` if the endpoint requires authentication

No endpoint may be left without a summary (`@ApiOperation`), at least one `@ApiResponse`, and fully annotated DTO fields.

### Rule 5: Migration file (for schema changes)

When any Drizzle schema file (`*.schema.ts`) is modified — new table, new column, renamed column, dropped column, new index, constraint change — a migration file must be generated:

```bash
pnpm --filter db drizzle-kit generate
```

The generated `.sql` file must be committed alongside the schema change in the same PR. No schema change may be merged without its corresponding migration file. Destructive operations (column drops, renames) require a multi-step migration strategy — document the steps in the PR description.

### Rule 1: Documentation cross-reference integrity (for doc changes)

When any file under `documentation/` is modified:

- Scan all other documentation files for references to the modified file (by name or by the concepts it owns)
- If any reference is stale, incorrect, or inconsistent with the change just made, update it in the same session
- This includes `CLAUDE.md` itself — if a decision or rule changes, update the relevant section

### Feature implementation vs design doc alignment

For each changed source file that implements a feature:

1. Identify which design document covers that feature (e.g. `documentation/features/trips.md` for trip-related code)
2. Read the design doc
3. Compare the implementation against the spec:
   - Enum values match?
   - Field names match the documented table columns?
   - Business rules are enforced in the code?
4. Flag any discrepancy — do not silently reconcile. Report it so the developer can decide whether to fix the code or update the spec.

## Step 3 — Produce summary report

After completing all checks, output a structured summary:

```
## autodoc report

### Files reviewed
- list of all changed files and their category

### OpenAPI updates
- list of changes made, or "No issues found"

### Migration files
- list of migration files generated or verified, or "No schema changes"

### Documentation updates
- list of cross-reference updates made, or "No issues found"

### Discrepancies requiring human decision
- list of implementation vs. spec mismatches that need resolution
```

Be thorough. The goal is to ensure the codebase and its documentation never drift apart.
