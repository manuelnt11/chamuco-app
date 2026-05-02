# Database

PostgreSQL via Drizzle ORM. This document covers the folder structure, schema, migration workflow, runtime configuration, and how to use the Drizzle client in services.

---

## Folder structure

```
src/database/
├── CLAUDE.md                     ← this file
├── database.module.ts            ← NestJS global module — registers drizzleProvider
├── drizzle.provider.ts           ← factory that builds the DrizzleClient
├── drizzle.config.ts             ← drizzle-kit config (schema path, output dir, credentials)
├── schema/
│   └── index.ts                  ← barrel export consumed by drizzle-kit and drizzleProvider
├── migrations/
│   ├── meta/
│   │   ├── _journal.json         ← drizzle-kit migration ledger (do not edit)
│   │   └── <N>_snapshot.json     ← schema snapshot per migration (do not edit)
│   └── <N>_<slug>.sql            ← committed SQL migrations
└── seeds/
    └── seed-admin.ts             ← bootstrap a SUPPORT_ADMIN user (idempotent)
```

---

## Schema

Schema files live next to the module they belong to (`src/modules/<module>/schema/*.schema.ts`) and are re-exported from the barrel at `src/database/schema/index.ts`. Drizzle-kit reads only this barrel — every new schema file must be added there.

### Current tables

| Table                     | Module | Description                                                                                       |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `users`                   | users  | Core auth identity record                                                                         |
| `user_preferences`        | users  | 1:1 — display/UX preferences                                                                      |
| `user_profiles`           | users  | 1:1 — personal profile, health data (JSONB), emergency contacts, loyalty programs                 |
| `user_nationalities`      | users  | 1:many — citizenships + passport documents                                                        |
| `user_visas`              | users  | 1:many — visas held, linked to a nationality record                                               |
| `user_etas`               | users  | 1:many — electronic travel authorizations, linked to a nationality record and a specific passport |
| `support_admin_audit_log` | users  | Append-only audit trail for all SUPPORT_ADMIN writes                                              |

### `updated_at` triggers

Every table with an `updated_at` column has a `BEFORE UPDATE` trigger that calls the shared `set_updated_at()` function. The function is created once in migration `0001` and reused by all subsequent tables. When adding a new table with `updated_at`, append a trigger to its migration file:

```sql
CREATE TRIGGER <table>_set_updated_at
  BEFORE UPDATE ON "<table>"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
```

Tables with triggers: `users`, `user_preferences`, `user_profiles`, `user_nationalities`, `user_visas`, `user_etas`.

### Key relationships

```
users
 ├── user_preferences      (1:1, cascade delete)
 ├── user_profiles         (1:1, cascade delete)
 └── user_nationalities    (1:many, cascade delete)
      ├── user_visas        (1:many, cascade delete)
      └── user_etas         (1:many, cascade delete)
```

### PostgreSQL enum types

| PG type                    | Values                                                                                                           | Used by                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `auth_provider`            | `GOOGLE`, `FACEBOOK`                                                                                             | `users.auth_provider`                        |
| `platform_role`            | `USER`, `SUPPORT_ADMIN`                                                                                          | `users.platform_role`                        |
| `profile_visibility`       | `PRIVATE`, `CONNECTIONS_ONLY`, `MEMBERS_ONLY`, `PUBLIC`                                                          | `users.profile_visibility`                   |
| `app_currency`             | `COP`, `USD`                                                                                                     | `user_preferences.currency`                  |
| `app_language`             | `ES`, `EN`                                                                                                       | `user_preferences.language`                  |
| `app_theme`                | `LIGHT`, `DARK`, `SYSTEM`                                                                                        | `user_preferences.theme`                     |
| `blood_type`               | `A_POSITIVE`, `A_NEGATIVE`, `B_POSITIVE`, `B_NEGATIVE`, `AB_POSITIVE`, `AB_NEGATIVE`, `O_POSITIVE`, `O_NEGATIVE` | `user_profiles.blood_type`                   |
| `dietary_preference`       | `OMNIVORE`, `VEGETARIAN`, `VEGAN`, `PESCATARIAN`, `GLUTEN_FREE`, `OTHER`                                         | `user_profiles.dietary_preference`           |
| `food_allergen`            | 15 values                                                                                                        | `user_profiles.food_allergies` (JSONB)       |
| `phobia_type`              | 13 values                                                                                                        | `user_profiles.phobias` (JSONB)              |
| `physical_limitation_type` | 13 values                                                                                                        | `user_profiles.physical_limitations` (JSONB) |
| `medical_condition_type`   | 10 values                                                                                                        | `user_profiles.medical_conditions` (JSONB)   |
| `passport_status`          | `OMITTED`, `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`                                                                  | `user_nationalities.passport_status`         |
| `visa_coverage_type`       | `COUNTRY`, `ZONE`                                                                                                | `user_visas.coverage_type`                   |
| `visa_zone`                | `SCHENGEN`, `GCC`, `CARICOM`, `EAC`, `CAN`, `MERCOSUR`, `ECOWAS`                                                 | `user_visas.visa_zone`                       |
| `visa_type`                | `TOURIST`, `BUSINESS`, `TRANSIT`, `WORK`, `STUDENT`, `DIGITAL_NOMAD`, `OTHER`                                    | `user_visas.visa_type`                       |
| `visa_entries`             | `SINGLE`, `DOUBLE`, `MULTIPLE`                                                                                   | `user_visas.entries`, `user_etas.entries`    |
| `visa_status`              | `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`                                                                             | `user_visas.visa_status`                     |
| `eta_type`                 | `TOURIST`, `TRANSIT`                                                                                             | `user_etas.eta_type`                         |
| `eta_status`               | `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`                                                                             | `user_etas.eta_status`                       |

All enum values are sourced from `@chamuco/shared-types` — never hardcode them in schema files.

---

## Migration workflow

Migrations are explicit SQL files committed to Git. Schema push (`db:push`) is permanently disabled.

### Add or change a table

1. Edit the relevant `*.schema.ts` file.
2. Generate the migration:
   ```bash
   pnpm --filter api db:generate
   ```
3. Review the generated `.sql` file in `migrations/` — confirm it matches intent.
4. Commit both the schema change and the migration file in the same PR.

### Apply migrations

```bash
# Local — applies all pending migrations against DATABASE_URL
pnpm --filter api db:migrate

# Production — migrations run automatically in CI/CD before Cloud Run deploy
# (lint → typecheck → test → build → push image → db:migrate → deploy)
```

### Destructive operations

Column drops and renames require a multi-step migration strategy:

1. **Step 1 (deploy):** add the new column; keep the old one.
2. **Step 2 (deploy):** backfill data; migrate application code to the new column.
3. **Step 3 (deploy):** drop the old column.

Each step is a separate migration file and a separate PR. Document the steps in the PR description.

### Migration history

| #    | File                          | What changed                                                                                                                                     |
| ---- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0000 | `0000_initial_setup.sql`      | Baseline — establishes the migration system                                                                                                      |
| 0001 | `0001_gigantic_madrox.sql`    | `users`, `user_preferences` tables; `auth_provider`, `platform_role`, `app_*` enums                                                              |
| 0002 | `0002_chubby_marauders.sql`   | `support_admin_audit_log` table                                                                                                                  |
| 0003 | `0003_flat_energizer.sql`     | `user_profiles` table; health enums (`dietary_preference`, `food_allergen`, `phobia_type`, `physical_limitation_type`, `medical_condition_type`) |
| 0004 | `0004_short_sage.sql`         | `user_nationalities` table; `passport_status` enum                                                                                               |
| 0005 | `0005_split_phone_number.sql` | Replaced `phone_number` with `phone_country_code` + `phone_local_number` on `user_profiles`                                                      |
| 0006 | `0006_panoramic_vector.sql`   | `profile_visibility` enum + column on `users`                                                                                                    |
| 0007 | `0007_fast_carlie_cooper.sql` | Changed `user_profiles.bio` to `varchar(200)`                                                                                                    |
| 0008 | `0008_numerous_spot.sql`      | CHECK constraints on `user_nationalities` for `national_id_number` and `passport_number` format                                                  |
| 0009 | `0009_melodic_pyro.sql`       | `user_visas` and `user_etas` tables; visa/ETA enums                                                                                              |
| 0010 | `0010_wide_mephisto.sql`      | Relaxed CHECK constraints on `user_nationalities` for `national_id_number` and `passport_number` (allow single-char values)                      |
| 0011 | `0011_minor_adam_destine.sql` | `blood_type` enum + `user_profiles.blood_type` nullable column                                                                                   |

---

## Configuration

### `drizzle.config.ts`

Located at the root of `apps/api`. Read by drizzle-kit CLI commands only — not loaded at runtime.

```ts
{
  schema: './src/database/schema/index.ts',  // barrel consumed by drizzle-kit
  out: './src/database/migrations',           // generated SQL output
  dialect: 'postgresql',
  verbose: true,
  strict: true,                               // aborts on ambiguous destructive ops
}
```

Credentials are resolved from environment:

| Environment            | Connection mode                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Local development      | `DATABASE_URL` connection string                                                                |
| Cloud Run (production) | Unix socket `/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres` + IAM auth via `PGPASSWORD` |

The production path is detected by `NODE_ENV === 'production' && K_SERVICE` (Cloud Run sets `K_SERVICE` automatically).

### Environment variables

| Variable            | Required        | Description                                                                                   |
| ------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | Local only      | Full PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/chamuco_dev`) |
| `DATABASE_POOL_MAX` | Optional        | Max connections in the pool. Default: `10`                                                    |
| `PGPASSWORD`        | Production only | IAM token for Cloud SQL authentication. Set by the Cloud Run startup script.                  |

---

## Runtime client

### Provider

`drizzleProvider` (`drizzle.provider.ts`) is a NestJS factory provider registered in `DatabaseModule`. It builds a typed Drizzle client from the full schema barrel.

```ts
export const DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT');
export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;
```

Pool settings applied in both environments:

```ts
{ max: poolMax, idle_timeout: 20, connect_timeout: 10, prepare: false }
```

`prepare: false` disables prepared statements — required for Cloud SQL Auth Proxy and PgBouncer compatibility.

### Injecting the client

`DatabaseModule` is `@Global()` — import it once in `AppModule`. In any service:

```ts
import { Inject } from '@nestjs/common';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';

export class UsersService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async findByFirebaseUid(uid: string) {
    return this.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.firebaseUid, uid),
    });
  }
}
```

---

## Seeds

### `seed-admin.ts`

Bootstraps the first `SUPPORT_ADMIN` user. Idempotent — safe to run multiple times.

```bash
# Local
SEED_ADMIN_FIREBASE_UID="..." \
SEED_ADMIN_EMAIL="admin@chamucotravel.com" \
SEED_ADMIN_USERNAME="chamuco_admin" \
SEED_ADMIN_DISPLAY_NAME="Chamuco Admin" \
pnpm --filter api db:seed-admin

# Production (via Cloud SQL Auth Proxy on port 5433)
DATABASE_URL="postgresql://postgres:<password>@localhost:5433/chamuco_prod" \
SEED_ADMIN_FIREBASE_UID="..." ... pnpm --filter api db:seed-admin
```

Required env vars: `DATABASE_URL`, `SEED_ADMIN_FIREBASE_UID`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_DISPLAY_NAME`.
Optional: `SEED_ADMIN_AUTH_PROVIDER` (`GOOGLE` | `FACEBOOK`, default `GOOGLE`).

---

## Drizzle Studio

Visual browser for the database. Local only.

```bash
pnpm --filter api db:studio
# Opens at https://local.drizzle.studio
```
