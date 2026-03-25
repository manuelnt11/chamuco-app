# Chamuco App — Backend Architecture

**Status:** Proposed
**Last Updated:** 2026-03-25

---

## Framework

The backend is built with **NestJS**, a Node.js framework that enforces a modular, opinionated structure. Its decorator-driven design and built-in dependency injection make it well-suited for applications with clearly separated domain modules.

---

## Module Design Philosophy

Each feature domain is encapsulated in its own NestJS module. A module owns everything related to its domain and does not expose internal implementation details to other modules.

### Module Boundaries

| Module | Domain Responsibility |
|---|---|
| `AuthModule` | Authentication, token issuance, session management |
| `UsersModule` | User accounts, profiles, privacy settings |
| `GroupsModule` | User groups, group membership |
| `TripsModule` | Trip creation, lifecycle, status management |
| `ParticipantsModule` | Trip participant management, invitation logic, confirmation rules |
| `ItineraryModule` | Ordered sequence of movements, stays, and activities within a trip |
| `MovementsModule` | Transport segments (flights, buses, cars, etc.) |
| `StaysModule` | Accommodation bookings and stay details |
| `ActivitiesModule` | Planned activities and experiences |
| `ReservationsModule` | Booking status tracking for stays and movements |
| `ExpensesModule` | Shared expense recording, splitting, and settlement |
| `CommunityModule` | Chats, channels, broadcast messaging |
| `NotificationsModule` | Push/email/in-app notifications |
| `SchedulerModule` | Scheduled job endpoints triggered by Cloud Scheduler |
| `LocalizationModule` | i18n and currency utilities |

> Module boundaries are intentionally strict. If a module needs data from another module's domain, it accesses it through an exported service — never by importing the other module's repository directly.

---

## Typical Module Structure

```
src/modules/trips/
├── trips.module.ts
├── trips.controller.ts
├── trips.service.ts
├── trips.repository.ts         # Data access layer (Drizzle queries)
├── schema/
│   └── trips.schema.ts         # Drizzle table/column definitions for this domain
├── dto/
│   ├── create-trip.dto.ts
│   ├── update-trip.dto.ts
│   └── trip-response.dto.ts
├── enums/
│   └── trip-status.enum.ts
└── trips.spec.ts               # Unit tests
```

---

## Cross-Cutting Concerns

These are handled in the `common/` folder and applied globally or selectively via NestJS interceptors, guards, and pipes.

| Concern | Mechanism |
|---|---|
| Authentication | `JwtAuthGuard` using Google SSO / Passkeys |
| Authorization | Role-based `RolesGuard` + permission decorators |
| Request validation | `ValidationPipe` with class-validator |
| Response serialization | `ClassSerializerInterceptor` |
| Error handling | Global `HttpExceptionFilter` |
| Logging | Custom `LoggingInterceptor` (structured logs for GCP) |
| Pagination | Shared pagination DTO and utility |
| API documentation | `@nestjs/swagger` — OpenAPI spec + Swagger UI |

---

## API Design

- **Style:** REST
- **Versioning:** URI-based versioning (`/api/v1/...`) to allow non-breaking iteration.
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

The interactive documentation interface is served at `/api/docs` in non-production environments. It allows any developer or reviewer to:

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
  └── HTTP POST → /api/v1/jobs/<job-name>   (NestJS, Cloud Run)
                       └── SchedulerModule handler
                             └── service logic + FCM / DB writes
```

Each scheduled job is a dedicated HTTP endpoint in the `SchedulerModule`. Cloud Scheduler calls the endpoint on its configured interval, which wakes up the Cloud Run instance if needed.

### Security

Job endpoints are not authenticated via Firebase ID tokens. They are secured with a **shared secret header**:

```
X-Scheduler-Secret: <secret>
```

The secret is stored as a Cloud Run environment variable and injected into Cloud Scheduler requests. Any request missing or presenting the wrong header is rejected with `403`.

### Jobs in MVP

| Job | Endpoint | Schedule | Description |
|---|---|---|---|
| Passport expiry check | `POST /api/v1/jobs/passport-expiry` | Daily at 02:00 UTC | Scans `user_nationalities` for records with non-null `passport_expiry_date`. Transitions `ACTIVE` → `EXPIRING_SOON` (≤ 30 days) and `EXPIRING_SOON` → `EXPIRED` (≤ 0 days). Sends FCM notification for each affected user. |
| Trip lifecycle transitions | `POST /api/v1/jobs/trip-transitions` | Every 30 minutes | Transitions `OPEN`/`CONFIRMED` → `IN_PROGRESS` for trips whose `start_date` boundary has passed, and `IN_PROGRESS` → `COMPLETED` for trips whose `end_date` boundary has passed. Triggers the post-trip completion flow for each newly completed trip. |
| Key date reminders | `POST /api/v1/jobs/key-date-reminders` | Daily at 09:00 UTC | Scans `trip_key_dates` where `reminder_enabled = true` and `date = tomorrow`. Sends FCM push notification to all confirmed participants of each matching trip. |

### Job Handler Structure

Each job handler lives in `SchedulerModule` and follows the same pattern:

```
src/modules/scheduler/
├── scheduler.module.ts
├── scheduler.controller.ts       # Exposes POST /api/v1/jobs/* endpoints
├── jobs/
│   ├── passport-expiry.job.ts
│   ├── trip-transitions.job.ts
│   └── key-date-reminders.job.ts
└── scheduler.guard.ts            # Validates X-Scheduler-Secret header
```

Job handlers are idempotent — running a job twice for the same data produces the same result. Each handler logs its outcome (rows affected, notifications sent) as structured logs visible in Cloud Logging.

---

## Database Access

See [`database-design.md`](./database-design.md) for schema and design decisions, and [`tech-stack.md`](../overview/tech-stack.md) for the full Drizzle ORM rationale.

**Drizzle ORM** is the chosen data access layer. Each module owns its Drizzle schema file (`schema/`) defining the tables and columns for that domain. The `DrizzleModule` is a shared provider that exposes the database connection across all modules without them needing to manage it directly.
