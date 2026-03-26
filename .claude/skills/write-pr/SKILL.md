---
name: write-pr
description: Draft a pull request title and description in raw markdown, ready to paste into GitHub
---

You are running the `/write_pr` command for the Chamuco App project. Your job is to draft a pull request title and description and output it as **raw markdown only** — no prose before or after, ready to paste directly into GitHub.

## Step 1 — Gather context

Run the following commands and read their output:

```bash
# Files changed vs main
git diff main...HEAD --name-only

# Commit history on this branch
git log main...HEAD --oneline

# Full diff (for understanding intent)
git diff main...HEAD
```

Also review the current session conversation (if available) — the "why" is often more visible there than in the diff.

## Step 2 — Draft the title

Rules:

- **Maximum 72 characters**
- **Conventional Commits prefix** with optional scope: `feat(trips):`, `fix(auth):`, `docs:`, `refactor:`, `chore:`, `ci:`, `test:`
- **Imperative mood**: "add", "fix", "update", "remove" — not past tense
- **No period at the end**
- **Capitalize only the first word after the colon**

Examples:

- `feat(users): add username field with uniqueness constraints`
- `docs: establish OpenAPI, migration, and CI/CD standards`

## Step 3 — Draft the body

Use exactly this structure. Omit sections that don't apply — never include empty section headers.

### Summary

One paragraph explaining the **motivation** — the "why". Not the "what" (that is in Changes and in Files Changed).

### Changes

Grouped by logical intent, not by file. Each bullet answers "what changed and why it matters". Keep bullets concise (1-2 lines each).

- **Area or concept**: description of the change and its purpose

Do not list files. Do not say "updated X.md" — describe what conceptually changed.

### Breaking Changes

> Only include this section if the PR introduces breaking changes

- Description of what breaks and what consumers need to do

### Testing

Adapt to the type of change. Always include edge cases at the end regardless of type.

**For backend changes:**

- Exact commands to run: `pnpm --filter api test`, specific test files if relevant
- Endpoints to exercise via Swagger UI at `/api/docs`
- Specific happy-path scenarios to validate manually

**For frontend changes:**

- Steps to reproduce the affected flow from scratch (e.g., "1. Log in, 2. Navigate to X, 3. Do Y")
- Visual or behavioral outcomes to verify (e.g., "the button should be disabled until the form is valid")
- Responsive / locale behavior if the change touches layout or text

**For schema changes:**

- Confirm the migration file is present in `packages/db/migrations/`
- Run `drizzle-kit migrate` locally and verify it applies cleanly
- Seed or insert test data that exercises the new/modified columns

**For documentation changes:**

- What to read and verify for internal consistency and cross-reference accuracy

**Edge cases (always include, for every type of change):**

- Invalid or boundary inputs (empty strings, null, values outside allowed ranges, special characters)
- Unsupported enum values or types
- Actions performed by a user without the required role or permission
- Concurrent or out-of-order operations if the change involves state transitions
- Any scenario that should be rejected — confirm the correct error is returned

### Notes

> Only include this section if there is something the reviewer must know that isn't obvious from the diff

Examples: ⚠️ includes a DB migration, OpenAPI updated, follow-up PR needed

## Step 4 — Output

Print **only** the raw markdown — title on the first line, then a blank line, then the body. No code fences around it. No preamble. No explanation after.

## Quality checks before outputting

- Title is ≤ 72 characters
- Summary explains "why", not "what"
- No bullet says "updated [filename]" — it says what changed conceptually
- No section header is present with empty content
- Breaking Changes section is only present if there actually are breaking changes
- Testing section covers the correct type(s) of change and always ends with edge cases
- Tone is professional English, concise, past tense in bullets ("added", "moved", "replaced") since the work is done
