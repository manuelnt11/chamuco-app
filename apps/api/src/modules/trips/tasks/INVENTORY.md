# Inventory: tasks

---

## trips-tasks.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module setup
- `@chamuco/shared-types` — `TripTaskScope` enum for fixture data
- `./trips-tasks.controller` — `TripsTasksController` (subject under test)
- `./trips-tasks.service` — `TripsTasksService` (mocked dependency)
- `./dto/create-trip-task.dto` — `CreateTripTaskDto` type
- `./dto/update-trip-task.dto` — `UpdateTripTaskDto` type
- `./dto/set-trip-task-completion.dto` — `SetTripTaskCompletionDto` type
- `./dto/trip-task-response.dto` — `TripTaskResponseDto` type
- `@/test/fixtures/user.fixture` — `makeAuthenticatedUser` for the current-user param

### Definitions

- `mockUser` (const) — stub `AuthenticatedUser` fixture used across all test cases
- `mockTaskResponse` (const) — stub `TripTaskResponseDto` fixture (PERSONAL scope, not completed, `completedByUsername: null`)
- `TripsTasksController` describe block — five delegation tests verifying each controller method forwards args to the corresponding service method and returns its result. Controller is scope-agnostic — no ORGANIZER-specific behavior lives here, only in the service

### Exports

- none (test file)

---

## trips-tasks.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` for HTTP routing and request-binding decorators
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBearerAuth`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags` for OpenAPI documentation
- `@/common/decorators/current-user.decorator` — `CurrentUser` custom parameter decorator that extracts the authenticated user from the request
- `@/types/express` — `AuthenticatedUser` type for typed request user
- `./trips-tasks.service` — `TripsTasksService` for business logic delegation
- `./dto/create-trip-task.dto` — `CreateTripTaskDto`
- `./dto/update-trip-task.dto` — `UpdateTripTaskDto`
- `./dto/set-trip-task-completion.dto` — `SetTripTaskCompletionDto`
- `./dto/trip-task-response.dto` — `TripTaskResponseDto`

### Definitions

- `TripsTasksController` (controller) — REST controller mounted at `v1/trips`; exposes five endpoints: `GET :id/tasks` (list), `POST :id/tasks` (create), `PATCH :id/tasks/:taskId` (rename), `PATCH :id/tasks/:taskId/completion` (set completion), `DELETE :id/tasks/:taskId` (delete)

### Exports

- `TripsTasksController` — named

---

## trips-tasks.service.spec.ts

### Imports

- `@nestjs/common` — `ForbiddenException`, `NotFoundException` for exception-type assertions
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module setup
- `drizzle-orm/pg-core` — `PgDialect` used to render the `listTasks` visibility `where` clause to SQL text for the visibility-scope regression test
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripTaskScope`, `TripVisibility` for fixture data and status-based test scenarios
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for providing the mock DB client
- `./trips-tasks.service` — `TripsTasksService` (subject under test)
- `@/modules/trips/trips.service` — `TripsService` (mocked; `assertOrganizerRole` and `isOrganizerRole` are exercised)
- `./dto/create-trip-task.dto` — `CreateTripTaskDto` type
- `./dto/update-trip-task.dto` — `UpdateTripTaskDto` type
- `./dto/set-trip-task-completion.dto` — `SetTripTaskCompletionDto` type
- `@/test/fixtures/user.fixture` — `makeAuthenticatedUser`

### Definitions

- `mockUser` (const) — stub `AuthenticatedUser` fixture
- `mockTripRow` (const) — stub trip database row in `OPEN` status
- `mockActiveParticipant` (const) — stub trip-participant row with `PARTICIPANT` role and `CONFIRMED` status
- `mockSharedTask` (const) — stub `trip_tasks` row with `scope: SHARED`, `completedBy: null`
- `mockPersonalTask` (const) — stub `trip_tasks` row with `scope: PERSONAL`, `createdBy: mockUser.id`, `completedBy: null`
- `mockOrganizerTask` (const) — stub `trip_tasks` row with `scope: ORGANIZER`, `completedBy: null`
- `mockSelect`/`mockSelectFrom`/`mockSelectLeftJoin`/`mockSelectWhere`/`mockSelectOrderBy` (consts) — mock chain for `db.select().from().leftJoin().where().orderBy()`, replacing `db.query.tripTasks.findMany` now that `listTasks` joins `users` directly; default resolves `[sharedTask, personalTask]` each with `completedByUsername: null`
- `TripsTasksService` describe block — grouped tests for `listTasks`, `createTask`, `updateTaskTitle`, `setCompletion`, `deleteTask`, covering SHARED (organizer-gated create, per-participant completion), PERSONAL (creator-gated, never records `completedBy`), and ORGANIZER (organizer-gated create/completion/manage, single shared `completedAt` + `completedBy` recording which organizer completed it, cleared on un-complete regardless of who set it) branches, `listTasks` including/excluding ORGANIZER tasks based on the caller's organizer status and resolving `completedByUsername` from the joined row, a regression test asserting (via `PgDialect().sqlToQuery` on the captured `where` argument) that the `createdBy` visibility clause only ever appears ANDed with `scope = PERSONAL`, never as a bare OR branch, `updateTaskTitle` resolving `completedByUsername` for an already-completed ORGANIZER task, the COMPLETED/CANCELLED trip-mutable gate, and (for `updateTaskTitle`/`setCompletion`/`deleteTask`) that trip-not-found/not-a-participant is rejected _before_ the task is loaded

### Exports

- none (test file)

---

## trips-tasks.service.ts

### Imports

- `@nestjs/common` — `ForbiddenException`, `Inject`, `Injectable`, `NotFoundException`
- `drizzle-orm` — `and`, `asc`, `eq`, `inArray`, `or` for composing Drizzle query expressions
- `@chamuco/shared-types` — `TripStatus`, `TripTaskScope` enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/types/express` — `AuthenticatedUser` type
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table definition
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` Drizzle table definition
- `@/modules/trips/schema/trip-tasks.schema` — `tripTasks`, `tripTaskCompletions` Drizzle table definitions
- `@/modules/users/schema/users.schema` — `users` table reference for resolving `completedByUsername`
- `@/modules/trips/participants/trip-participants.constants` — `ACTIVE_STATUSES`
- `@/modules/trips/trips.service` — `TripsService` for `assertOrganizerRole`/`isOrganizerRole` delegation
- `./dto/create-trip-task.dto` — `CreateTripTaskDto` type
- `./dto/update-trip-task.dto` — `UpdateTripTaskDto` type
- `./dto/set-trip-task-completion.dto` — `SetTripTaskCompletionDto` type
- `./dto/trip-task-response.dto` — `TripTaskResponseDto` type

### Definitions

- `TripsTasksService` (service) — injectable service exposing `listTasks`, `createTask`, `updateTaskTitle`, `setCompletion`, `deleteTask`. `listTasks` builds its visibility filter as `SHARED` OR (`PERSONAL` AND own `createdBy`) OR (`ORGANIZER`, only when `isOrganizerRole` is true) — the `createdBy` check is scoped to `PERSONAL` specifically so a task the caller created under a different scope (e.g. an `ORGANIZER` task made while still an organizer) never leaks through once they lose that role. It resolves `completedByUsername` via a `leftJoin(users, ...)` in the same query rather than a second round-trip. `updateTaskTitle`/`setCompletion`/`deleteTask` check `assertActiveParticipant` + `assertTripMutable` _before_ loading the task via `findTaskOrThrow`, so a non-participant never learns whether a given task exists
- `findTaskOrThrow` (function) — private guard; fetches a `trip_tasks` row scoped to the trip or throws `NotFoundException`
- `assertCanManageTask` (function) — private guard; SHARED and ORGANIZER tasks require `assertOrganizerRole`, PERSONAL tasks require the caller to be `createdBy`
- `setSingleCompletion` (function) — private helper; updates `trip_tasks.completed_at` and `completed_by` directly (single shared status) — used by both PERSONAL (`completedBy` always `null`) and ORGANIZER (`completedBy` set to the completing organizer, cleared on un-complete regardless of who set it) completion
- `hasSharedCompletion` (function) — private helper; checks whether a `trip_task_completions` row exists for a task/user pair (SHARED only)
- `resolveCompleterUsername` (function) — private helper; resolves a single `completedBy` id to a username via `db.query.users.findFirst`, used by `updateTaskTitle` (the one path that can't use a join, since it runs against an `UPDATE ... RETURNING`)
- `assertActiveParticipant` (function) — private guard; verifies trip exists and caller holds an ACCEPTED/CONFIRMED `trip_participants` row; returns the trip row
- `assertTripMutable` (function) — private guard; throws `ForbiddenException` when trip status is COMPLETED or CANCELLED
- `mapTask` (function) — private mapper; converts a `tripTasks` Drizzle row plus a resolved `completed` boolean and `completedByUsername` into `TripTaskResponseDto`

### Exports

- `TripsTasksService` — named
