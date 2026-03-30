# Chamuco App

**Chamuco Travel** — A group travel management platform covering the full lifecycle of group journeys.

> **Status:** Design and documentation phase. No production code yet.

## What Is Chamuco

Chamuco is not a travel app. It is an app for groups that travel.

It covers trip planning, itinerary management, participant coordination, shared expenses, reservations, real-time communication, and the long-term social identity of the group: achievements, reputation, rankings, and a personal travel history that grows with every trip.

The closest reference is Strava, applied to group travel.

## Tech Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Runtime   | Node.js + TypeScript        |
| Backend   | NestJS                      |
| Frontend  | Next.js (React) + PWA       |
| Database  | PostgreSQL (Drizzle ORM)    |
| Real-time | Firestore (Firebase)        |
| Auth      | Firebase Authentication     |
| Cloud     | Google Cloud Platform       |
| Monorepo  | pnpm workspaces + Turborepo |

For full stack details, see [`documentation/overview/tech-stack.md`](documentation/overview/tech-stack.md).

## Project Structure

```
chamuco-app/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── db/           # Drizzle ORM schemas & migrations
│   ├── shared-types/ # Shared TypeScript types
│   └── shared-utils/ # Shared utilities
└── documentation/    # Design docs & specs
```

## Prerequisites

- **Node.js** ≥ 22.0.0
- **pnpm** ≥ 10.0.0
- **Docker** (for local PostgreSQL)
- **Git**

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/manuelnt11/Chamuco-App.git
cd Chamuco-App
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Each app requires its own `.env.local` file. See the respective README files:

- [`apps/api/README.md`](apps/api/README.md) — Backend setup
- [`apps/web/README.md`](apps/web/README.md) — Frontend setup

### 4. Run in development mode

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm --filter api dev
pnpm --filter web dev
```

## Available Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `pnpm dev`           | Start all apps in development mode |
| `pnpm build`         | Build all apps for production      |
| `pnpm lint`          | Lint all packages                  |
| `pnpm typecheck`     | Type-check all packages            |
| `pnpm test`          | Run all unit tests                 |
| `pnpm test:coverage` | Run tests with coverage            |
| `pnpm format`        | Format all files with Prettier     |
| `pnpm format:check`  | Check formatting without writing   |

## Documentation

All design specs live in [`documentation/`](documentation/):

- **Overview:** [`project-overview.md`](documentation/overview/project-overview.md), [`mvp.md`](documentation/overview/mvp.md), [`tech-stack.md`](documentation/overview/tech-stack.md)
- **Architecture:** [`backend-architecture.md`](documentation/architecture/backend-architecture.md), [`database-design.md`](documentation/architecture/database-design.md), [`monorepo-structure.md`](documentation/architecture/monorepo-structure.md)
- **Features:** [`users.md`](documentation/features/users.md), [`trips.md`](documentation/features/trips.md), [`participants.md`](documentation/features/participants.md), [`community.md`](documentation/features/community.md), [`gamification.md`](documentation/features/gamification.md), and more

## Contributing

This is a private project under active development. No external contributions are accepted at this time.

## License

Proprietary. Not licensed for public use.
