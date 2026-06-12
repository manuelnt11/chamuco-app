# Chamuco App — Backend Architecture

**Status:** Active
**Last Updated:** 2026-06-11

---

## Framework

The backend is built with **NestJS**, a Node.js framework that enforces a modular, opinionated structure. Its decorator-driven design and built-in dependency injection make it well-suited for applications with clearly separated domain modules.

---

## Module Design Philosophy

Each feature domain is encapsulated in its own NestJS module. A module owns everything related to its domain and does not expose internal implementation details to other modules.

### Module Boundaries

#### Implemented

| Module                     | Domain Responsibility                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthModule`               | `@Global()` — Firebase ID token verification via `FirebaseAuthGuard` (applied globally via `APP_GUARD`), `@Public()` decorator to bypass, `RolesGuard` for role-based access, `FirebaseAdminService`.   |
| `UsersModule`              | User accounts, profiles, nationalities, passports, visas, ETAs, emergency contacts, health data, preferences, public profiles.                                                                          |
| `AssetsModule`             | `@Global()` — normalized asset records, `AssetResolverService` (resolves any `Asset` to `ResolvedAsset` with computed `url`). Consumed by `UsersModule`, `GroupsModule`.                                |
| `CloudStorageModule`       | `@Global()` — signed upload/download URL generation, object deletion, `makePublic`. All GCS operations go through `CloudStorageService`.                                                                |
| `UploadsModule`            | Pre-signed upload URL orchestration for client-side direct-to-GCS uploads.                                                                                                                              |
| `GroupsModule`             | Group CRUD, visibility management (PUBLIC/PRIVATE), cover image/emoji, soft-delete.                                                                                                                     |
| `GroupMembersModule`       | Group membership management. Sub-modules: `members/` (role management, listing), `invitations/` (outbound invitations, bulk invite by username), `join-requests/` (inbound request approval/rejection). |
| `GroupAnnouncementsModule` | Group broadcast announcements: rich text create/edit/delete, read-only feed for members.                                                                                                                |
| `NotificationsModule`      | In-app notification feed (create, list, mark-read), FCM token registration/deregistration, per-channel opt-out preferences, `notify()` dispatcher with pluggable channel strategies.                    |
| `TransientMessagesModule`  | Real-time ephemeral UI signals sent over FCM data messages (not persisted). Used for live UI updates that do not belong in the persistent notification feed.                                            |
| `FeedbackModule`           | User-submitted feedback flows.                                                                                                                                                                          |
| `LocationsModule`          | Location autocomplete and country/city data endpoints.                                                                                                                                                  |
| `TripsModule`              | Trip CRUD, lifecycle state machine, visibility, cover. Sub-modules: `announcements/`, `destinations/`, `groups/` (trip ↔ group associations).                                                           |
| `JobsModule`               | Scheduled job handlers triggered by Cloud Scheduler HTTP calls. Currently implements `PassportStatusJob` and `TripStatusJob`. See [Scheduled Jobs](#scheduled-jobs) below.                              |
| `HealthModule`             | `GET /health` liveness endpoint for Cloud Run health checks.                                                                                                                                            |

#### Planned (post-MVP — tracked in GitHub Issues)

| Module               | Domain Responsibility                                                   | Issue     |
| -------------------- | ----------------------------------------------------------------------- | --------- |
| `ParticipantsModule` | Trip participant invitations, join requests, role invitations, waitlist | Epic #7   |
| `ItineraryModule`    | Ordered itinerary items (transport, stays, activities)                  | Post-MVP  |
| `ExpensesModule`     | Shared expense ledger, splits, settlements                              | Post-MVP  |
| `ReservationsModule` | Booking records for stays and transport                                 | Post-MVP  |
| `EmailModule`        | Transactional email via GoDaddy SMTP, template system                   | Epic #125 |

> Module boundaries are intentionally strict. If a module needs data from another module's domain, it accesses it through an exported service — never by importing the other module's repository directly.

---

## Typical Module Structure

Top-level modules own a domain. Complex domains have sub-resource subdirectories, each with their own controller + service pair.

```
src/modules/trips/
├── trips.module.ts
├── trips.controller.ts
├── trips.controller.spec.ts
├── trips.service.ts
├── trips.service.spec.ts
├── schema/
│   ├── trips.schema.ts             # Drizzle table/column definitions
│   ├── trip-participants.schema.ts
│   └── trip-destinations.schema.ts
├── dto/
│   ├── create-trip.dto.ts
│   ├── update-trip.dto.ts
│   └── trip-response.dto.ts
├── announcements/                  # sub-resource: trip announcements
│   ├── trip-announcements.controller.ts
│   ├── trip-announcements.controller.spec.ts
│   ├── trip-announcements.service.ts
│   ├── trip-announcements.service.spec.ts
│   └── dto/
├── destinations/                   # sub-resource: trip destinations
│   ├── trips-destinations.controller.ts
│   └── ...
└── groups/                         # sub-resource: trip ↔ group associations
    ├── trips-groups.controller.ts
    └── ...
```

Notes:

- **No repository layer** — services query the database directly via the Drizzle client injected from `DatabaseModule`.
- **No `enums/` within modules** — all shared enums live in `packages/shared-types/src/enums/`.
- **Sub-resource naming:** `{parent}-{resource}.controller.ts` / `{parent}-{resource}.service.ts` (e.g. `group-members.controller.ts`, `users-travel-docs.service.ts`).
- **Response DTOs** that correspond to a shared interface must implement it (`class TripResponseDto implements TripSummary`).

---

## Cross-Cutting Concerns

These are handled in the `common/` folder and applied globally or selectively via NestJS interceptors, guards, and pipes.

| Concern                | Mechanism                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication         | `FirebaseAuthGuard` — verifies Firebase ID tokens via `admin.auth().verifyIdToken()`. Applied globally via `APP_GUARD`. Use `@Public()` to bypass on specific routes. |
| Authorization          | `RolesGuard` + `@Roles()` decorator. Use `@FirebaseOnly()` for endpoints that only require a valid Firebase token (no DB role check).                                 |
| Request validation     | `ValidationPipe` with class-validator                                                                                                                                 |
| Response serialization | `ClassSerializerInterceptor`                                                                                                                                          |
| Error handling         | Global `HttpExceptionFilter`                                                                                                                                          |
| Support admin audit    | `SupportAdminAuditInterceptor` — logs every write performed by a `SUPPORT_ADMIN` user to `support_admin_audit_log`.                                                   |
| Pagination             | Shared pagination DTO and utility                                                                                                                                     |
| API documentation      | `@nestjs/swagger` — OpenAPI spec + Swagger UI                                                                                                                         |

---

## API Design

- **Style:** REST
- **Versioning:** URI-based versioning (`/v1/...`) to allow non-breaking iteration.
- **Response format:** Consistent envelope for all responses:

```json
{
  "data": { ... },
  "meta": { "timestamp": "...", "version": "1" }
}
```

Error responses:

```json
{
  "error": {
    "code": "TRIP_NOT_FOUND",
    "message": "The requested trip does not exist.",
    "statusCode": 404
  }
}
```

---

## API Documentation (OpenAPI / Swagger)

The entire API surface is documented following the **OpenAPI 3.0** standard, enforced through `@nestjs/swagger`.

### How it works in NestJS

`@nestjs/swagger` reads NestJS decorators (`@Controller`, `@Get`, `@Body`, `@Param`, etc.) and class-validator annotations on DTOs to generate the OpenAPI spec automatically. Additional metadata is added via dedicated Swagger decorators where needed:

- `@ApiTags('trips')` — groups endpoints by domain in the Swagger UI.
- `@ApiOperation({ summary: '...' })` — describes what the endpoint does.
- `@ApiResponse({ status: 201, type: TripResponseDto })` — documents possible responses.
- `@ApiProperty()` on DTO fields — documents field types, constraints, and examples.
- `@ApiBearerAuth()` — marks endpoints that require a JWT token.

### Swagger UI

The interactive documentation interface is served at `/docs` in non-production environments. It allows any developer or reviewer to:

- Browse all available endpoints grouped by module.
- See full request/response schemas with field-level descriptions.
- Execute requests directly from the browser (with authentication).

In production, the Swagger UI is **disabled by default**. It can be re-enabled via an environment variable (`SWAGGER_ENABLED=true`) for internal or staging use.

### DTO as the contract

DTOs (`create-trip.dto.ts`, `trip-response.dto.ts`, etc.) are the single source of truth for both runtime validation (class-validator) and API documentation (Swagger). A field decorated with `@ApiProperty()` and `@IsString()` is validated at runtime and documented in the spec — no duplication.

### OpenAPI spec export

The raw `openapi.json` spec is exportable programmatically (`SwaggerModule.createDocument()`), enabling future tooling such as client SDK generation or contract testing.

---

## Scheduled Jobs

Because the backend runs on **Cloud Run** (which scales to zero), in-process schedulers like `@nestjs/schedule` are unreliable — a job does not fire if no instance is running. The correct pattern for GCP is to use **Cloud Scheduler** as the external trigger.

### Architecture

```
Cloud Scheduler
  └── HTTP POST → /v1/jobs/<job-name>   (NestJS, Cloud Run)
                       └── JobsModule handler
                             └── service logic + FCM / DB writes
```

Each scheduled job is a dedicated HTTP endpoint in `JobsModule`. Cloud Scheduler calls the endpoint on its configured interval, which wakes up the Cloud Run instance if needed.

### Security

Job endpoints are not authenticated via Firebase ID tokens. They are secured with a **shared secret header**:

```
X-Scheduler-Secret: <secret>
```

The secret is stored as a Cloud Run environment variable and injected into Cloud Scheduler requests. Any request missing or presenting the wrong header is rejected with `403`.

### Jobs

| Job                        | Endpoint                           | Schedule           | Status               | Description                                                                                                                                                                                              |
| -------------------------- | ---------------------------------- | ------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Passport expiry check      | `POST /v1/jobs/passport-expiry`    | Daily at 02:00 UTC | ✅ Implemented       | Scans `user_nationalities` for non-null `passport_expiry_date`. Transitions `ACTIVE` → `EXPIRING_SOON` (≤ 30 days) and `EXPIRING_SOON` → `EXPIRED` (≤ 0 days). Sends FCM notification per affected user. |
| Trip lifecycle transitions | `POST /v1/jobs/trip-transitions`   | Every 30 minutes   | 🔲 Planned (Epic #9) | Transitions `OPEN`/`CONFIRMED` → `IN_PROGRESS` and `IN_PROGRESS` → `COMPLETED` based on trip date boundaries. Triggers post-trip completion flow.                                                        |
| Key date reminders         | `POST /v1/jobs/key-date-reminders` | Daily at 09:00 UTC | 🔲 Planned (Epic #9) | Scans `trip_key_dates` where `reminder_enabled = true` and `date = tomorrow`. Sends FCM push to all confirmed participants.                                                                              |

### Module Structure

```
src/modules/jobs/
├── jobs.module.ts
├── passport-status.job.ts        # ✅ Implemented
├── passport-status.job.spec.ts
# trip-transitions.job.ts         🔲 Planned
# key-date-reminders.job.ts       🔲 Planned
```

Job handlers are idempotent — running a job twice for the same data produces the same result. Each handler logs its outcome (rows affected, notifications sent) as structured logs visible in Cloud Logging.

---

## Database Access

See [`database-design.md`](./database-design.md) for schema and design decisions, and [`tech-stack.md`](../overview/tech-stack.md) for the full Drizzle ORM rationale.

**Drizzle ORM** is the chosen data access layer. Each module owns its Drizzle schema file (`schema/`) defining the tables and columns for that domain. The `DrizzleModule` is a shared provider that exposes the database connection across all modules without them needing to manage it directly.
