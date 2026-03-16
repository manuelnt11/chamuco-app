# Chamuco App — Monorepo Structure

**Status:** Defined
**Last Updated:** 2026-03-15

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
│   │   │   ├── modules/            # Feature modules (see backend-architecture.md)
│   │   │   ├── common/             # Guards, interceptors, decorators, pipes
│   │   │   ├── config/             # Environment config and validation
│   │   │   └── main.ts
│   │   ├── test/
│   │   └── package.json
│   │
│   └── web/                        # Next.js frontend application
│       ├── src/
│       │   ├── components/
│       │   ├── pages/              # or app/ for Next.js App Router
│       │   ├── hooks/
│       │   └── styles/
│       └── package.json
│
├── packages/
│   ├── shared-types/               # Shared TypeScript interfaces, enums, and DTOs
│   │   ├── src/
│   │   │   ├── trip.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── shared-utils/               # Shared pure utility functions (date formatting, currency, etc.)
│       ├── src/
│       └── package.json
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

## Versioning Strategy

- The repository uses **Git** for version control.
- Branching strategy: to be defined (recommended: **trunk-based development** with short-lived feature branches or **Gitflow** for more structured releases).
- Commit messages should follow **Conventional Commits** format (e.g., `feat:`, `fix:`, `docs:`, `chore:`).
