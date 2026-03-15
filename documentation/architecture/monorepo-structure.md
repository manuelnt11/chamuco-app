# Chamuco App — Monorepo Structure

**Status:** Proposed
**Last Updated:** 2026-03-14

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
│   └── web/                        # Frontend application (framework TBD)
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
├── package.json                    # Root package.json (workspace manager)
├── tsconfig.base.json              # Base TypeScript config extended by all packages
├── .eslintrc.js                    # Root ESLint config
├── .prettierrc                     # Prettier config
└── README.md
```

---

## Package Manager & Workspace Tool

To be decided between:

- **npm workspaces** — Native, minimal tooling, sufficient for most cases.
- **pnpm workspaces** — Faster installs, better disk efficiency, stricter dependency resolution.
- **Turborepo** — Build system on top of npm/pnpm workspaces; adds caching and parallel task execution. Recommended if build times become a concern.

> **Recommendation:** Start with **pnpm workspaces + Turborepo**. This combination is well-suited for Node.js monorepos and scales well as the project grows.

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
