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

- [`trips.md`](./features/trips.md) — The central entity. Trip lifecycle, composition (movements, stays, activities), roles, visibility.
- [`participants.md`](./features/participants.md) — Invitation system, attendance confirmation rules, participant states.
- [`pre-trip-planning.md`](./features/pre-trip-planning.md) — Pre-trip phase: route alternatives, task checklist with per-participant tracking & deadlines, destination budgets, exchange rates.
- [`expenses.md`](./features/expenses.md) — Expense recording, split strategies, multi-currency handling, settlement.
- [`reservations.md`](./features/reservations.md) — Booking status tracking for stays and transport.
- [`community.md`](./features/community.md) — User profiles, groups, chats, broadcast channels, roles and permissions.
- [`trip-planning-insights.md`](./features/trip-planning-insights.md) — Real-world analysis from Egypt Tour.xlsx (simplified workbook).
- [`trip-planning-insights-v2.md`](./features/trip-planning-insights-v2.md) — Real-world analysis from History Tour 2023.xlsx (full 8-sheet workbook). Primary reference.

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
| Authentication | Google SSO (+ Passkeys planned) |
| Styling | Tailwind CSS |
| Repository | Monorepo (single Git repo) |
| Default language | Spanish |
| Default currency | COP |
| Code language | English (all code, docs, enums, variables) |

## Decisions Pending

| Decision | Options / Notes |
|---|---|
| Frontend framework | Next.js (recommended), Nuxt.js, or React SPA |
| ORM | TypeORM vs. Prisma (Prisma recommended) |
| Monorepo tooling | pnpm workspaces + Turborepo (recommended) |
| Auth implementation | Custom JWT vs. GCP Identity Platform |
| Real-time messaging | WebSockets (Socket.io) vs. SSE |
| Exchange rate API | Open Exchange Rates, Fixer.io, or organizer-set manual rate |
| CI/CD tooling | GitHub Actions vs. Cloud Build |
