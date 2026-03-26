# Chamuco App — Project Brief for AI Assistants

This file provides essential context for working on Chamuco App. Read it in full before making any code or documentation changes. For detailed specs, refer to the files under `documentation/`.

---

## What Is Chamuco App

**Public name:** Chamuco Travel · **Domain:** chamucotravel.com (tentative)

**Chamuco is not a travel app. It is an app for groups that travel.**

It covers the full lifecycle of a group's journey together: trip planning, itinerary, participant management, shared expenses, reservations, real-time communication, and — crucially — the long-term social identity of the group: achievements, reputation, rankings, recognitions, and a personal travel history that grows with every trip. The closest reference is Strava, applied to group travel.

The project is currently in the **design and documentation phase** — no source code has been written yet.

---

## Language Rules (Non-Negotiable)

- **All code is in English**: variable names, function names, enums, table names, column names, TypeScript types, comments, file names. No exceptions.
- **All documentation is in English**.
- **No hardcoded user-facing strings on the frontend**. Every visible text must use `i18next` `t()` references. Enforced by `eslint-plugin-i18next` at lint and CI level. This is a hard requirement, not a guideline.

---

## Tech Stack (All Decided)

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
| Real-time messaging | Firestore (Firebase)                                                                        |
| Authentication      | Firebase Authentication (Google Sign-In + Facebook Sign-In)                                 |
| Push notifications  | Firebase Cloud Messaging (FCM)                                                              |
| API documentation   | `@nestjs/swagger` — OpenAPI 3.0, Swagger UI at `/api/docs`                                  |
| Backend testing     | Jest + `@swc/jest` — unit and integration tests                                             |
| Frontend testing    | Vitest + React Testing Library — unit and component tests                                   |
| E2E testing         | Playwright — cross-browser end-to-end tests                                                 |
| Code formatting     | Prettier — indentation, quotes, trailing commas; config at `.prettierrc`                    |
| Git hooks           | Husky + lint-staged — pre-commit enforces lint, format, unit tests, and 90% coverage        |
| Frontend i18n       | `i18next` + `react-i18next`                                                                 |
| Backend i18n        | `nestjs-i18n`                                                                               |
| Cloud               | Google Cloud Platform (GCP)                                                                 |
| Hosting             | Cloud Run (containerized, serverless, scales to zero)                                       |
| File storage        | Cloud Storage                                                                               |
| CI/CD               | GitHub Actions (two independent pipelines: `api` and `web`)                                 |
| Repository          | Monorepo — pnpm workspaces + Turborepo                                                      |

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
- **Authentication providers** (`auth_provider` on `users`): `GOOGLE` or `FACEBOOK`. The `display_name` is pre-filled from the OAuth provider at registration and is editable.
- **Nationalities & travel documents** — stored in `user_nationalities` (1:many, min 1). Each record represents one citizenship and optionally holds the national ID, passport number, issue date, expiry date, and a pre-computed `PassportStatus` (`OMITTED` | `ACTIVE` | `EXPIRING_SOON` | `EXPIRED`). Unique index on `(user_id, country_code)`. Status is set immediately by the app when passport data is saved; a daily job updates `ACTIVE` → `EXPIRING_SOON` → `EXPIRED` for records with a non-null expiry date (skips `OMITTED`).
- **Date of birth** — stored as JSONB `{ day, month, year, year_visible }` on `user_profiles`. The `year_visible` flag controls public profile display.
- **Birth and residence location** — `user_profiles` stores `birth_country`, `birth_city`, `home_country`, and `home_city`. `home_city` is used as the departure origin for LP distance calculations; falls back to country centroid if not set.
- **Emergency contacts** — stored in `user_emergency_contacts` (1:many). At least one is mandatory. Each has `full_name`, `phone_number`, `relationship`, and `is_primary`.
- **Loyalty programs** (`user_loyalty_programs`) — reference data only, not linked to reservation records.
- **Structured health data** — phobias, physical limitations, food allergies, and medical conditions each have a dedicated table (`user_phobias`, `user_physical_limitations`, `user_food_allergies`, `user_medical_conditions`) with a selection enum per category. Every category includes `OTHER` + required `description` for non-standard entries.
- **Traveler stats and discovery map** visibility follows the main `ProfileVisibility` setting — no independent toggle.
- **Platform roles** (`platform_role` on `users`): `USER` (default) or `SUPPORT_ADMIN`. A `SUPPORT_ADMIN` is a service account for troubleshooting — it bypasses all trip and group access restrictions (authentication still required), is never counted as a participant, has no travel profile or gamification records, and every write it performs is logged immutably in `support_admin_audit_log`. The role is not assignable from within the app.
- **Agencies** — a higher-level entity (`agencies` table) that groups professional trip organizers under a common brand. A user may belong to at most one agency (`agency_id` on `users`). Agency coordinators can create and manage trips on behalf of the agency. See `features/agencies.md`.

### Trips

- A trip starts at **00:00 on `start_date`** and ends at **24:00 on `end_date`** (`end_date >= start_date`, same day is valid).
- Once `IN_PROGRESS`: all edits require organizer confirmation and all confirmed participants are notified.
- **Trip visibility controls discoverability only**, not who can be invited. `PUBLIC` = listed publicly; `PRIVATE` = not searchable, visible only to members of groups explicitly listed in `trip_visible_to_groups`.
- An organizer can **always** invite any user regardless of trip visibility.
- If a user can see the trip (by any visibility path), they can submit a join request. Changing visibility does not affect pending requests or invitations already in flight.
- **Invite links** (`trip_invite_links`) — a separate mechanism from visibility. An organizer generates a shareable link with a unique token. A non-registered user who follows the link is directed to registration; upon completing it, an `INVITED` record is automatically created for them. A registered user who follows the link receives an invitation directly, bypassing visibility restrictions. Links support optional expiry (`expires_at`), use cap (`max_uses`), and organizer revocation (`revoked_at`).
- The trip creator must declare `is_traveling_participant` at creation time.
- **`participant_capacity` is required** (not nullable). Must be ≥ 1. May be updated while the trip is `DRAFT` or `OPEN`; cannot be reduced below the current confirmed participant count.
- **Group visibility is required at creation** (`PUBLIC` or `PRIVATE`) — no default is applied.
- **Departure & return locations** — Every trip has `departure_country` (char 2) and `departure_city` (text), both required. `return_country` and `return_city` are nullable; null means the group returns to the departure location (round trip).
- **Trip route** — The trip route for LP distance calculation is: `departure_location → trip_destinations (ordered by position) → return_location`. `return_location` falls back to `departure_location` when null. Distance is the sum of great-circle distances between consecutive points.
- **Destinations** (`trip_destinations`) — At least one required. Each record has `position` (integer, 1-based), `country_code` (char 2), `city` (text), and optional `label`. Countries visited for gamification are derived from `trip_destinations` + return location.
- **Itinerary notes** — `itinerary_notes` is a nullable `text` column on the `trips` table. Free text only. The full structured itinerary builder is post-MVP.
- **Budget items** (`trip_budget_items`) — Simple named list: `name`, `description` (nullable), `amount` (numeric), `currency` (char 3, defaults to `base_currency`). Not linked to expense splits. Post-MVP the full expense module replaces this.
- **Notes** (`trip_notes`) — Collaborative list: `content` (text), `created_by`, timestamps. Any confirmed participant or organizer may add notes.
- **Key dates** (`trip_key_dates`) — List of important dates: `date`, `description` (text), `reminder_enabled` (boolean, default false). When `reminder_enabled = true`, a FCM push notification is sent to all confirmed participants 24 hours before the date.

### Participants & Groups

- Two entry paths: **join request** (user-initiated, requires the user to be able to see the trip) and **invitation** (organizer-initiated, always available). Both may coexist.
- Only one active request **or** invitation per user per trip/group at a time.
- **Requests and invitations can be cancelled at any time by their creator**: a user may withdraw their `PENDING_REQUEST`; an organizer may revoke an `INVITED` invitation. The record is deleted (no terminal status set) and the slot is freed immediately.
- **Waitlist** is not a separate entity. It is a view of `PENDING_REQUEST` records ordered by `initiated_at`. When `WAITLIST_MODE` confirmation rule is active and capacity is full, the organizer must accept requests in chronological order — they may reject any request at any time but may not skip one to accept a later one.
- Last organizer (trip) or last admin (group) cannot leave without transferring the role first.
- **Organizer role vs. participation are independent**: both `ORGANIZER` and `CO_ORGANIZER` may or may not travel on the trip, controlled by `is_traveling_participant` (boolean). Non-traveling organizers are excluded from capacity, expense splits, and the per-person budget estimate. Multiple users may hold `ORGANIZER` simultaneously.
- **Co-organizer permissions are granular**: when assigning `CO_ORGANIZER`, the assigning organizer defines an explicit `CoOrganizerPermission[]` set: `MANAGE_ITINERARY`, `MANAGE_EXPENSES`, `MANAGE_PARTICIPANTS`, `MANAGE_RESERVATIONS`, `EDIT_TRIP_DETAILS`, `MANAGE_PRE_TRIP_TASKS`, `MODERATE_CHANNEL`, `VIEW_TRAVEL_PROFILES`, `AWARD_RECOGNITIONS`. Full organizers always have all permissions implicitly.
- **Role promotion requires a role invitation** (`trip_role_invitations`): if the invitee is already a confirmed participant, the invitation only upgrades their role (`is_traveling_participant` stays `true`); if not yet a participant, the organizer declares `will_travel`. A role invitation with `will_travel = true` bypasses `WAITLIST_MODE`. Role invitations follow the same create/revoke-at-will lifecycle as participant invitations. If the invitee has an active participant request or invitation, it is deleted when the role invitation is created.
- **Role downgrade is a direct organizer action** (no invitation): never affects `is_traveling_participant`.

### Announcements

- Organizers can send a one-way broadcast announcement to all confirmed participants of a trip. Group admins can send a one-way broadcast announcement to all group members.
- Announcements are delivered as push notifications (FCM). There is no reply mechanism and no persistent chat thread.
- Announcements are stored in PostgreSQL (`trip_announcements` / `group_announcements`) and displayed in a read-only feed within the trip or group detail screen.
- **MVP scope**: announcements are included in the MVP as the primary communication mechanism between organizers and participants.

### Messaging (Slack-like) — Post-MVP

- DMs (1:1) and Channels (named, PUBLIC or PRIVATE).
- Every trip and group auto-creates a PRIVATE channel mirroring its membership and roles.
- PUBLIC channels: anyone can enter as VIEWER (read-only, no approval) or join as MEMBER (can post, no approval).
- All members see full message history regardless of when they joined.
- Channel membership in Firestore is always derived from PostgreSQL — never managed independently.
- **Firestore is not used until messaging is implemented.** The MVP does not require Firestore; FCM is the only Firebase service active in MVP.

### Itinerary (Post-MVP)

- The full structured itinerary builder is **post-MVP**. MVP uses `itinerary_notes` (free text) instead.
- Five item categories: `TRANSPORT`, `AIRPORT`, `PLACE`, `FOOD`, `OTHER` — each with detailed subtype enums.
- Day 0 is the pre-departure day for logistical items before the official trip start.
- Items have `duration_minutes`, `participant_ids` (subset scoping), multi-currency fields with `exchange_rate_snapshot`.
- Discovery Map in MVP is derived from `trip_destinations` (country + city) of completed trips, not from `PLACE` itinerary items (which are post-MVP).

### Expenses

- **No real money is processed.** The expense module is a collaborative ledger. Settlement is computed at trip end (Splitwise-style minimal debt graph) and participants settle outside the app.
- Two layers: **planned costs** (`trip_budget_items` — required or optional, defined by organizer) and **actual expenses** (`expenses` — the live ledger). Planned and actual can be linked.
- Expense ownership: `SHARED` (split among participants, generates debt) or `INDIVIDUAL` (personal spend, no debt, recorded in the group ledger for reference and aggregate totals).
- Optional budget items: each participant opts in; organizer marks as paid. `SHARED` optional items have a max group size — the participant who opts in declares who they share with.
- Split types: `EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`. The expense **creator** controls payers, split type, and distribution. Organizers (and co-organizers with `MANAGE_EXPENSES`) can edit any expense.
- Multiple payers per expense are supported (`expense_payers` table). Sum of payer amounts must equal the total.
- `exchange_rate_snapshot` is immutable — snapshotted at time of recording, never overwritten.
- Splits and settlement only include participants with `did_travel = true`. Confirmed participants who did not travel (`did_travel = false`) are excluded from expense splits.

### Gamification

- **Traveler Score** — composite metric computed from completed trips, countries visited, km traveled, achievements, and feedback received. Used for global ranking. Never editable.
- **Achievements** — auto-triggered badges at defined milestones (trips, geography, distance, social). Earned once, never lost.
- **Chamuco Points** — soft in-app currency. Earned at trip completion and achievement unlocks. Spent on cosmetic profile customizations. No real monetary value; non-transferable; non-expiring.
- **Discovery Map** — personal geographic visualization of visited places. In MVP, derived from `trip_destinations` (country + city) of completed trips. Post-MVP: enriched from `PLACE` itinerary items. Displayed on the public profile.
- **Group Member Tier** — per-group progression: `NEWCOMER` → `NOVICE` (1 trip) → `EXPLORER` (5 trips) → `VETERAN` (10+ trips). Independent of global reputation and of `GroupRole`.
- **Recognitions** — peer-awarded badges. Sources: trip organizer at completion, group admin annually, event organizer at event completion.
- **Trip Feedback** — structured post-trip feedback (scored + optional comment) directed at organizers, plus optional peer-to-peer notes. Window: 7 days after `COMPLETED`.
- **Trip Completion Flow** — when a trip reaches `COMPLETED`: stats updated, achievements evaluated, points distributed, feedback window opened, recognition window unlocked for organizers.

### Events

- Three modes: `FREE` (standalone), `GROUP` (linked to a group), `TRIP` (linked to a trip).
- Five categories: `PRESENTATION`, `PLANNING`, `CELEBRATION`, `AWARDS`, `OTHER`.
- Optional gamification: events may award Chamuco Points and/or unlock a recognition window for the organizer.
- RSVP states: `CONFIRMED`, `TENTATIVE`, `DECLINED`. Attendance is always opt-in.

---

## Documentation Structure

All design documentation lives in `documentation/`. Key files:

| File                                   | Contents                                                                                                                                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overview/tech-stack.md`               | Full stack decisions with rationale                                                                                                                                                                                                            |
| `overview/project-overview.md`         | Vision, goals, principles                                                                                                                                                                                                                      |
| `overview/mvp.md`                      | MVP scope: confirmed modules, simplified trips, out-of-scope features                                                                                                                                                                          |
| `architecture/backend-architecture.md` | NestJS modules, API design, OpenAPI/Swagger                                                                                                                                                                                                    |
| `architecture/database-design.md`      | Schema philosophy, JSONB usage                                                                                                                                                                                                                 |
| `architecture/monorepo-structure.md`   | Directory layout                                                                                                                                                                                                                               |
| `features/users.md`                    | User account, personal profile, passports, emergency contacts, health profile, loyalty programs, traveler stats, achievements                                                                                                                  |
| `features/agencies.md`                 | Travel agencies: coordinators, agency trips, public profile                                                                                                                                                                                    |
| `features/trips.md`                    | MVP trip entity: lifecycle, roles, visibility, departure/return locations, destinations, itinerary notes, budget items, notes, key dates, completion flow. Post-MVP: full itinerary builder, expense tracking, budget estimate, trip resources |
| `features/participants.md`             | Membership flows, states, waitlist mechanics, guest participants                                                                                                                                                                               |
| `features/community.md`                | Groups, Slack-like messaging, Firestore architecture, group member tiers                                                                                                                                                                       |
| `features/expenses.md`                 | Expense model, splits, settlements, multi-currency                                                                                                                                                                                             |
| `features/reservations.md`             | Booking records, metadata by type                                                                                                                                                                                                              |
| `features/pre-trip-planning.md`        | Pre-trip tasks, route planning, budget envelopes                                                                                                                                                                                               |
| `features/gamification.md`             | Traveler Score, achievements, Chamuco Points, discovery map, recognitions, feedback                                                                                                                                                            |
| `features/events.md`                   | Events system: modes, categories, RSVP, waitlist, gamification integration                                                                                                                                                                     |
| `features/calendar.md`                 | Calendar views: monthly grid + upcoming list, aggregating trips and events                                                                                                                                                                     |
| `infrastructure/auth.md`               | Firebase Authentication integration                                                                                                                                                                                                            |
| `infrastructure/cloud.md`              | GCP services, CI/CD pipelines                                                                                                                                                                                                                  |
| `design/localization.md`               | i18n spec, key naming, enforcement                                                                                                                                                                                                             |

---

## Standing Rules for AI Assistants

These rules apply to every session, regardless of what task is being performed.

### 1. Documentation cross-reference integrity

When any file under `documentation/` is modified, before closing the task:

- Scan all other documentation files for references to the modified file (by name or by the concepts it owns).
- If any reference is stale, incorrect, or inconsistent with the change just made, update it in the same session.
- This includes `CLAUDE.md` itself — if a decision or rule changes, update the relevant section here too.

### 2. No relative imports — always use path aliases

When writing or modifying any TypeScript file, **never use relative imports that navigate upward** (`../`). Always use the appropriate alias:

- `@/*` for imports within the same app (`apps/api` or `apps/web`).
- `@chamuco/shared-types` and `@chamuco/shared-utils` for cross-package imports.

```ts
// ✅ Correct
import { UsersService } from "@/modules/users/users.service";
import type { ITrip } from "@chamuco/shared-types";

// ❌ Wrong
import { UsersService } from "../../users/users.service";
```

See `documentation/architecture/monorepo-structure.md` — "Import Aliases" section for the full spec.

### 3. OpenAPI documentation on every backend change

Every NestJS controller endpoint must be fully documented with `@nestjs/swagger` decorators. When any of the following are modified:

- A controller method (new endpoint, changed path, changed HTTP method)
- A request DTO or response DTO
- An enum used in a request or response

Then verify and update:

- `@ApiTags`, `@ApiOperation`, `@ApiResponse` on the controller
- `@ApiProperty` on all DTO fields (type, description, example, required/optional)
- `@ApiBearerAuth()` if the endpoint requires authentication

No endpoint may be left without a summary (`@ApiOperation`), at least one `@ApiResponse`, and fully annotated DTO fields.

### 4. Pre-commit quality gates are non-negotiable

Every commit must pass all four gates enforced by the Husky pre-commit hook:

1. **Format** — `prettier --write` on staged files. If a file is touched, it must be correctly formatted.
2. **Lint** — `eslint --fix` on staged files. Auto-fixable violations are fixed automatically; non-auto-fixable violations block the commit.
3. **Unit tests** — `turbo run test --filter=[HEAD^1]` runs unit tests for all packages affected by the commit.
4. **Coverage** — 90% threshold on lines, statements, functions, and branches for affected packages. A commit that drops any metric below 90% is rejected.

When writing new code:

- Every new function, service method, or component must have corresponding unit tests.
- New tests must be added in the same commit as the code they cover — never defer test writing to a later commit.
- Coverage thresholds are configured in `apps/api/jest.config.ts` (backend) and `apps/web/vitest.config.ts` (frontend).

### 5. Migration file on every schema change

When any Drizzle schema file (`*.schema.ts`) is modified — new table, new column, renamed column, dropped column, new index, constraint change — a migration file must be generated:

```bash
pnpm --filter db drizzle-kit generate
```

The generated `.sql` file must be committed alongside the schema change in the same PR. No schema change may be merged without its corresponding migration file. Destructive operations (column drops, renames) require a multi-step migration strategy — document the steps in the PR description.

---

## Open Decisions (Still Pending)

All major technical and architectural decisions have been resolved. No open items remain at this time.

---

## Project Tracking

Work is tracked in a **GitHub Projects v2** kanban board:

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| URL            | https://github.com/users/manuelnt11/projects/4 |
| Project number | 4                                              |
| Owner          | `manuelnt11`                                   |

### Fields

| Field    | Type          | Options                                                             |
| -------- | ------------- | ------------------------------------------------------------------- |
| Status   | Single select | Backlog, In Progress, In Review, Done                               |
| Area     | Single select | Backend, Frontend, Infrastructure, Database, Documentation, Testing |
| Priority | Single select | High, Medium, Low                                                   |
| Size     | Single select | XS, S, M, L, XL                                                     |

### Epics

Epics are represented as **GitHub Issues with sub-issues**. GitHub's native parent-child issue relationship is used — no custom field or label is required.

**Conventions:**

- An epic is a regular issue with the label `epic` and a title that names the feature or initiative (e.g., `Epic: Trip entity — MVP`).
- Child issues (tasks) are linked to the epic using GitHub's **Add sub-issue** button on the parent issue page.
- Every sub-issue should also be added to the project board and assigned the appropriate Status, Area, Priority, and Size fields.
- An epic is considered done when all its sub-issues are in `Done` status. The epic issue itself is closed at that point.
- Epics are not assigned a Size field — sizing applies to individual sub-issues only.

**CLI reference (epics):**

```bash
# Create an epic issue in the repo
gh issue create --title "Epic: <name>" --label "epic" --body "<description>"

# List open epics
gh issue list --label epic

# Add a sub-issue (requires the sub-issue feature; use the GitHub UI or API)
gh api graphql -f query='
  mutation {
    addSubIssue(input: { issueId: "<parent_node_id>", subIssueId: "<child_node_id>" }) {
      issue { title }
    }
  }
'
```

### CLI reference

```bash
# List all items
gh project item-list 4 --owner manuelnt11

# Create a new item (draft issue)
gh project item-create 4 --owner manuelnt11 --title "Title here"

# View project fields
gh project field-list 4 --owner manuelnt11
```
