# Inventory: destinations

---

## trips-destinations.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module setup
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` enums for mock fixture data
- `./trips-destinations.controller` — `TripsDestinationsController` (subject under test)
- `./trips-destinations.service` — `TripsDestinationsService` (mocked dependency)
- `./dto/create-destination.dto` — `CreateDestinationDto` type
- `./dto/update-destination.dto` — `UpdateDestinationDto` type
- `./dto/reorder-destinations.dto` — `ReorderDestinationsDto` type
- `./dto/destination-response.dto` — `DestinationResponseDto`, `DestinationWriteResponseDto` types
- `@/types/express` — `AuthenticatedUser` type

### Definitions

- `mockUser` (const) — stub `AuthenticatedUser` fixture used across all test cases
- `mockDestResponse` (const) — stub `DestinationResponseDto` fixture (no `requiresConfirmation`)
- `mockDestWriteResponse` (const) — stub `DestinationWriteResponseDto` fixture (extends `mockDestResponse` with `requiresConfirmation: false`)
- `TripsDestinationsController` describe block — five delegation tests verifying each controller method forwards args to the corresponding service method and returns its result

### Exports

- none (test file)

---

## trips-destinations.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` for HTTP routing and request-binding decorators
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBearerAuth`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnprocessableEntityResponse` for OpenAPI documentation
- `@/common/decorators/current-user.decorator` — `CurrentUser` custom parameter decorator that extracts the authenticated user from the request
- `@/types/express` — `AuthenticatedUser` type for typed request user
- `./trips-destinations.service` — `TripsDestinationsService` for business logic delegation
- `./dto/create-destination.dto` — `CreateDestinationDto`
- `./dto/update-destination.dto` — `UpdateDestinationDto`
- `./dto/reorder-destinations.dto` — `ReorderDestinationsDto`
- `./dto/destination-response.dto` — `DestinationResponseDto`, `DestinationWriteResponseDto`

### Definitions

- `TripsDestinationsController` (controller) — REST controller mounted at `v1/trips`; exposes five endpoints: `GET :id/destinations` (list), `POST :id/destinations` (add), `PATCH :id/destinations/reorder` (reorder), `PATCH :id/destinations/:destId` (update), `DELETE :id/destinations/:destId` (delete)

### Exports

- `TripsDestinationsController` — named

---

## trips-destinations.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `NotFoundException`, `UnprocessableEntityException` for exception-type assertions
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module setup
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`, `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripVisibility` for fixture data and status-based test scenarios
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for providing the mock DB client
- `./trips-destinations.service` — `TripsDestinationsService` (subject under test)
- `@/modules/trips/trips.service` — `TripsService` (mocked; only `assertOrganizerRole` is exercised)
- `./dto/create-destination.dto` — `CreateDestinationDto` type
- `./dto/update-destination.dto` — `UpdateDestinationDto` type
- `./dto/reorder-destinations.dto` — `ReorderDestinationsDto` type
- `@/types/express` — `AuthenticatedUser` type

### Definitions

- `mockUser` (const) — stub `AuthenticatedUser` fixture
- `mockTripRow` (const) — stub trip database row in `DRAFT` status
- `mockOrganizerParticipant` (const) — stub trip-participant row with `ORGANIZER` role and `CONFIRMED` status
- `mockDestRow` (const) — stub destination database row at position 1
- `TripsDestinationsService` describe block — grouped tests for `listDestinations` (4 cases), `addDestination` (8 cases), `updateDestination` (7 cases), `deleteDestination` (7 cases), `reorderDestinations` (8 cases)

### Exports

- none (test file)

---

## trips-destinations.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `Inject`, `Injectable`, `NotFoundException`, `UnprocessableEntityException`
- `drizzle-orm` — `and`, `asc`, `count`, `eq`, `gt`, `inArray`, `max`, `sql` for composing Drizzle query expressions
- `@chamuco/shared-types` — `TripStatus` enum for status guard checks
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/types/express` — `AuthenticatedUser` type
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table definition
- `@/modules/trips/schema/trip-destinations.schema` — `tripDestinations` Drizzle table definition
- `@/modules/trips/trips.service` — `TripsService` for `assertOrganizerRole` delegation
- `./dto/create-destination.dto` — `CreateDestinationDto` type
- `./dto/update-destination.dto` — `UpdateDestinationDto` type
- `./dto/reorder-destinations.dto` — `ReorderDestinationsDto` type
- `./dto/destination-response.dto` — `DestinationResponseDto`, `DestinationWriteResponseDto` types

### Definitions

- `TripsDestinationsService` (service) — injectable service exposing `listDestinations`, `addDestination`, `updateDestination`, `deleteDestination`, `reorderDestinations`
- `assertDestinationWrite` (function) — private guard; verifies trip exists, is not COMPLETED/CANCELLED, and caller holds ORGANIZER or CO_ORGANIZER role; returns `{ trip, requiresConfirmation }`
- `mapDestination` (function) — private mapper; converts a `tripDestinations` Drizzle row to `DestinationResponseDto` with ISO-string `createdAt`

### Exports

- `TripsDestinationsService` — named
