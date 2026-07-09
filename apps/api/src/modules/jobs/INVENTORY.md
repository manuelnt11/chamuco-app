# Inventory: jobs

---

## jobs.module.ts

### Imports

- `@nestjs/common` — `Module` decorator for defining NestJS modules
- `@/database/database.module` — `DatabaseModule` providing the Drizzle client
- `@/modules/notifications/notifications.module` — `NotificationsModule` providing `NotificationsService`
- `./passport-status.job` — `PassportStatusJob` scheduled job provider
- `./trip-status.job` — `TripStatusJob` scheduled job provider

### Definitions

- `JobsModule` (module) — NestJS module that registers `PassportStatusJob` and `TripStatusJob` as providers, importing database and notifications dependencies

### Exports

- `JobsModule` — named

---

## passport-status.job.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `Logger` for DI, logging, and provider registration
- `@nestjs/schedule` — `Cron`, `CronExpression` for cron-based scheduling
- `drizzle-orm` — `sql` for raw SQL template tag
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `PassportStatus` enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/notifications/notifications.service` — `NotificationsService` for sending notifications

### Definitions

- `PassportStatusRow` (type) — shape of rows returned by the bulk UPDATE query: `{ user_id, country_code, passport_status }`
- `PassportStatusJob` (service) — scheduled job that runs daily at midnight; bulk-updates `user_nationalities` passport statuses (ACTIVE / EXPIRING_SOON / EXPIRED) via a single SQL UPDATE and sends push + email notifications for rows that transitioned to EXPIRING_SOON or EXPIRED
  - `runPassportStatusRefresh()` — cron entry point (`EVERY_DAY_AT_MIDNIGHT`); catches and logs top-level errors
  - `refresh()` (private) — executes the bulk UPDATE, filters changed rows, fans out `notificationsService.notify` calls via `Promise.allSettled`

### Exports

- `PassportStatusJob` — named

---

## passport-status.job.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS unit test harness
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType`, `PassportStatus` enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token
- `@/modules/notifications/notifications.service` — `NotificationsService` for mock typing
- `./passport-status.job` — `PassportStatusJob` class under test

### Definitions

- `PassportStatusJob` test suite — covers: SQL executed once per run, notifications sent for EXPIRING_SOON and EXPIRED rows, no notification for ACTIVE rows, empty result no-ops, DB error caught and logged, notify rejection caught and logged, parallel fan-out for multiple changed rows

### Exports

- _(none — test file)_

---

## trip-status.job.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `Logger` for DI, logging, and provider registration
- `@nestjs/schedule` — `Cron`, `CronExpression` for cron-based scheduling
- `drizzle-orm` — `and`, `eq`, `lt`, `sql` for query composition
- `@chamuco/shared-types` — `TripStatus` enum
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table reference

### Definitions

- `TripStatusJob` (service) — scheduled job that runs daily at midnight; transitions all `IN_PROGRESS` trips whose `end_date` is before `CURRENT_DATE` to `COMPLETED` via a single Drizzle UPDATE
  - `runTripAutoComplete()` — cron entry point (`EVERY_DAY_AT_MIDNIGHT`); catches and logs top-level errors
  - `autoComplete()` (private) — executes the bulk UPDATE using Drizzle query builder

### Exports

- `TripStatusJob` — named

---

## trip-status.job.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS unit test harness
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token
- `./trip-status.job` — `TripStatusJob` class under test

### Definitions

- `TripStatusJob` test suite — covers: bulk UPDATE called once for IN_PROGRESS trips past end_date, DB error caught and logged without rethrowing

### Exports

- _(none — test file)_
