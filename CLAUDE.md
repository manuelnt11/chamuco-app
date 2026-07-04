# Chamuco App — Project Brief for AI Assistants

**Public name:** Chamuco Travel · **Domain:** chamucotravel.com · **Tagline:** An app for groups that travel (not a travel app).

Covers the full lifecycle of group travel: planning, itinerary, participants, shared expenses, reservations, real-time communication, and long-term social identity (achievements, reputation, rankings, discovery map). Closest reference: Strava, applied to group travel.

**Package-specific instructions** — read the relevant file when working inside a sub-package:

- `apps/web/CLAUDE.md` — Next.js frontend: i18n namespaces, env variable sync, React patterns
- `apps/api/CLAUDE.md` — NestJS backend: OpenAPI decorators, migrations, file uploads
- `apps/api/src/database/CLAUDE.md` — Schema, migration workflow, Drizzle client
- `apps/api/src/i18n/CLAUDE.md` — Backend i18n: key conventions, interpolation syntax
- `packages/shared-types/CLAUDE.md` — Shared enums and types: PG sync rules

---

## Language Rules (Non-Negotiable)

- **All code is in English**: variable names, function names, enums, table names, column names, TypeScript types, comments, file names. No exceptions.
- **All documentation is in English**.
- **No hardcoded user-facing strings on the frontend**. Every visible text must use `i18next` `t()` references. Enforced by `eslint-plugin-i18next` at lint and CI level.

---

## Tech Stack

| Layer               | Technology                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Runtime             | Node.js + TypeScript                                                                        |
| Backend framework   | NestJS                                                                                      |
| Frontend framework  | Next.js (React)                                                                             |
| PWA                 | `@ducanh2912/next-pwa` + unified Service Worker (caching + FCM background messages)         |
| Theme management    | `next-themes` — SSR-safe dark/light/system toggle, cookie-backed, Tailwind `class` strategy |
| Styling             | Tailwind CSS                                                                                |
| ORM                 | Drizzle ORM                                                                                 |
| Migrations          | drizzle-kit — generates `.sql` files committed to Git                                       |
| Primary database    | PostgreSQL (Cloud SQL)                                                                      |
| Real-time messaging | Firestore (Firebase) — **post-MVP only**                                                    |
| Authentication      | Firebase Authentication (Google Sign-In + Facebook Sign-In)                                 |
| Push notifications  | Firebase Cloud Messaging (FCM)                                                              |
| API documentation   | `@nestjs/swagger` — OpenAPI 3.0, Swagger UI at `/api/docs`                                  |
| Backend testing     | Jest + `@swc/jest`                                                                          |
| Frontend testing    | Vitest + React Testing Library                                                              |
| E2E testing         | Playwright                                                                                  |
| Code formatting     | Prettier — config at `.prettierrc`                                                          |
| Code linting        | ESLint 9.x flat config — `eslint.config.mjs` per package                                    |
| Git hooks           | Husky + lint-staged — pre-commit enforces lint, format, unit tests, 90% coverage            |
| Frontend i18n       | `i18next` + `react-i18next`                                                                 |
| Backend i18n        | `nestjs-i18n`                                                                               |
| Cloud               | GCP — Cloud Run, Cloud SQL (PostgreSQL), Cloud Storage                                      |
| CI/CD               | GitHub Actions (two pipelines: `api` and `web`)                                             |
| Dependency catalog  | pnpm catalog (`pnpm-workspace.yaml`) — shared `devDependencies` versioned once              |
| Repository          | Monorepo — pnpm workspaces + Turborepo                                                      |

---

## Critical Architectural Decisions

**PostgreSQL is the source of truth for memberships.** Firestore is for real-time message delivery only. Any membership change must be synchronously synced to Firestore by the NestJS backend via Firebase Admin SDK. The frontend never writes to Firestore directly.

**Migrations are explicit SQL files.** Never use schema push or auto-sync. Every schema change produces a `.sql` file via `drizzle-kit generate`, committed to Git.

**Firebase Admin SDK is the only Firestore writer.** The frontend reads from Firestore via the client SDK; all writes go through `POST /api/v1/...` on the NestJS backend.

**CI/CD pipeline order:** lint → type check → tests → build → Docker image → push image → run DB migrations (inside the container at startup) → deploy to Cloud Run. Migrations run before the NestJS process starts. If they fail, the container exits with code 1 and Cloud Run keeps the previous revision live.

**No custom JWT.** Authentication is delegated to Firebase Authentication. The backend verifies Firebase ID tokens via `admin.auth().verifyIdToken()`.

**Firestore is not used in MVP.** FCM is the only Firebase service active in MVP. Firestore is introduced post-MVP when Slack-like messaging is built.

---

## Key Domain Coding Constraints

These are the rules that directly affect how code is written. Full domain specs live in `documentation/features/`.

### Users

- `@username`: lowercase, 3–30 chars, `a-z0-9_-`, stored without `@`, displayed with `@`.
- **Soft-delete only** — never `DELETE FROM users`. Set `deleted_at`; all `NOT NULL` FKs with `ON DELETE restrict` are safe because the row is never physically removed.
- `SUPPORT_ADMIN` bypasses all access restrictions, is never counted as a participant, and every write it performs is logged immutably in `support_admin_audit_log`.
- When a user updates their passport number, the NestJS service must **synchronously** mark all ETAs under the old `passport_number` as `EXPIRED`.
- Daily job updates `ACTIVE` → `EXPIRING_SOON` → `EXPIRED` for passports, visas, and ETAs with non-null expiry dates.
- Visa and ETA data is visible to the user only — **never** exposed to organizers.

### Groups

- **Soft-delete only** — set `deleted_at`, null the `cover` FK in the same operation. All group queries must filter `IS NULL deleted_at`.
- `group_members` and `group_member_stats` use composite PKs `(group_id, user_id)`.
- Last admin cannot leave without transferring the role first.

### Trips

- Trip starts at 00:00 on `start_date`, ends at 24:00 on `end_date`. `end_date >= start_date` (same day is valid).
- `participant_capacity` is required, ≥ 1, cannot be reduced below the current confirmed participant count.
- Visibility controls discoverability only — an organizer can always invite any user regardless of visibility.
- Route for LP distance: `departure_location → trip_destinations (by position) → return_location` (falls back to `departure_location` if `return_location` is null).
- Once `IN_PROGRESS`: all edits require organizer confirmation; all confirmed participants are notified.
- Exactly one organizer per trip (the trip's owner). The organizer cannot leave without transferring the role first. On transfer, the previous organizer becomes CO_ORGANIZER with no initial permissions.

### Participants

- Only one active `PENDING_REQUEST` or `INVITED` record per user per trip/group at a time.
- Cancel = record deleted (no terminal status set), slot freed immediately.
- Waitlist = `PENDING_REQUEST` records ordered by `initiated_at`. In `WAITLIST_MODE`, the organizer cannot skip a request to accept a later one.
- Both role promotion and role downgrade are direct organizer actions with no invitation or acceptance flow. `trip_role_invitations` does not exist.

### Expenses

- `exchange_rate_snapshot` is **immutable** — snapshotted at time of recording, never overwritten.
- Settlement excludes participants with `did_travel = false`.
- No real money is processed — ledger only.

### Gamification

- Traveler Score is **never editable**.
- Achievements are earned once, never lost.

---

## Documentation Structure

Full specs live in `documentation/`. Key files:

| File                                   | Contents                                                |
| -------------------------------------- | ------------------------------------------------------- |
| `overview/mvp.md`                      | MVP scope and out-of-scope features                     |
| `overview/project-overview.md`         | Vision, goals, principles                               |
| `overview/tech-stack.md`               | Full stack decisions with rationale                     |
| `architecture/backend-architecture.md` | NestJS modules, API design, OpenAPI/Swagger             |
| `architecture/database-design.md`      | Schema philosophy, JSONB usage                          |
| `architecture/monorepo-structure.md`   | Directory layout, import aliases, pnpm catalog          |
| `architecture/email-architecture.md`   | Email module ADR: library, boundaries, retry, templates |
| `features/users.md`                    | User account, profile, passports, health                |
| `features/agencies.md`                 | Travel agencies, coordinators                           |
| `features/trips.md`                    | Trip lifecycle, roles, destinations, completion flow    |
| `features/participants.md`             | Membership flows, states, waitlist                      |
| `features/invitation-tokens.md`        | Shareable invite links: referral, trip, group           |
| `features/community.md`                | Groups, messaging (post-MVP), Firestore                 |
| `features/expenses.md`                 | Expense model, splits, settlements, multi-currency      |
| `features/gamification.md`             | Traveler Score, achievements, Chamuco Points            |
| `features/notifications.md`            | FCM, in-app feed, opt-out preferences                   |
| `features/email.md`                    | Transactional email: types, templates, how to add new   |
| `features/reservations.md`             | Booking records, metadata by type                       |
| `features/pre-trip-planning.md`        | Pre-trip tasks, route planning, budget envelopes        |
| `features/events.md`                   | Events: modes, categories, RSVP, gamification           |
| `features/calendar.md`                 | Calendar views: monthly grid + upcoming list            |
| `infrastructure/auth.md`               | Firebase Authentication integration                     |
| `infrastructure/cloud.md`              | GCP services, CI/CD pipelines                           |
| `infrastructure/cloud-sql-setup.md`    | Cloud SQL provisioning guide                            |
| `infrastructure/cloud-sql-config.md`   | Project-specific Cloud SQL config                       |
| `infrastructure/backup-restore.md`     | Backup and restore workflow                             |
| `infrastructure/local-development.md`  | Docker Compose, database scripts, dev workflow          |
| `design/localization.md`               | i18n spec, key naming, enforcement                      |

---

## Standing Rules

### 1. Documentation cross-reference integrity

When any file under `documentation/` is modified:

- Scan all other documentation files for references to the modified file (by name or concept).
- Update stale or inconsistent references in the same session.
- This includes `CLAUDE.md` itself — if a decision or rule changes, update the relevant section here too.

### 2. No relative imports — always use path aliases

Never use relative imports that navigate upward (`../`). Always use:

- `@/*` — within the same app (`apps/api` or `apps/web`)
- `@chamuco/shared-types`, `@chamuco/shared-utils` — cross-package imports

```ts
// ✅ Correct
import { UsersService } from '@/modules/users/users.service';
import type { ITrip } from '@chamuco/shared-types';

// ❌ Wrong
import { UsersService } from '../../users/users.service';
```

See `documentation/architecture/monorepo-structure.md` — "Import Aliases" section for the full spec.

### 3. Pre-commit quality gates are non-negotiable

Every commit must pass all five gates enforced by the Husky pre-commit hook:

1. **Format** — `prettier --write` on staged files.
2. **Lint** — `eslint --fix` on staged files.
3. **Security audit** — `pnpm audit --audit-level=high`.
4. **Unit tests** — `turbo run test --filter=[HEAD^1]` for affected packages.
5. **Coverage** — 90% threshold on lines, statements, functions, and branches.

Manual validation across all packages:

```bash
pnpm validate
```

Every new function, service method, or component must have corresponding unit tests **in the same commit** — never defer.

### 4. Truncate test and lint output

Always pipe through `tail -n 100` when running tests or linters:

```bash
pnpm --filter api test 2>&1 | tail -n 100
pnpm --filter web test 2>&1 | tail -n 100
pnpm --filter api lint:check 2>&1 | tail -n 100
```

Use `lint` to auto-fix, `lint:check` to report only. Do **not** truncate build commands.

### 5. Strict TypeScript — avoid `any` and `unknown`

- Prefer `@ts-expect-error` over `as any` (self-documenting; TypeScript warns when the error disappears).
- Narrow `unknown` immediately with type guards.
- Create proper type definitions instead of using `any` for untyped libraries.
- Use generic constraints (`T extends Record<string, unknown>`) instead of `any`.

Every use of `any` or `unknown` requires a comment explaining why it's necessary.

### 6. pnpm catalog — shared devDependency versioning

Shared `devDependencies` that appear in more than one package are versioned once in `pnpm-workspace.yaml`. Reference them with `"catalog:"` in individual `package.json` files — never add a duplicate pinned version.

Currently cataloged: `@types/node`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@vitest/coverage-v8`, `eslint`, `eslint-config-prettier`, `eslint-plugin-i18next`, `eslint-plugin-prettier`, `prettier`, `typescript`, `vitest`.

See `documentation/architecture/monorepo-structure.md` — "pnpm Catalog" section.

### 7. Cloud Storage — always delete replaced or removed assets

Assets are normalized records in the `assets` table. Entity tables hold a `UUID FK → assets.id`, never a raw URL. When replacing an asset:

1. Fetch the old asset record **before** the transaction.
2. Run the DB transaction (insert new asset, update entity FK).
3. After commit: call `cloudStorage.makePublic(newKey)` if public-intent prefix (`avatars/`, `group-covers/`).
4. After commit: call `cloudStorage.deleteObject(oldAsset.target)` then `DELETE FROM assets WHERE id = oldAsset.id`.

GCS delete happens **after** commit — a failed GCS delete surfaces as an error but does not block the user (the storage audit job cleans up orphaned objects). See `UsersService.updateAvatar` as the reference implementation.

Applies to: user avatar, trip cover, agency logo, and any future `assets` FK.

### 8. Cloud Run deployment — required flags

When modifying `.github/workflows/api.yml`, `.github/workflows/web.yml`, or any `gcloud run deploy` command, these flags are **required**:

| Flag                      | Value  | Applies to | Why                                     |
| ------------------------- | ------ | ---------- | --------------------------------------- |
| `--execution-environment` | `gen2` | api, web   | Faster cold starts, Unix socket support |
| `--no-use-http2`          | (flag) | api, web   | NestJS WebSocket / SSE compatibility    |
| `--memory`                | `1Gi`  | web only   | Next.js SSR OOMs on the 256 Mi default  |

**Migrations run inside the container, never in GitHub Actions.** GitHub Actions has no VPC access to Cloud SQL. `startup.sh` runs migrations before `pnpm start:prod`. Sequence: `startup.sh → get-iam-token.js → run-migrations.js → pnpm start:prod`.

**IAM token must be fetched dynamically per connection** in `drizzle.provider.ts` — tokens expire after ~1 hour. Only `startup.sh` (which runs and exits immediately) may use a static `PGPASSWORD`.

**Cloud SQL IAM auth scope:** always use `sqlservice.login`, not `sqlservice.admin`.

---

## Open Decisions

All major technical and architectural decisions have been resolved. No open items remain at this time.

---

## Project Tracking

Work is tracked in a **GitHub Projects v2** kanban board at <https://github.com/users/manuelnt11/projects/4> (project number 4, owner `manuelnt11`).

| Field    | Options                                                             |
| -------- | ------------------------------------------------------------------- |
| Status   | Backlog, In Progress, In Review, Done                               |
| Area     | Backend, Frontend, Infrastructure, Database, Documentation, Testing |
| Priority | High, Medium, Low                                                   |
| Size     | XS, S, M, L, XL                                                     |

**Epics** — GitHub Issues with label `epic`. Sub-issues linked via GitHub's native parent-child relationship. An epic is closed when all sub-issues reach Done. Epics are not assigned a Size field.

```bash
# Create epic
gh issue create --title "Epic: <name>" --label "epic" --body "<description>"

# List epics
gh issue list --label epic

# Project board
gh project item-list 4 --owner manuelnt11
gh project item-create 4 --owner manuelnt11 --title "Title here"
gh project field-list 4 --owner manuelnt11
```
