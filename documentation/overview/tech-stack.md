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
| API documentation | `@nestjs/swagger` | OpenAPI 3.0 spec auto-generated from decorators; Swagger UI served at `/api/docs` |

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
| PWA | `@ducanh2912/next-pwa` + unified Service Worker | Installable on desktop and mobile; background push notifications via FCM; offline-capable. Single SW combines `next-pwa` caching with the FCM background message handler. See [`architecture/pwa.md`](../architecture/pwa.md). |
| Theme management | `next-themes` | SSR-safe dark / light / system theme toggling. Reads preference from `chamuco_prefs` cookie during SSR to prevent flash of incorrect theme. Works with Tailwind's `class` dark mode strategy. |
| Styling | Tailwind CSS | Utility-first, highly composable, consistent design system without writing custom CSS. Dark mode via `class` strategy — controlled by `next-themes`. |
| i18n | `i18next` + `react-i18next` | Industry standard, supports nested JSON locale files, interpolation, pluralization, and lazy loading of language bundles |
| i18n enforcement | `eslint-plugin-i18next` | Lint rule `i18next/no-literal-string` prevents any raw string literal from being rendered in a component |

### Import Aliases (No Relative Paths)

Relative imports are prohibited across the entire monorepo. All local imports use one of two alias namespaces:

- **`@/*`** — resolves to the `src/` directory of the current app (`apps/api` or `apps/web`). Defined in each app's `tsconfig.json`.
- **`@chamuco/*`** — resolves to a shared workspace package in `packages/`. Defined in `tsconfig.base.json`.

See [`architecture/monorepo-structure.md`](../architecture/monorepo-structure.md) for the full alias spec, directory conventions, and ESLint enforcement rule.

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
| Authentication | Firebase Authentication — Google Sign-In (launch) + Passkeys (planned) |
| Real-time messaging | Firestore (Firebase) — message storage and real-time delivery |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Hosting | Cloud Run (containerized, serverless, auto-scaling, scales to zero) |
| Database Hosting | Cloud SQL (PostgreSQL managed) |
| Storage | Cloud Storage (for assets, attachments) |
| CI/CD | GitHub Actions — two independent pipelines (api + web), auto-triggered on push to `main` |

See [`infrastructure/cloud.md`](../infrastructure/cloud.md) and [`infrastructure/auth.md`](../infrastructure/auth.md) for details.

---

## Monorepo

The entire project lives in a single Git repository structured as a monorepo, managed with **pnpm workspaces** and **Turborepo**.

| Concern | Technology |
|---|---|
| Package manager | pnpm — fast installs, strict dependency isolation, native workspace support |
| Build orchestration | Turborepo — task pipelines, local and remote caching, parallel execution |

See [`architecture/monorepo-structure.md`](../architecture/monorepo-structure.md) for the full directory layout and Turborepo pipeline configuration.

---

## Testing

| Scope | Tool | Rationale |
|---|---|---|
| Backend unit & integration | Jest + `@swc/jest` | `@nestjs/testing` is built around Jest — first-class NestJS support with no workarounds. `@swc/jest` replaces `ts-jest` as the transpiler, delivering 3–5× faster test runs with an identical API. |
| Frontend unit & component | Vitest + React Testing Library | ESM-native and Vite-powered — no extra config to handle Next.js App Router's ESM output. Jest-compatible API means zero retraining. Significantly faster than Jest for large component suites. |
| End-to-end | Playwright | Cross-browser (Chromium, Firefox, WebKit), parallel execution by default, first-class TypeScript, and Trace Viewer for debugging CI failures. |

### Conventions

- **Co-location:** Unit and integration test files live alongside the source files they test (e.g., `users.service.spec.ts` next to `users.service.ts`).
- **E2E separation:** Playwright tests live in `apps/web/e2e/` and run as a separate CI step after the build, not during the unit test phase.
- **Coverage threshold: 90%** — lines, statements, functions, and branches. Both Jest (`coverageThreshold`) and Vitest (`coverage.thresholds`) are configured to enforce this. A commit that drops coverage below 90% fails the pre-commit hook.
- **Mocking:** The backend uses Jest's native `jest.fn()` and module mocking. The frontend uses Vitest's compatible equivalents (`vi.fn()`, `vi.mock()`).

---

## Code Quality & Pre-commit Hooks

| Tool | Purpose |
|---|---|
| **Prettier** | Opinionated code formatter — enforces consistent indentation, quotes, trailing commas, and line length across the entire monorepo. Config lives at `.prettierrc` in the root. |
| **Husky** | Git hooks manager. Installs and manages the pre-commit hook. |
| **lint-staged** | Runs linters and formatters only on Git-staged files — keeps the pre-commit hook fast even as the codebase grows. |

### Pre-commit Hook

Every commit must pass the following gates before it is accepted:

```
1. lint-staged
   ├── prettier --write         Fix indentation and formatting on staged files
   └── eslint --fix             Auto-fix lint violations; fail if unfixable issues remain

2. turbo run test --filter=[HEAD^1] -- --coverage
   └── Runs unit tests only for packages affected by staged changes.
       Fails if any test fails or if coverage drops below 90% (lines / statements / functions / branches).
```

**Why `--filter=[HEAD^1]`:** Running the entire test suite on every commit would be prohibitively slow in a monorepo. Turborepo's `--filter=[HEAD^1]` limits test execution to packages that have changes in the current commit. This keeps the hook fast while still enforcing quality at the point of change.

**Auto-fix on format:** `prettier --write` and `eslint --fix` modify staged files in place. Husky re-stages the fixed files before the commit is finalized — the developer sees their code committed already formatted, with no manual intervention required.

**Coverage configuration:**
- Backend (`apps/api/jest.config.ts`): `coverageThreshold: { global: { lines: 90, functions: 90, branches: 90, statements: 90 } }`
- Frontend (`apps/web/vitest.config.ts`): `coverage: { thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 } }`

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
