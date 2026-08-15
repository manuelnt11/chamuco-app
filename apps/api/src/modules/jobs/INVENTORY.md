# Inventory: jobs

---

## jobs.module.ts

### Imports

- `@nestjs/common` — `Module` decorator for defining NestJS modules
- `@/database/database.module` — `DatabaseModule` providing the Drizzle client
- `@/modules/notifications/notifications.module` — `NotificationsModule` providing `NotificationsService`
- `./notification-cleanup.job` — `NotificationCleanupJob` scheduled job provider
- `./passport-status.job` — `PassportStatusJob` scheduled job provider
- `./trip-status.job` — `TripStatusJob` scheduled job provider

### Definitions

- `JobsModule` (module) — NestJS module that registers `NotificationCleanupJob`, `PassportStatusJob`, and `TripStatusJob` as providers, importing database and notifications dependencies

### Exports

- `JobsModule` — named

---

## notification-cleanup.job.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `Logger` for DI, logging, and provider registration
- `@nestjs/schedule` — `Cron`, `CronExpression` for cron-based scheduling
- `drizzle-orm` — `and`, `isNotNull`, `lt`, `sql` for query composition
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/notifications/schema/notifications.schema` — `notifications` Drizzle table reference

### Definitions

- `NotificationCleanupJob` (service) — scheduled job that runs daily at midnight; hard-deletes all notifications where `read_at IS NOT NULL` and `read_at < NOW() - INTERVAL '7 days'`
  - `runNotificationCleanup()` — cron entry point (`EVERY_DAY_AT_MIDNIGHT`); catches and logs top-level errors
  - `cleanup()` (private) — executes the bulk DELETE using Drizzle query builder

### Exports

- `NotificationCleanupJob` — named

---

## notification-cleanup.job.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS unit test harness
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token
- `./notification-cleanup.job` — `NotificationCleanupJob` class under test

### Definitions

- `NotificationCleanupJob` test suite — covers: bulk DELETE called once for read notifications older than 7 days, DB error caught and logged without rethrowing

### Exports

- _(none — test file)_

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
- `@/modules/notifications/notifications.service` — `NotificationsService`, passed through to `notifyTripCompleted`
- `@/modules/trips/trip-completion.util` — `notifyTripCompleted`, shared with `TripsService.transitionStatus`
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table reference

### Definitions

- `TripStatusJob` (service) — scheduled job that runs daily at midnight; transitions `IN_PROGRESS` trips whose `end_date` is before `CURRENT_DATE` to `COMPLETED`, one trip at a time, and notifies each trip's confirmed participants
  - `runTripAutoComplete()` — cron entry point (`EVERY_DAY_AT_MIDNIGHT`); catches and logs top-level errors
  - `autoComplete()` (private) — SELECTs due trips, then processes each via `completeTrip()` inside a per-trip try/catch so one trip's failure doesn't skip the rest of that run's batch
  - `completeTrip(tripId, tripName)` (private) — UPDATEs a single trip to `COMPLETED`, re-checking `status = IN_PROGRESS AND end_date < CURRENT_DATE` at write time (via `.returning()`) so a trip cancelled between the SELECT and this UPDATE isn't overwritten; skips notification if the row didn't match; delegates to the shared `notifyTripCompleted` util on success

### Exports

- `TripStatusJob` — named

---

## trip-status.job.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS unit test harness
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token
- `@/modules/notifications/notifications.service` — `NotificationsService` mock provider
- `./trip-status.job` — `TripStatusJob` class under test

### Definitions

- `TripStatusJob` test suite — covers: per-trip completion with participant notification, no-op when no trips are due, skipped notification when a trip's UPDATE matches no row (concurrent status change) or has no confirmed participants, notifyMany rejection does not rethrow, DB error caught and logged without rethrowing, independent processing across multiple due trips, and one trip's UPDATE throwing does not abort the rest of the batch

### Exports

- _(none — test file)_
