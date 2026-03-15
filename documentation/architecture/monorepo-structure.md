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
├── turbo.json                      # Turborepo pipeline configuration
├── package.json                    # Root package.json (pnpm workspaces)
├── pnpm-workspace.yaml             # pnpm workspace declaration
├── tsconfig.base.json              # Base TypeScript config extended by all packages
├── .eslintrc.js                    # Root ESLint config
├── .prettierrc                     # Prettier config
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
