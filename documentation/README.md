# Chamuco App — Documentation Index

This folder contains all design, architecture, and planning documentation for the Chamuco App project. The project is currently in the **design phase** — no source code has been written yet.

> All documentation is written in English. Source code, variable names, and enums will also be exclusively in English.

---

## Structure

### `/overview`
High-level project context and technology decisions.

- [`project-overview.md`](./overview/project-overview.md) — Vision, goals, target audience, and core principles.
- [`tech-stack.md`](./overview/tech-stack.md) — All technology choices and rationale (Node.js, NestJS, PostgreSQL, Tailwind, GCP).

### `/architecture`
Technical structure and design decisions for the system.

- [`monorepo-structure.md`](./architecture/monorepo-structure.md) — Directory layout, package manager, shared packages, versioning.
- [`backend-architecture.md`](./architecture/backend-architecture.md) — NestJS modules, domain boundaries, API design, cross-cutting concerns.
- [`database-design.md`](./architecture/database-design.md) — PostgreSQL schema philosophy, relational vs. JSONB approach, entity overview.

### `/features`
Feature definitions, domain models, and open design questions per feature area.

- [`users.md`](./features/users.md) — User account, personal profile (identity, documents, emergency contact), loyalty programs, dietary preferences, allergies, phobias, and physical limitations.
- [`trips.md`](./features/trips.md) — The central entity. Trip lifecycle, time boundaries, itinerary model, full item category/subtype taxonomy, IN_PROGRESS change policy.
- [`participants.md`](./features/participants.md) — Invitation system, confirmation rules, participant states, guest participants. Travel data is owned by the user profile.
- [`pre-trip-planning.md`](./features/pre-trip-planning.md) — Pre-trip phase: route alternatives, task checklist with per-participant tracking & deadlines, destination budgets, exchange rates.
- [`expenses.md`](./features/expenses.md) — Expense recording, participant scope, split strategies, advance payments, multi-currency handling, settlement.
- [`reservations.md`](./features/reservations.md) — Booking status tracking, per-participant reservation records, metadata by transport/stay type.
- [`community.md`](./features/community.md) — Groups, Slack-like messaging (DMs + channels), auto-channels per trip/group, roles and permissions.

### `/analysis`
Extraction and analysis documents derived from real-world trip planning samples. These inform the feature design documents but are not design specs themselves.

- [`analysis-egypt-tour-sample.md`](./analysis/analysis-egypt-tour-sample.md) — Analysis of `Egypt Tour.xlsx` (simplified single-sheet workbook).
- [`analysis-history-tour-sample.md`](./analysis/analysis-history-tour-sample.md) — Analysis of `2023.09 - History tour.xlsx` (full 8-sheet workbook). Primary reference.

### `/samples`
Source files used as real-world planning examples.

- `Egypt Tour.xlsx` — Simplified itinerary spreadsheet.
- `2023.09 - History tour.xlsx` — Complete planning workbook (itinerary, travelers, categories, pre-trip tasks, budget, route options).

### `/design`
UX, UI, and product design guidelines.

- [`localization.md`](./design/localization.md) — Multi-language (ES/EN), multi-currency (COP/USD), timezone handling.

### `/infrastructure`
Cloud deployment, authentication, and DevOps.

- [`cloud.md`](./infrastructure/cloud.md) — GCP services, deployment architecture, environments, CI/CD, secrets management.
- [`auth.md`](./infrastructure/auth.md) — Google SSO, Passkeys, JWT strategy, RBAC authorization.

---

## Key Decisions Already Made

| Decision | Choice |
|---|---|
| Runtime | Node.js |
| Backend framework | NestJS |
| Database | PostgreSQL with JSONB |
| Cloud | GCP |
| Authentication | Firebase Authentication (Google Sign-In + Passkeys) |
| Styling | Tailwind CSS |
| Repository | Monorepo (single Git repo) |
| Default language | Spanish |
| Default currency | COP |
| Code language | English (all code, docs, enums, variables) |

## Decisions Pending

| Decision | Options / Notes |
|---|---|
| Monorepo tooling | pnpm workspaces + Turborepo (recommended) |
| Auth implementation | ~~Custom JWT vs. GCP Identity Platform~~ → **Firebase Authentication** ✓ |
| Real-time messaging | ~~WebSockets (Socket.io) vs. SSE~~ → **Firestore** ✓ |
| Exchange rate API | Open Exchange Rates, Fixer.io, or organizer-set manual rate |
| CI/CD tooling | ~~GitHub Actions vs. Cloud Build~~ → **GitHub Actions** ✓ |

## Decided Since Initial Draft

| Decision | Choice |
|---|---|
| Frontend framework | Next.js (React) |
| ORM | Drizzle ORM |
| Migrations | drizzle-kit — explicit `.sql` files versioned in Git |
| Frontend i18n library | `i18next` + `react-i18next` |
| Backend i18n library | `nestjs-i18n` |
| Hardcoded string policy | **Zero tolerance** — enforced via `eslint-plugin-i18next` |
