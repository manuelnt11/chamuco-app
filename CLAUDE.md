# Chamuco App — Project Brief for AI Assistants

This file provides essential context for working on Chamuco App. Read it in full before making any code or documentation changes. For detailed specs, refer to the files under `documentation/`.

---

## What Is Chamuco App

A **group travel coordination platform**. It covers the full lifecycle of a trip: planning, itinerary, participant management, shared expenses, reservations, and real-time communication between travelers. The project is currently in the **design and documentation phase** — no source code has been written yet.

---

## Language Rules (Non-Negotiable)

- **All code is in English**: variable names, function names, enums, table names, column names, TypeScript types, comments, file names. No exceptions.
- **All documentation is in English**.
- **No hardcoded user-facing strings on the frontend**. Every visible text must use `i18next` `t()` references. Enforced by `eslint-plugin-i18next` at lint and CI level. This is a hard requirement, not a guideline.

---

## Tech Stack (All Decided)

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Backend framework | NestJS |
| Frontend framework | Next.js (React) |
| PWA | `@ducanh2912/next-pwa` + unified Service Worker (caching + FCM background messages) |
| Styling | Tailwind CSS |
| ORM | Drizzle ORM |
| Migrations | drizzle-kit — generates `.sql` files committed to Git |
| Primary database | PostgreSQL (Cloud SQL) |
| Real-time messaging | Firestore (Firebase) |
| Authentication | Firebase Authentication (Google Sign-In + Passkeys) |
| Push notifications | Firebase Cloud Messaging (FCM) |
| API documentation | `@nestjs/swagger` — OpenAPI 3.0, Swagger UI at `/api/docs` |
| Backend testing | Jest + `@swc/jest` — unit and integration tests |
| Frontend testing | Vitest + React Testing Library — unit and component tests |
| E2E testing | Playwright — cross-browser end-to-end tests |
| Code formatting | Prettier — indentation, quotes, trailing commas; config at `.prettierrc` |
| Git hooks | Husky + lint-staged — pre-commit enforces lint, format, unit tests, and 90% coverage |
| Frontend i18n | `i18next` + `react-i18next` |
| Backend i18n | `nestjs-i18n` |
| Cloud | Google Cloud Platform (GCP) |
| Hosting | Cloud Run (containerized, serverless, scales to zero) |
| File storage | Cloud Storage |
| CI/CD | GitHub Actions (two independent pipelines: `api` and `web`) |
| Repository | Monorepo — pnpm workspaces + Turborepo |

---

## Critical Architectural Decisions

### PostgreSQL is the source of truth for memberships
Firestore is used exclusively for real-time message delivery. Who belongs to which channel is always determined by PostgreSQL. Any membership change (join trip, leave group, remove participant, etc.) must be **immediately and synchronously synced to Firestore** by the NestJS backend via the Firebase Admin SDK. The frontend never writes to Firestore directly — all writes go through the NestJS API.

### Migrations are explicit SQL files
Never use schema push or auto-sync. Every schema change produces a `.sql` file via `drizzle-kit generate`, which is committed to Git and reviewed in PRs. Destructive operations (column drops, renames) require a multi-step migration strategy.

### Firebase Admin SDK is the only Firestore writer
The frontend reads from Firestore in real time via the Firebase client SDK. It never writes. All writes (messages, membership updates) go through `POST /api/v1/...` on the NestJS backend, which validates auth and membership in PostgreSQL before writing to Firestore.

### CI/CD pipeline order for backend
On push to `main`: lint → type check → tests → build → Docker image → push image → **run DB migrations** → deploy to Cloud Run. Migrations run before deploy. If migrations fail, deployment is skipped.

### No custom JWT system
Authentication is fully delegated to Firebase Authentication. The backend verifies Firebase ID tokens via `admin.auth().verifyIdToken()`. There is no Chamuco-issued JWT.

---

## Key Domain Rules

### Users
- Every user must choose a unique `@username` at registration: lowercase, 3–30 chars, `a-z 0-9 _ -` only, stored without `@`, displayed with `@`.
- Personal data (passport, emergency contact, dietary needs, allergies, phobias, physical limitations) lives on the user profile (`user_profiles`, `user_health_profiles`) — never duplicated per trip.

### Trips
- A trip starts at **00:00 on `start_date`** and ends at **24:00 on `end_date`** (`end_date >= start_date`, same day is valid).
- Once `IN_PROGRESS`: all edits require organizer confirmation and all confirmed participants are notified.
- An organizer/co-organizer can **always** invite any user regardless of trip visibility (public or private).
- Changing trip visibility never affects pending requests or invitations.

### Participants & Groups
- Dual membership flow: public trips/groups allow user join requests; private trips/groups use organizer invitations. Both paths always available to organizers.
- Only one active request **or** invitation per user per trip/group at a time.
- Last organizer (trip) or last admin (group) cannot leave without transferring the role first.

### Messaging (Slack-like)
- DMs (1:1) and Channels (named, PUBLIC or PRIVATE).
- Every trip and group auto-creates a PRIVATE channel mirroring its membership and roles.
- PUBLIC channels: anyone can enter as VIEWER (read-only, no approval) or join as MEMBER (can post, no approval).
- All members see full message history regardless of when they joined.
- Channel membership in Firestore is always derived from PostgreSQL — never managed independently.

### Itinerary
- Five item categories: `TRANSPORT`, `AIRPORT`, `PLACE`, `FOOD`, `OTHER` — each with detailed subtype enums.
- Day 0 is the pre-departure day for logistical items before the official trip start.
- Items have `duration_minutes`, `participant_ids` (subset scoping), multi-currency fields with `exchange_rate_snapshot`.

### Expenses
- `amount` = total group cost in original currency.
- `participant_scope` = UUID[] of which participants the expense covers (not always all).
- `amount_per_participant` = auto-computed from `amount / participant_count`.
- `exchange_rate_snapshot` is immutable — snapshotted at time of recording.

---

## Documentation Structure

All design documentation lives in `documentation/`. Key files:

| File | Contents |
|---|---|
| `overview/tech-stack.md` | Full stack decisions with rationale |
| `overview/project-overview.md` | Vision, goals, principles |
| `architecture/backend-architecture.md` | NestJS modules, API design, OpenAPI/Swagger |
| `architecture/database-design.md` | Schema philosophy, JSONB usage |
| `architecture/monorepo-structure.md` | Directory layout |
| `features/users.md` | User account, personal profile, health profile, loyalty programs |
| `features/trips.md` | Trip lifecycle, itinerary model, full taxonomy |
| `features/participants.md` | Membership flows, states, guest participants |
| `features/community.md` | Groups, Slack-like messaging, Firestore architecture |
| `features/expenses.md` | Expense model, splits, settlements, multi-currency |
| `features/reservations.md` | Booking records, metadata by type |
| `features/pre-trip-planning.md` | Pre-trip tasks, route planning, budget envelopes |
| `infrastructure/auth.md` | Firebase Authentication integration |
| `infrastructure/cloud.md` | GCP services, CI/CD pipelines |
| `design/localization.md` | i18n spec, key naming, enforcement |

---

## Standing Rules for AI Assistants

These rules apply to every session, regardless of what task is being performed.

### 1. Documentation cross-reference integrity

When any file under `documentation/` is modified, before closing the task:
- Scan all other documentation files for references to the modified file (by name or by the concepts it owns).
- If any reference is stale, incorrect, or inconsistent with the change just made, update it in the same session.
- This includes `CLAUDE.md` itself — if a decision or rule changes, update the relevant section here too.

### 2. OpenAPI documentation on every backend change

Every NestJS controller endpoint must be fully documented with `@nestjs/swagger` decorators. When any of the following are modified:
- A controller method (new endpoint, changed path, changed HTTP method)
- A request DTO or response DTO
- An enum used in a request or response

Then verify and update:
- `@ApiTags`, `@ApiOperation`, `@ApiResponse` on the controller
- `@ApiProperty` on all DTO fields (type, description, example, required/optional)
- `@ApiBearerAuth()` if the endpoint requires authentication

No endpoint may be left without a summary (`@ApiOperation`), at least one `@ApiResponse`, and fully annotated DTO fields.

### 3. Pre-commit quality gates are non-negotiable

Every commit must pass all four gates enforced by the Husky pre-commit hook:

1. **Format** — `prettier --write` on staged files. If a file is touched, it must be correctly formatted.
2. **Lint** — `eslint --fix` on staged files. Auto-fixable violations are fixed automatically; non-auto-fixable violations block the commit.
3. **Unit tests** — `turbo run test --filter=[HEAD^1]` runs unit tests for all packages affected by the commit.
4. **Coverage** — 90% threshold on lines, statements, functions, and branches for affected packages. A commit that drops any metric below 90% is rejected.

When writing new code:
- Every new function, service method, or component must have corresponding unit tests.
- New tests must be added in the same commit as the code they cover — never defer test writing to a later commit.
- Coverage thresholds are configured in `apps/api/jest.config.ts` (backend) and `apps/web/vitest.config.ts` (frontend).

### 4. Migration file on every schema change

When any Drizzle schema file (`*.schema.ts`) is modified — new table, new column, renamed column, dropped column, new index, constraint change — a migration file must be generated:

```bash
pnpm --filter db drizzle-kit generate
```

The generated `.sql` file must be committed alongside the schema change in the same PR. No schema change may be merged without its corresponding migration file. Destructive operations (column drops, renames) require a multi-step migration strategy — document the steps in the PR description.

### 5. `/autodoc` command

When the `/autodoc` command is invoked, perform the following automatically:

1. Run `git diff main...HEAD --name-only` to identify all files changed since branching from `main`.
2. For each changed file, apply the relevant rule:
   - **Controller or DTO changed** → verify OpenAPI decorators are complete and accurate (Rule 2).
   - **Schema file changed** → verify a migration file exists for the change; if not, generate it (Rule 4).
   - **Documentation file changed** → scan cross-references and update stale ones (Rule 1).
   - **Feature implemented that has a design doc** → read the design doc and verify the implementation matches. Flag any discrepancy.
3. Produce a summary of what was checked, what was updated, and any issues found.

This command is the primary documentation maintenance tool during the implementation phase.

### 6. `/write_pr` command

When the `/write_pr` command is invoked, draft a pull request title and description and output it as **raw markdown only** — no prose before or after, ready to paste directly into GitHub.

**Gather context first:**
- Run `git diff main...HEAD --name-only` for the list of changed files.
- Run `git log main...HEAD --oneline` for the commit history.
- Run `git diff main...HEAD` to understand the intent behind the changes.
- Review the current session conversation (if available) — the "why" is often more visible there than in the diff.

**Title rules:**
- Maximum 72 characters.
- Conventional Commits prefix with optional scope: `feat(trips):`, `fix(auth):`, `docs:`, `refactor:`, `chore:`, `ci:`, `test:`.
- Imperative mood: "add", "fix", "update", "remove" — not past tense.
- No period at the end. Capitalize only the first word after the colon.

**Body structure** — omit any section that does not apply, never include an empty header:

```
## Summary
One paragraph explaining the motivation — the "why". Not the "what" (that is in Changes and in Files Changed).

## Changes
Grouped by logical intent, not by file. Each bullet answers "what changed and why it matters".
Do not list files. Do not write "updated X.md" — describe what conceptually changed.

## Breaking Changes
Only if the PR introduces API contract changes, schema changes requiring coordinated deploys,
removed fields, or renamed enums. Describe what breaks and what consumers must do.

## Testing

Adapt to the type of change. Always include edge cases at the end regardless of type.

**For backend changes:**
- Exact commands to run: `pnpm --filter api test`, specific test files if relevant.
- Endpoints to exercise via Swagger UI at `/api/docs`.
- Specific happy-path scenarios to validate manually.

**For frontend changes:**
- Steps to reproduce the affected flow from scratch (e.g., "1. Log in, 2. Navigate to X, 3. Do Y").
- Visual or behavioral outcomes to verify (e.g., "the button should be disabled until the form is valid").
- Responsive / locale behavior if the change touches layout or text.

**For schema changes:**
- Confirm the migration file is present in `packages/db/migrations/`.
- Run `drizzle-kit migrate` locally and verify it applies cleanly.
- Seed or insert test data that exercises the new/modified columns.

**For documentation changes:**
- What to read and verify for internal consistency and cross-reference accuracy.

**Edge cases (always include, for every type of change):**
- Invalid or boundary inputs (empty strings, null, values outside allowed ranges, special characters).
- Unsupported enum values or types.
- Actions performed by a user without the required role or permission.
- Concurrent or out-of-order operations if the change involves state transitions.
- Any scenario that should be rejected — confirm the correct error is returned.

## Notes
Only if there is something the reviewer must know that is not obvious from the diff.
Examples: ⚠️ includes a DB migration, OpenAPI updated, follow-up PR needed.
```

**Output:** raw markdown only. First line is the title, blank line, then the body. No code fences, no preamble, no explanation after.

---

## Open Decisions (Still Pending)

All major technical and architectural decisions have been resolved. No open items remain at this time.
