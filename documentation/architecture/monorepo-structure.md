# Chamuco App — Monorepo Structure

**Status:** Active
**Last Updated:** 2026-06-11

---

## Overview

The entire Chamuco App project lives in a single Git repository. The monorepo approach is chosen to:

- Share TypeScript types and domain interfaces across packages (e.g., between API and frontend).
- Apply consistent tooling (ESLint, Prettier, Husky) across all packages from a single config.
- Simplify deployment pipelines by having all code in one place.
- Avoid the overhead of managing multiple repositories in the early stages.

---

## Directory Layout

```
chamuco-app/
│
├── apps/
│   ├── api/                        # NestJS backend application
│   │   ├── src/
│   │   │   ├── modules/            # Feature modules — one folder per domain
│   │   │   ├── common/             # Guards, interceptors, decorators, pipes, transforms, utils
│   │   │   ├── config/             # Environment config and validation (class-validator)
│   │   │   ├── database/           # Drizzle connection provider, schema barrel, migrations/
│   │   │   ├── i18n/               # nestjs-i18n locale files (en/, es/)
│   │   │   └── main.ts
│   │   ├── jest.config.ts
│   │   ├── tsconfig.json           # Extends tsconfig.base.json; defines @/* alias
│   │   └── package.json
│   │
│   └── web/                        # Next.js frontend application (App Router)
│       ├── src/
│       │   ├── app/                # Next.js App Router — layouts, pages, loading, error
│       │   ├── components/         # Reusable UI components
│       │   ├── config/             # Frontend config constants
│       │   ├── hooks/              # Custom React hooks
│       │   ├── lib/                # External library wrappers (firebase/, hooks/, i18n/, navigation/)
│       │   ├── services/           # API client functions (fetchers, mutations)
│       │   ├── store/              # Zustand stores and React contexts
│       │   ├── types/              # App-local TypeScript types (not shared across apps)
│       │   └── locales/            # i18n locale files — split by namespace
│       │       ├── es/
│       │       │   ├── auth.json
│       │       │   ├── common.json
│       │       │   ├── errors.json
│       │       │   ├── explore.json
│       │       │   ├── feedback.json
│       │       │   ├── groups.json
│       │       │   ├── legal.json
│       │       │   ├── profile.json
│       │       │   └── trips.json
│       │       └── en/             # mirrors es/ structure
│       ├── public/
│       │   ├── custom-sw.js        # Unified Service Worker (FCM + next-pwa caching)
│       │   └── icons/
│       ├── e2e/                    # Playwright end-to-end tests
│       ├── vitest.config.ts
│       ├── next.config.ts          # withPWA() wrapper
│       ├── tsconfig.json           # Extends tsconfig.base.json; defines @/* alias
│       └── package.json
│
├── packages/
│   ├── shared-types/               # Shared TypeScript interfaces, enums, and DTOs
│   │   ├── src/
│   │   │   ├── data/               # Static data (asset.ts, loyalty-programs.data.ts)
│   │   │   ├── enums/              # All shared enums (one file per domain)
│   │   │   ├── types/              # Shared type definitions (membership-status.ts, etc.)
│   │   │   └── index.ts            # Barrel export
│   │   ├── tsconfig.json
│   │   └── package.json            # name: "@chamuco/shared-types"
│   │
│   └── shared-utils/               # Shared pure utility functions
│       ├── src/
│       │   ├── emoji-utils.ts      # Emoji helpers
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json            # name: "@chamuco/shared-utils"
│
├── documentation/                  # All design and planning documentation
│   ├── overview/
│   ├── architecture/
│   ├── features/
│   ├── design/
│   ├── infrastructure/
│   └── analysis/
│
├── infrastructure/
│   └── gcp/                        # GCP infrastructure scripts and configs
│
├── scripts/
│   └── db/                         # Database management scripts (backup, restore, seed)
│
├── .github/                        # GitHub Actions workflows (CI/CD)
│   └── workflows/
│       ├── api.yml
│       └── web.yml
│
├── .husky/                         # Husky git hooks
│   └── pre-commit                  # Runs lint-staged then turbo test with coverage
├── turbo.json                      # Turborepo pipeline configuration
├── package.json                    # Root package.json (pnpm workspaces)
├── pnpm-workspace.yaml             # pnpm workspace declaration + shared devDependency catalog
├── tsconfig.base.json              # Base TypeScript config extended by all packages
├── .prettierrc                     # Prettier config (indentation, quotes, trailing commas)
└── README.md
```

---

## Package Manager & Workspace Tool

The monorepo uses **pnpm workspaces** as the package manager and **Turborepo** as the build orchestration layer.

**pnpm** was chosen over npm and yarn for:

- Significantly faster installs via content-addressable storage (packages are never duplicated on disk).
- Strict dependency isolation — a package can only import what is declared in its own `package.json`, preventing accidental cross-package leakage.
- Native workspace support with `pnpm-workspace.yaml`.
- **Catalog** — pnpm's `catalog:` feature defines a single canonical version for shared `devDependencies` in `pnpm-workspace.yaml`. Each `package.json` references that version with `"catalog:"` instead of a pinned string. This eliminates version drift across packages and ensures Dependabot only needs to update `pnpm-workspace.yaml` for shared packages.

### pnpm Catalog

Shared `devDependencies` that appear in more than one package must be declared in the `catalog:` block of `pnpm-workspace.yaml`:

```yaml
catalog:
  '@types/node': ^25.9.1
  '@typescript-eslint/eslint-plugin': ^8.60.0
  '@typescript-eslint/parser': ^8.60.0
  '@vitest/coverage-v8': ^4.1.7
  eslint: ^10.4.0
  eslint-config-prettier: ^10.1.8
  eslint-plugin-i18next: ^6.1.4
  eslint-plugin-prettier: ^5.5.5
  prettier: ^3.8.3
  typescript: ^6.0.3
  vitest: ^4.1.7
```

Each `package.json` that uses one of these packages references it as:

```json
"devDependencies": {
  "typescript": "catalog:",
  "eslint": "catalog:"
}
```

**Rule:** When adding a new `devDependency` that already exists in another package, or when upgrading a shared tool, always add it to (or update it in) `pnpm-workspace.yaml`'s `catalog:` block — never pin a duplicate version in an individual `package.json`.

**Turborepo** sits on top of pnpm workspaces and provides:

- **Task pipelines** — defines the dependency graph between tasks across packages (e.g., `web#build` depends on `shared-types#build`).
- **Local caching** — task outputs are cached; re-running an unchanged package skips the work entirely.
- **Remote caching** — integrates with Vercel Remote Cache for sharing build artifacts across CI runs and team machines.
- **Parallel execution** — independent tasks run concurrently, reducing total CI time.

The pipeline is defined in `turbo.json` at the root. Common tasks:

```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "lint": {},
    "test": { "dependsOn": ["^build"] },
    "typecheck": {}
  }
}
```

---

## Pre-commit Hooks

The root package uses **Husky** to manage git hooks and **lint-staged** to run checks only on staged files.

The pre-commit hook (`.husky/pre-commit`) runs two steps in sequence:

1. **`lint-staged`** — for every staged file matching a relevant pattern:
   - `*.{ts,tsx}` → `prettier --write` + `eslint --fix`
   - `*.{json,md,yaml}` → `prettier --write`
2. **`turbo run test --filter=[HEAD^1] -- --coverage`** — runs unit tests with coverage enforcement only for packages that contain staged changes. Fails if any test fails or if coverage on any metric drops below **90%**.

Because `prettier --write` modifies files in place, Husky re-stages the formatted files automatically — the commit lands already clean.

Coverage thresholds are defined per package:

- `apps/api/jest.config.ts` — `coverageThreshold: { global: { lines: 90, functions: 90, branches: 90, statements: 90 } }`
- `apps/web/vitest.config.ts` — `coverage: { thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 } }`

---

## Shared Types Package

`packages/shared-types` keeps API contracts consistent between backend and frontend. Organized into three subdirectories:

- `src/enums/` — TypeScript enums only, one file per domain (`notification-type.enum.ts`, `group-role.enum.ts`, `passport-status.enum.ts`). **No type aliases or interfaces here.**
- `src/types/` — Interfaces and type aliases. Simple types have no imports; types that depend on enums import from `'../enums/x.enum'` using intra-package relative paths. Examples: `notification-item.ts` (depends on `NotificationType`), `notification-preferences.ts` (depends on `NotificationType` and `NotificationChannel`), `invitation-result.ts`, `date-of-birth.ts`.
- `src/data/` — Static reference data (`loyalty-programs.data.ts`, `asset.ts`).

The root `no-restricted-imports` ESLint rule (which blocks upward relative imports) is disabled within this package — every relative import here is by definition intra-package, so the cross-package guard does not apply.

API DTOs in `apps/api` that correspond to a shared interface must implement it (e.g., `class NotificationResponseDto implements NotificationItem`). This gives TypeScript a compile-time check that the DTO stays structurally compatible with the shared contract.

> All enum values and type names must be in English regardless of the application's display language.

---

## Import Aliases

Relative imports (e.g., `../../../components/Button`) are **prohibited**. Every import of a local module must use a path alias. This is enforced via TypeScript's `paths` compiler option and ESLint's `no-restricted-imports` rule.

### Two alias namespaces

| Alias prefix | Scope         | Resolves to                                 |
| ------------ | ------------- | ------------------------------------------- |
| `@/*`        | App-internal  | The `src/` directory of the **current app** |
| `@chamuco/*` | Cross-package | A shared package in `packages/`             |

These two namespaces are completely separate. `@/` is always local to the app being compiled; `@chamuco/` always refers to a published (workspace) package.

### `@/*` — app-internal alias

Each app defines `@/*` pointing to its own `src/` in its local `tsconfig.json`:

```jsonc
// apps/api/tsconfig.json  and  apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
    },
  },
}
```

**Usage examples:**

```ts
// ✅ Correct — alias
import { UsersService } from '@/modules/users/users.service';
import { FirebaseAuthGuard } from '@/common/guards/firebase-auth.guard';
import { Button } from '@/components/Button';
import { useTrip } from '@/hooks/useTrip';
import { apiClient } from '@/lib/api-client';

// ❌ Wrong — relative path
import { Button } from '../../../components/Button';
```

The alias is identical in both apps (`@/`) without conflict — TypeScript resolves it relative to each app's own `tsconfig.json`, so there is no cross-app leakage.

### `@chamuco/*` — shared workspace packages

Shared packages are imported by their declared package name (set in `packages/*/package.json`). pnpm workspaces resolve these via the `workspace:*` protocol; TypeScript resolves them via `paths` in `tsconfig.base.json`:

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@chamuco/shared-types": ["./packages/shared-types/src/index.ts"],
      "@chamuco/shared-utils": ["./packages/shared-utils/src/index.ts"],
    },
  },
}
```

**Usage examples:**

```ts
// ✅ Correct — workspace package alias
import type { ITrip, TripStatus } from '@chamuco/shared-types';
import { formatCurrency } from '@chamuco/shared-utils';

// ❌ Wrong — relative cross-package path
import type { ITrip } from '../../packages/shared-types/src/trip.types';
```

### Directory conventions implied by `@/*`

The alias makes directory naming load-bearing — a consistent layout ensures every developer knows where to put and find code.

**`apps/api/src/`**

| Directory   | Contents                                                                                                                                                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modules/`  | One folder per top-level domain (`users/`, `groups/`, `trips/`, etc.). Complex domains have named sub-resource subdirectories, each with its own controller + service pair (e.g., `users/profile/`, `users/travel-docs/`, `groups/members/`, `groups/invitations/`, `trips/destinations/`). DTOs live in `dto/`; Drizzle schema files in `schema/`. |
| `common/`   | Cross-cutting: guards, interceptors, decorators, filters, pipes. Nothing domain-specific.                                                                                                                                                                                                                                                           |
| `config/`   | Environment variable validation and typed config providers.                                                                                                                                                                                                                                                                                         |
| `database/` | Drizzle connection factory, schema barrel file, migration utilities.                                                                                                                                                                                                                                                                                |

**`apps/web/src/`**

| Directory     | Contents                                                                                                                                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`        | Next.js App Router — layouts, pages, `loading.tsx`, `error.tsx`, route groups.                                                                                                                                                                                                                        |
| `components/` | Reusable, presentational UI components. No data fetching logic.                                                                                                                                                                                                                                       |
| `config/`     | Frontend configuration constants (API base URL, feature flags, etc.).                                                                                                                                                                                                                                 |
| `hooks/`      | Custom React hooks at the app level. May call services or access stores.                                                                                                                                                                                                                              |
| `lib/`        | Thin wrappers around external libraries. Subdirs: `firebase/` (client SDK), `hooks/` (lower-level reusable hooks), `i18n/` (i18next setup), `navigation/` (routing helpers).                                                                                                                          |
| `services/`   | API client functions — typed wrappers around HTTP calls to the NestJS backend. Each domain has `{domain}.service.ts` + `{domain}.service.test.ts` + an optional `{domain}.types.ts` for request/payload types. API response types are imported from `@chamuco/shared-types`, never redefined locally. |
| `store/`      | Zustand stores and React contexts (auth state, preference state, etc.).                                                                                                                                                                                                                               |
| `types/`      | App-local TypeScript types that are not shared with other apps or packages.                                                                                                                                                                                                                           |
| `locales/`    | i18n locale files split by namespace. Each language has its own subdirectory (`es/`, `en/`) with one JSON file per namespace (`auth.json`, `groups.json`, `profile.json`, etc.). See `apps/web/CLAUDE.md` for namespace conventions.                                                                  |

### ESLint enforcement

The `no-restricted-imports` rule is configured at the root ESLint config to disallow patterns that escape upward through the directory tree:

```js
// eslint.config.mjs (root)
'no-restricted-imports': ['error', {
  patterns: ['../*', './**/..']
}]
```

This catches any relative import that navigates upward (`../`) at lint time, before it reaches the pre-commit hook or CI.

**Exception:** `packages/shared-types` disables this rule in its own `eslint.config.mjs`. Within that package every relative import is intra-package — there are no other packages to accidentally import from — so the cross-package guard serves no purpose there.

---

## Versioning Strategy

- The repository uses **Git** for version control.
- Branching strategy: **feature branches + PR workflow**. Work happens on short-lived feature branches; all changes merge into `main` via pull requests with at least one review.
- Commit messages follow **Conventional Commits** format (e.g., `feat:`, `fix:`, `docs:`, `chore:`), scoped to the affected package (e.g., `feat(groups):`, `fix(api):`, `chore(deps):`).
