# Chamuco App — Backend Architecture

**Status:** Proposed
**Last Updated:** 2026-03-19

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

## Database Access

See [`database-design.md`](./database-design.md) for schema and design decisions, and [`tech-stack.md`](../overview/tech-stack.md) for the full Drizzle ORM rationale.

**Drizzle ORM** is the chosen data access layer. Each module owns its Drizzle schema file (`schema/`) defining the tables and columns for that domain. The `DrizzleModule` is a shared provider that exposes the database connection across all modules without them needing to manage it directly.
