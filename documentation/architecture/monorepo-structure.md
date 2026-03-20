# Chamuco App — Monorepo Structure

**Status:** Defined
**Last Updated:** 2026-03-19

---

## Overview

The entire Chamuco App project lives in a single Git repository. The monorepo approach is chosen to:

- Share TypeScript types and domain interfaces across packages (e.g., between API and frontend).
- Apply consistent tooling (ESLint, Prettier, Husky) across all packages from a single config.
- Simplify deployment pipelines by having all code in one place.
- Avoid the overhead of managing multiple repositories in the early stages.

---

## Proposed Directory Layout

```
chamuco-app/
│
├── apps/
│   ├── api/                        # NestJS backend application
│   │   ├── src/
│   │   │   ├── modules/            # Feature modules — one folder per domain (users, trips, etc.)
│   │   │   ├── common/             # Guards, interceptors, decorators, pipes, filters
│   │   │   ├── config/             # Environment config and validation (class-validator)
│   │   │   ├── database/           # Drizzle connection provider and schema barrel
│   │   │   └── main.ts
│   │   ├── test/                   # Integration test helpers and fixtures
│   │   ├── jest.config.ts
│   │   ├── tsconfig.json           # Extends tsconfig.base.json; defines @/* alias
│   │   └── package.json
│   │
│   └── web/                        # Next.js frontend application (App Router)
│       ├── src/
│       │   ├── app/                # Next.js App Router — layouts, pages, loading, error
│       │   ├── components/         # Reusable UI components
│       │   ├── hooks/              # Custom React hooks
│       │   ├── lib/                # External library wrappers and low-level utilities
│       │   ├── services/           # API client functions (fetchers, mutations)
│       │   ├── store/              # Zustand stores and React contexts
│       │   ├── types/              # App-local TypeScript types (not shared across apps)
│       │   └── locales/            # i18n locale files (es.json, en.json)
│       │       ├── es.json
│       │       └── en.json
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
│   │   │   ├── trip.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── index.ts            # Barrel export
│   │   ├── tsconfig.json
│   │   └── package.json            # name: "@chamuco/shared-types"
│   │
│   └── shared-utils/               # Shared pure utility functions (dates, currency, etc.)
│       ├── src/
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json            # name: "@chamuco/shared-utils"
│
├── documentation/                  # All design and planning documentation (this folder)
│   ├── overview/
│   ├── architecture/
│   ├── features/
│   ├── design/
│   └── infrastructure/
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
├── pnpm-workspace.yaml             # pnpm workspace declaration
├── tsconfig.base.json              # Base TypeScript config extended by all packages
├── .eslintrc.js                    # Root ESLint config
├── .prettierrc                     # Prettier config (indentation, quotes, trailing commas)
├── .lintstagedrc.js                # lint-staged config: which tools run on which file patterns
└── README.md
```

---

## Package Manager & Workspace Tool

The monorepo uses **pnpm workspaces** as the package manager and **Turborepo** as the build orchestration layer.

**pnpm** was chosen over npm and yarn for:
- Significantly faster installs via content-addressable storage (packages are never duplicated on disk).
- Strict dependency isolation — a package can only import what is declared in its own `package.json`, preventing accidental cross-package leakage.
- Native workspace support with `pnpm-workspace.yaml`.

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

The `packages/shared-types` package is critical for keeping API contracts consistent between the backend and frontend. It should contain:

- Domain entity interfaces (e.g., `ITrip`, `IUser`, `IParticipant`).
- Enum definitions (e.g., `TripStatus`, `ReservationStatus`, `ParticipantRole`).
- DTO interfaces used in API request/response contracts.

> All enums and type names must be in English regardless of the application's display language.

---

## Import Aliases

Relative imports (e.g., `../../../components/Button`) are **prohibited**. Every import of a local module must use a path alias. This is enforced via TypeScript's `paths` compiler option and ESLint's `no-restricted-imports` rule.

### Two alias namespaces

| Alias prefix | Scope | Resolves to |
|---|---|---|
| `@/*` | App-internal | The `src/` directory of the **current app** |
| `@chamuco/*` | Cross-package | A shared package in `packages/` |

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
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage examples:**

```ts
// ✅ Correct — alias
import { UsersService } from '@/modules/users/users.service'
import { FirebaseAuthGuard } from '@/common/guards/firebase-auth.guard'
import { Button } from '@/components/Button'
import { useTrip } from '@/hooks/useTrip'
import { apiClient } from '@/lib/api-client'

// ❌ Wrong — relative path
import { Button } from '../../../components/Button'
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
      "@chamuco/shared-utils": ["./packages/shared-utils/src/index.ts"]
    }
  }
}
```

**Usage examples:**

```ts
// ✅ Correct — workspace package alias
import type { ITrip, TripStatus } from '@chamuco/shared-types'
import { formatCurrency } from '@chamuco/shared-utils'

// ❌ Wrong — relative cross-package path
import type { ITrip } from '../../packages/shared-types/src/trip.types'
```

### Directory conventions implied by `@/*`

The alias makes directory naming load-bearing — a consistent layout ensures every developer knows where to put and find code.

**`apps/api/src/`**

| Directory | Contents |
|---|---|
| `modules/` | One folder per domain feature (e.g., `modules/users/`, `modules/trips/`). Each contains its controller, service, repository, DTOs, and schema file. |
| `common/` | Cross-cutting: guards, interceptors, decorators, filters, pipes. Nothing domain-specific. |
| `config/` | Environment variable validation and typed config providers. |
| `database/` | Drizzle connection factory, schema barrel file, migration utilities. |

**`apps/web/src/`**

| Directory | Contents |
|---|---|
| `app/` | Next.js App Router — layouts, pages, `loading.tsx`, `error.tsx`, route groups. |
| `components/` | Reusable, presentational UI components. No data fetching logic. |
| `hooks/` | Custom React hooks. May call services or access stores. |
| `lib/` | Thin wrappers around external libraries (Firebase client, date-fns, etc.) and low-level helpers. |
| `services/` | API client functions — typed wrappers around `fetch`/HTTP calls to the NestJS backend. |
| `store/` | Zustand stores and React contexts (auth state, preference state, etc.). |
| `types/` | App-local TypeScript types that are not shared with other apps or packages. |
| `locales/` | i18n locale files: `es.json`, `en.json`. |

### ESLint enforcement

The `no-restricted-imports` rule is configured at the root ESLint config to disallow patterns that escape upward through the directory tree:

```js
// .eslintrc.js (excerpt)
rules: {
  'no-restricted-imports': ['error', {
    patterns: ['../*', './**/..']
  }]
}
```

This catches any relative import that navigates upward (`../`) at lint time, before it reaches the pre-commit hook or CI.

---

## Versioning Strategy

- The repository uses **Git** for version control.
- Branching strategy: to be defined (recommended: **trunk-based development** with short-lived feature branches or **Gitflow** for more structured releases).
- Commit messages should follow **Conventional Commits** format (e.g., `feat:`, `fix:`, `docs:`, `chore:`).
