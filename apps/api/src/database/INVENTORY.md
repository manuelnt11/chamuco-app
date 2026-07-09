# Inventory: database

---

## database.module.ts

### Imports

- `@nestjs/common` — `Global`, `Module` decorators for defining a globally-scoped NestJS module
- `./drizzle.provider` — `drizzleProvider` factory provider to register and export

### Definitions

- `DatabaseModule` (module) — `@Global()` NestJS module that registers and exports `drizzleProvider`, making the Drizzle client available application-wide without re-importing

### Exports

- `DatabaseModule` — named

---

## db-errors.spec.ts

### Imports

- `./db-errors` — `isUniqueViolation` function under test

### Definitions

- Test suite for `isUniqueViolation` covering direct PG error shape, DrizzleQueryError nested-cause shape, non-matching codes, and non-object inputs

### Exports

- _(none)_

---

## db-errors.ts

### Imports

- _(none)_

### Definitions

- `PG_UNIQUE_VIOLATION` (const) — non-exported constant holding PostgreSQL error code `'23505'` (unique constraint violation)
- `isUniqueViolation` (function) — type guard that returns `true` if the thrown value is a PG unique constraint violation, handling both direct `{ code }` shape and DrizzleQueryError's `{ cause: { code } }` shape

### Exports

- `isUniqueViolation` — named

---

## drizzle.provider.spec.ts

### Imports

- `@nestjs/config` — `ConfigService` used to construct test configurations
- `./drizzle.provider` — `drizzleProvider`, `DRIZZLE_CLIENT` under test

### Definitions

- Test suite verifying `drizzleProvider` token identity, `ConfigService` injection, factory return value, `DATABASE_URL` / `DATABASE_POOL_MAX` config reads, Cloud Run unix-socket path, and `DRIZZLE_CLIENT` symbol shape

### Exports

- _(none)_

---

## drizzle.provider.ts

### Imports

- `@nestjs/config` — `ConfigService` injected into the factory to read env vars
- `drizzle-orm/postgres-js` — `drizzle` function that wraps a postgres.js client with schema inference
- `postgres` — `postgres` connection factory (postgres.js)
- `./schema` — `* as schema` barrel export consumed by drizzle for typed query building

### Definitions

- `DRIZZLE_CLIENT` (const) — `Symbol('DRIZZLE_CLIENT')` injection token used to inject the Drizzle client in services
- `DrizzleClient` (type) — inferred type of the Drizzle instance bound to the full schema (`ReturnType<typeof drizzle<typeof schema>>`)
- `drizzleProvider` (const) — NestJS factory provider (`useFactory`) that builds the `DrizzleClient`; detects Cloud Run (`NODE_ENV === 'production' && K_SERVICE`) to use unix socket + dynamic GCP metadata-server IAM token, otherwise uses `DATABASE_URL` for local development; applies `{ max, idle_timeout: 20, connect_timeout: 10, prepare: false }` in both paths

### Exports

- `DRIZZLE_CLIENT` — named
- `DrizzleClient` — named
- `drizzleProvider` — named
