# Inventory: seeds

---

## seed-admin.ts

### Imports

- `dotenv/config` — loads environment variables from `.env` into `process.env`
- `postgres` — `postgres` raw PostgreSQL client used to open a single-connection pool
- `drizzle-orm/postgres-js` — `drizzle` factory that wraps the postgres client with ORM capabilities
- `@/database/schema` — `schema` (namespace import) providing all table definitions (`users`, `userPreferences`, `userProfiles`)
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole` enums used to set auth provider and platform role values

### Definitions

- `requireEnv` (function) — reads a required environment variable by name, throws if missing
- `seedAdmin` (function) — reads env vars, opens a DB connection, upserts a `SUPPORT_ADMIN` user plus their `user_preferences` and `user_profiles` rows, then closes the connection

### Exports

- None — script is invoked directly via `pnpm --filter api db:seed-admin`; all logic runs via top-level `seedAdmin().catch(...)` call

---

## seed-dev.ts

### Imports

- `dotenv/config` — loads environment variables from `.env` into `process.env`
- `postgres` — `postgres` raw PostgreSQL client used to open a single-connection pool
- `drizzle-orm/postgres-js` — `drizzle` factory that wraps the postgres client with ORM capabilities
- `drizzle-orm` — `eq` query helper used in WHERE clauses
- `@/database/schema` — `schema` (namespace import) providing table definitions (`assets`, `users`, `userPreferences`, `userProfiles`, `groups`, `groupMembers`, `groupMemberStats`)
- `@chamuco/shared-types` — `AuthProvider`, `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `GroupVisibility` enums

### Definitions

- `AVATAR_ASSET_IDS` (const) — array of 10 deterministic UUIDs for avatar asset rows
- `COVER_ASSET_IDS` (const) — array of 10 deterministic UUIDs for group cover asset rows
- `USER_IDS` (const) — array of 10 deterministic UUIDs for test user rows
- `GROUP_IDS` (const) — array of 10 deterministic UUIDs for test group rows
- `TEST_USERS` (const) — readonly tuple of 10 test user descriptors (username, displayName, firstName, lastName)
- `PUBLIC_GROUPS` (const) — readonly tuple of 5 public group descriptors (name, description)
- `PRIVATE_GROUPS` (const) — readonly tuple of 5 private group descriptors (name, description)
- `seedDev` (function) — inserts avatar assets, cover assets, users, user_preferences, user_profiles, groups, group_members (creator as OWNER), group_member_stats, and optional INVITED records for `manuelnt11`; idempotent via `onConflictDoNothing`

### Exports

- None — script is invoked directly via `pnpm --filter api db:seed-dev`; all logic runs via top-level `seedDev().catch(...)` call
