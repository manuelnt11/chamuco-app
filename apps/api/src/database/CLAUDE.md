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

| Table                     | Module            | Description                                                                                                                                               |
| ------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                   | users             | Core auth identity record                                                                                                                                 |
| `user_preferences`        | users             | 1:1 — display/UX preferences                                                                                                                              |
| `user_profiles`           | users             | 1:1 — personal profile, health data (JSONB), emergency contacts, loyalty programs                                                                         |
| `user_nationalities`      | users             | 1:many — citizenships + passport documents                                                                                                                |
| `user_visas`              | users             | 1:many — visas held, linked to a nationality record                                                                                                       |
| `user_etas`               | users             | 1:many — electronic travel authorizations, linked to a nationality record and a specific passport                                                         |
| `support_admin_audit_log` | users             | Append-only audit trail for all SUPPORT_ADMIN writes                                                                                                      |
| `trips`                   | trips             | Core trip entity — status, visibility, dates, capacity, departure/landing                                                                                 |
| `trip_destinations`       | trips             | 1:many — ordered stop list for a trip; UNIQUE `(trip_id, position)`, position ≥ 1                                                                         |
| `group_trips`             | trips             | M:M junction — groups linked to a trip; linking triggers bulk member invitations (app logic)                                                              |
| `trip_participants`       | trips             | M:M — one active record per user per trip; composite PK `(trip_id, user_id)`; status state machine (INVITED → ACCEPTED → CONFIRMED); `updated_at` trigger |
| `invitation_tokens`       | invitation-tokens | Polymorphic shareable invite links (referral / trip / group); open links have a partial unique index per context; see `features/invitation-tokens.md`     |

### `updated_at` triggers

Every table with an `updated_at` column has a `BEFORE UPDATE` trigger that calls the shared `set_updated_at()` function. The function is created once in migration `0001` and reused by all subsequent tables. When adding a new table with `updated_at`, append a trigger to its migration file:

```sql
CREATE TRIGGER <table>_set_updated_at
  BEFORE UPDATE ON "<table>"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
```

Tables with triggers: `users`, `user_preferences`, `user_profiles`, `user_nationalities`, `user_visas`, `user_etas`, `group_member_stats`, `trip_participants`.

### Primary key strategy for relation tables

**Use a composite primary key** `(entity_a_id, entity_b_id)` when the pair of IDs uniquely identifies a single current relationship and the same pair will not appear more than once (1:1 joins, M:M junction tables without history).

Use a UUID PK only when the same pair of IDs can appear multiple times over time — e.g., an audit log or event history where repeated entries for the same pair are meaningful.

Examples using composite PK: `group_members (group_id, user_id)`, `group_member_stats (group_id, user_id)`.

### `assets` table — single-owner, hard-deleted

Each row in `assets` is owned by exactly one entity (`users.avatar`, `groups.cover`, etc.). There is no shared ownership and no soft-delete: when an asset is replaced, the old row is physically deleted from `assets` after the transaction commits.

**All FKs pointing to `assets.id` must use `ON DELETE restrict`** in both the Drizzle schema and the generated migration:

```ts
// ✅ Correct
avatar: uuid('avatar').references(() => assets.id, { onDelete: 'restrict' }),

// ❌ Wrong — omitting onDelete lets Drizzle default to 'no action', which
//    generates a silent regression the next time db:generate runs
avatar: uuid('avatar').references(() => assets.id),
```

**Why `restrict` and not `set null` or `cascade`:**

The asset replacement pattern (documented in the root CLAUDE.md rule #7) guarantees that the entity FK is updated to the new asset _inside the transaction_, before the old asset record is deleted _after_ the transaction. By the time `DELETE FROM assets WHERE id = old` runs, no entity references that row anymore — so `restrict` never fires in normal operation. If it does fire, a bug violated the replacement contract: surface the error rather than silently nulling the FK or cascading a deletion.

### Entities that use logical soft-delete

The following entities are never hard-deleted. Deletion is always logical: a `deleted_at` timestamp is set on the row and all queries must filter `IS NULL deleted_at` to exclude them.

| Entity   | Column       | Notes                                                                                                                                                                                              |
| -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`  | `deleted_at` | Account deletion (post-MVP). All `NOT NULL` FKs pointing to `users.id` with `ON DELETE restrict` are safe — the row never disappears.                                                              |
| `groups` | `deleted_at` | Group deletion (owner action or dissolution when last active member leaves). The `cover` FK is nulled inside the same update so the orphaned asset row can be cleaned up after commit per rule #7. |

**Why soft-delete for groups?** Group membership history, stats, and past activity should survive a group deletion for audit and potential recovery. Hard-deleting the group row would cascade or leave orphaned foreign keys across group_members and group_member_stats.

**Query filter:** every query that looks up a group must include `isNull(groups.deletedAt)`:

```ts
where: and(eq(groups.id, id), isNull(groups.deletedAt));
```

### Key relationships

```
users
 ├── user_preferences      (1:1, cascade delete)
 ├── user_profiles         (1:1, cascade delete)
 └── user_nationalities    (1:many, cascade delete)
      ├── user_visas        (1:many, cascade delete)
      └── user_etas         (1:many, cascade delete)

groups
 ├── group_members         (1:many — composite PK, one record per user per group)
 └── group_member_stats    (1:many — composite PK, one stats record per user per group)
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
| `medical_condition_type`   | 9 values                                                                                                         | `user_profiles.medical_conditions` (JSONB)   |
| `passport_status`          | `OMITTED`, `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`                                                                  | `user_nationalities.passport_status`         |
| `visa_coverage_type`       | `COUNTRY`, `ZONE`                                                                                                | `user_visas.coverage_type`                   |
| `visa_zone`                | `SCHENGEN`, `GCC`, `CARICOM`, `EAC`, `CAN`, `MERCOSUR`, `ECOWAS`                                                 | `user_visas.visa_zone`                       |
| `visa_type`                | `TOURIST`, `BUSINESS`, `TRANSIT`, `WORK`, `STUDENT`, `DIGITAL_NOMAD`, `OTHER`                                    | `user_visas.visa_type`                       |
| `visa_entries`             | `SINGLE`, `DOUBLE`, `MULTIPLE`                                                                                   | `user_visas.entries`, `user_etas.entries`    |
| `visa_status`              | `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`                                                                             | `user_visas.visa_status`                     |
| `eta_type`                 | `TOURIST`, `TRANSIT`                                                                                             | `user_etas.eta_type`                         |
| `eta_status`               | `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`                                                                             | `user_etas.eta_status`                       |
| `notification_type`        | 10 values — see `NotificationType` in shared-types                                                               | `notifications.type`                         |
| `notification_channel`     | `PUSH`, `EMAIL`, `SMS`                                                                                           | `notification_deliveries.channel`            |
| `delivery_status`          | `PENDING`, `SENT`, `FAILED`                                                                                      | `notification_deliveries.status`             |
| `trip_status`              | `DRAFT`, `OPEN`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`                                            | `trips.status`                               |
| `trip_visibility`          | `PUBLIC`, `PRIVATE`                                                                                              | `trips.visibility`                           |
| `trip_role`                | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT`                                                                       | `trip_participants.role`                     |
| `trip_participant_status`  | `INVITED`, `PENDING_REQUEST`, `ACCEPTED`, `CONFIRMED`, `DECLINED`                                                | `trip_participants.status`                   |
| `invitation_token_context` | `referral`, `trip`, `group`                                                                                      | `invitation_tokens.context_type`             |

All enum values are sourced from `@chamuco/shared-types` — never hardcode them in schema files.

**PG enum / TS enum sync:** PG enums list values explicitly in the schema file (e.g., `pgEnum('notification_type', [NotificationType.X, ...])`). Drizzle does not auto-read the TS enum at generate time — it only sees the array you pass. If a value is added to a shared-types enum, the corresponding `pgEnum(...)` call and a new migration (`ALTER TYPE ... ADD VALUE`) must be updated manually in the same PR.

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

| #         | File                            | What changed                                                                                                                                                                                                       |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0000      | `0000_initial_setup.sql`        | Baseline — establishes the migration system                                                                                                                                                                        |
| 0001      | `0001_gigantic_madrox.sql`      | `users`, `user_preferences` tables; `auth_provider`, `platform_role`, `app_*` enums                                                                                                                                |
| 0002      | `0002_chubby_marauders.sql`     | `support_admin_audit_log` table                                                                                                                                                                                    |
| 0003      | `0003_flat_energizer.sql`       | `user_profiles` table; health enums (`dietary_preference`, `food_allergen`, `phobia_type`, `physical_limitation_type`, `medical_condition_type`)                                                                   |
| 0004      | `0004_short_sage.sql`           | `user_nationalities` table; `passport_status` enum                                                                                                                                                                 |
| 0005      | `0005_split_phone_number.sql`   | Replaced `phone_number` with `phone_country_code` + `phone_local_number` on `user_profiles`                                                                                                                        |
| 0006      | `0006_panoramic_vector.sql`     | `profile_visibility` enum + column on `users`                                                                                                                                                                      |
| 0007      | `0007_fast_carlie_cooper.sql`   | Changed `user_profiles.bio` to `varchar(200)`                                                                                                                                                                      |
| 0008      | `0008_numerous_spot.sql`        | CHECK constraints on `user_nationalities` for `national_id_number` and `passport_number` format                                                                                                                    |
| 0009      | `0009_melodic_pyro.sql`         | `user_visas` and `user_etas` tables; visa/ETA enums                                                                                                                                                                |
| 0010      | `0010_wide_mephisto.sql`        | Relaxed CHECK constraints on `user_nationalities` for `national_id_number` and `passport_number` (allow single-char values)                                                                                        |
| 0011      | `0011_minor_adam_destine.sql`   | `blood_type` enum + `user_profiles.blood_type` nullable column                                                                                                                                                     |
| 0012      | `0012_dizzy_naoko.sql`          | Added `phone_verified`, `email`, `email_verified` columns to `user_profiles`                                                                                                                                       |
| 0013      | `0013_breezy_hannibal_king.sql` | Migrated `email` from `users` to `user_profiles` (backfill + drop `users.email`)                                                                                                                                   |
| 0014      | `0014_mute_rictor.sql`          | Removed `IMMUNODEFICIENCY` from `medical_condition_type` enum                                                                                                                                                      |
| 0015      | `0015_asset_infrastructure.sql` | `assets` table; asset source and type enums                                                                                                                                                                        |
| 0016      | `0016_groups_core.sql`          | `groups` table; `group_visibility` enum                                                                                                                                                                            |
| 0017      | `0017_perpetual_unicorn.sql`    | `group_members` and `group_member_stats` tables (composite PKs); `group_member_status`, `group_role`, `group_member_tier` enums                                                                                    |
| 0018      | `0018_condemned_pestilence.sql` | `groups.cover` made nullable; `groups.deleted_at` added (soft-delete support)                                                                                                                                      |
| 0019      | `0019_fluffy_fabian_cortez.sql` | Indexes on `group_members (user_id, status)` and `(group_id, status)`                                                                                                                                              |
| 0020      | `0020_normal_fat_cobra.sql`     | `notifications` and `notification_deliveries` tables; `notification_type`, `notification_channel`, `delivery_status` enums                                                                                         |
| 0021      | `0021_tranquil_lester.sql`      | `user_fcm_tokens` table                                                                                                                                                                                            |
| 0022      | `0022_eager_joseph.sql`         | `user_preferences.notification_opt_outs` JSONB column                                                                                                                                                              |
| 0023      | `0023_moaning_the_phantom.sql`  | `group_announcements` table                                                                                                                                                                                        |
| 0024      | `0024_good_colonel_america.sql` | Dropped `notifications.title` and `notifications.body`                                                                                                                                                             |
| 0025      | `0025_steep_blob.sql`           | `group_announcements.updated_at` column + `set_updated_at` trigger                                                                                                                                                 |
| 0026      | `0026_blue_red_skull.sql`       | Added `GROUP_INVITATION_ACCEPTED` value to `notification_type` enum                                                                                                                                                |
| 0027      | `0027_steady_penance.sql`       | Added `GROUP_MEMBER_REMOVED`, `GROUP_MEMBER_PROMOTED`, `GROUP_MEMBER_DEMOTED` to `notification_type` enum                                                                                                          |
| 0028      | `0028_glossy_lethal_legion.sql` | `trips` table; `trip_status`, `trip_visibility` enums                                                                                                                                                              |
| 0029      | `0029_tan_marrow.sql`           | `trips_participant_capacity_min` CHECK constraint on `trips`                                                                                                                                                       |
| 0030      | `0030_rapid_boomerang.sql`      | `trip_destinations` table (ordered stops, UNIQUE `(trip_id, position)`); `group_trips` junction table (composite PK `(trip_id, group_id)`)                                                                         |
| 0031      | `0031_wet_wendell_vaughn.sql`   | `idx_group_trips_group_id` index on `group_trips`                                                                                                                                                                  |
| 0032      | `0032_abnormal_blockbuster.sql` | `trip_participants` table (composite PK `(trip_id, user_id)`); `trip_role`, `trip_participant_status` enums; `initiated_by`/`decided_by` audit columns; CHECK `participant_must_be_traveler`; `updated_at` trigger |
| 0033–0034 | _(pending doc)_                 | See migration files for details                                                                                                                                                                                    |
| 0035      | `0035_robust_snowbird.sql`      | `invitation_tokens` table; `invitation_token_context` enum; partial unique index for one open link per context                                                                                                     |

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

The production path is detected by `NODE_ENV === 'production' && K_SERVICE` (Cloud Run sets `K_SERVICE` automatically). In production, the password is an async function that fetches a fresh OAuth2 token from the GCP metadata server on each new connection — tokens expire every ~1 hour so this must be dynamic.

### Environment variables

| Variable            | Required   | Description                                                                                   |
| ------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | Local only | Full PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/chamuco_dev`) |
| `DATABASE_POOL_MAX` | Optional   | Max connections in the pool. Default: `10`                                                    |
| `PGPASSWORD`        | Not used   | Removed. Token is now fetched dynamically from the GCP metadata server per connection.        |

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
