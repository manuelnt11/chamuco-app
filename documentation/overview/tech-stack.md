# Chamuco App — Technology Stack

**Status:** Defined (subject to review)
**Last Updated:** 2026-03-14

---

## Summary

Chamuco App uses a modern, Node.js-first stack optimized for modular backend development, maintainable frontend styling, and cloud-native deployment on Google Cloud Platform.

---

## Programming Language

**Node.js** is the runtime for all backend and tooling code. TypeScript is the expected language for both backend and frontend to ensure type safety across the monorepo.

---

## Backend

| Concern | Technology | Rationale |
|---|---|---|
| Runtime | Node.js | Defined project requirement |
| Framework | NestJS | Modular architecture, decorator-driven, built-in DI container, strong TypeScript support, aligns with domain-driven modular design goals |
| API Style | REST (primary) | Standard, well-understood; GraphQL can be evaluated later if query flexibility becomes a need |
| Validation | class-validator + class-transformer | Native to NestJS ecosystem |
| ORM | TypeORM or Prisma | To be decided — both support PostgreSQL and JSON columns well |

### NestJS Module Philosophy

The backend is organized around **well-defined domain modules**. Each module owns its own:
- Entities / models
- Services (business logic)
- Repositories (data access)
- Controllers (API surface)
- DTOs (request/response contracts)

Modules should not reach into each other's internals. Cross-module communication happens through exported services or internal events.

---

## Frontend

| Concern | Technology | Rationale |
|---|---|---|
| Styling | Tailwind CSS | Utility-first, highly composable, consistent design system without writing custom CSS |
| Framework | TBD (Next.js recommended) | Next.js fits well in a Node.js monorepo, provides SSR/SSG, and has a strong Tailwind ecosystem |
| i18n | `i18next` + `react-i18next` | Industry standard, supports nested JSON locale files, interpolation, pluralization, and lazy loading of language bundles |
| i18n enforcement | `eslint-plugin-i18next` | Lint rule `i18next/no-literal-string` prevents any raw string literal from being rendered in a component |

> **Note:** Frontend framework is not yet finalized. Options to evaluate: Next.js, Nuxt.js, or a separate React SPA. This decision should be made before starting implementation.

### No-Hardcoded-Text Rule

**No user-facing string may be hardcoded in a component, template, or page.** All visible text must reference a locale file key via the `i18next` `t()` function. This rule is enforced at the linter level and is a hard requirement — not a guideline. See [`design/localization.md`](../design/localization.md) for the full specification, key naming convention, locale file structure, and enforcement details.

---

## Database

| Concern | Technology | Rationale |
|---|---|---|
| Primary DB | PostgreSQL | Mature relational database with strong JSON support |
| JSON Support | JSONB columns | Used for sub-entities within a domain to avoid over-atomization of the schema |

### Design Philosophy

The database design balances relational integrity with document flexibility:

- Core entities with strong relational requirements (trips, users, participants) are modeled as proper relational tables with foreign keys and indexes.
- Sub-entities that belong exclusively to a parent domain and don't require independent querying are stored as JSONB objects within the parent entity's record (e.g., a list of activity checkpoints within an activity).
- This avoids the overhead of deeply normalized schemas while maintaining data integrity where it matters.

---

## Infrastructure & Cloud

| Concern | Technology |
|---|---|
| Cloud Provider | Google Cloud Platform (GCP) |
| Authentication | Google SSO (primary), Passkeys (planned) |
| Hosting | TBD — likely Cloud Run (containerized, serverless-friendly) |
| Database Hosting | Cloud SQL (PostgreSQL managed) |
| Storage | Cloud Storage (for assets, attachments) |
| CI/CD | TBD — Cloud Build or GitHub Actions |

See [`infrastructure/cloud.md`](../infrastructure/cloud.md) and [`infrastructure/auth.md`](../infrastructure/auth.md) for details.

---

## Monorepo

The entire project lives in a single Git repository structured as a monorepo. This simplifies:

- Shared TypeScript types between frontend and backend.
- Unified versioning and dependency management.
- Consistent tooling (linting, formatting, testing) across packages.

See [`architecture/monorepo-structure.md`](../architecture/monorepo-structure.md) for the proposed directory layout.

---

## Localization & Internationalization

| Concern | Technology / Approach |
|---|---|
| Language support | Spanish (default), English |
| Currency support | COP (default), USD |
| Frontend i18n library | `i18next` + `react-i18next` |
| Backend i18n library | `nestjs-i18n` |
| Enforcement | `eslint-plugin-i18next` — blocks hardcoded strings at lint time |

See [`design/localization.md`](../design/localization.md) for details.
