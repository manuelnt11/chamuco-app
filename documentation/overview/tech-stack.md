# Chamuco App — Technology Stack

**Status:** Defined (subject to review)
**Last Updated:** 2026-03-15

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
| ORM | Drizzle ORM | See rationale below |
| Migrations | drizzle-kit | Generates auditable `.sql` migration files versioned in Git |

### Drizzle ORM

Drizzle is a TypeScript-first ORM where the schema is defined in TypeScript itself — there is no separate DSL or schema language to maintain. This means the entity definitions are regular TypeScript files that live inside each NestJS module alongside the rest of the domain code.

Migration workflow via `drizzle-kit`:

1. Developer modifies the schema TypeScript file.
2. `drizzle-kit generate` computes the diff and produces a plain `.sql` migration file.
3. The `.sql` file is committed to Git alongside the schema change — it is human-readable and auditable in pull request reviews.
4. `drizzle-kit migrate` applies pending migrations in order against the target database.

**Why not the alternatives:**
- **TypeORM** — deepest NestJS integration but a history of unreliable migrations and inconsistent maintenance; not recommended for a schema that will evolve heavily.
- **Prisma** — solid migration tooling and familiar, but requires maintaining a separate `.prisma` schema file (a third language in the project) and generates an opaque client that makes complex SQL awkward.
- **MikroORM** — technically strong and has a reliable migration story, but smaller ecosystem and fewer resources for the team to draw on.

Drizzle is injected into NestJS as a standard provider — there is no official NestJS module, but the integration is straightforward via a custom `DrizzleModule` that exposes the database connection.

---

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
| Framework | Next.js (React) | SSR/SSG out of the box, fits naturally in a Node.js monorepo, large ecosystem, strong Tailwind and i18next integration |
| Styling | Tailwind CSS | Utility-first, highly composable, consistent design system without writing custom CSS |
| i18n | `i18next` + `react-i18next` | Industry standard, supports nested JSON locale files, interpolation, pluralization, and lazy loading of language bundles |
| i18n enforcement | `eslint-plugin-i18next` | Lint rule `i18next/no-literal-string` prevents any raw string literal from being rendered in a component |

### No-Hardcoded-Text Rule

**No user-facing string may be hardcoded in a component, template, or page.** All visible text must reference a locale file key via the `i18next` `t()` function. This rule is enforced at the linter level and is a hard requirement — not a guideline. See [`design/localization.md`](../design/localization.md) for the full specification, key naming convention, locale file structure, and enforcement details.

---

## Database

| Concern | Technology | Rationale |
|---|---|---|
| Primary DB | PostgreSQL | Mature relational database with strong JSON support |
| JSON Support | JSONB columns | Used for sub-entities within a domain to avoid over-atomization of the schema |
| Schema definition | Drizzle ORM schema files (TypeScript) | One source of truth — the TypeScript schema and the actual DB stay in sync via generated migrations |
| Schema versioning | `drizzle-kit` (`.sql` migration files) | Produces explicit, auditable SQL files committed to Git. Applied in order; no destructive auto-sync. |

### Migration Philosophy

Schema evolution is **migration-based**, not schema-push. This means:

- The current schema state is the cumulative result of all applied migrations, in order.
- No migration is ever edited after it is committed — only new migrations are added.
- Each migration file has a timestamp-based name and lives in `packages/db/migrations/`.
- Migrations are reviewed as part of every pull request that changes the schema — the `.sql` diff must be explicit, correct, and safe before merging.
- Destructive operations (column drops, table renames) require a multi-step migration strategy to avoid data loss in production (e.g., add new column → backfill → drop old column across separate deployments).

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
