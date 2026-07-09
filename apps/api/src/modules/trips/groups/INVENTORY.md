# Inventory: groups

---

## trips-groups.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Post` for routing and parameter handling
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags` for OpenAPI documentation decorators
- `@/common/decorators/current-user.decorator` — `CurrentUser` decorator to extract the authenticated user from the request
- `@/types/express` — `AuthenticatedUser` type for the resolved user object
- `./trips-groups.service` — `TripsGroupsService` for business logic delegation
- `./dto/trip-group-response.dto` — `TripGroupResponseDto` response shape for organizer-facing group-trip link records
- `./dto/trip-linked-group.dto` — `TripLinkedGroupDto` response shape for public linked-group listing
- `./dto/add-trip-group.dto` — `AddTripGroupDto` request body for linking a group to a trip

### Definitions

- `TripsGroupsController` (controller) — REST controller under `v1/trips` exposing four endpoints: public linked-group listing, organizer group listing, link a group, and unlink a group

### Exports

- `TripsGroupsController` — named

---

## trips-groups.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS module test harness
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` for constructing mock user fixtures
- `./trips-groups.controller` — `TripsGroupsController` (subject under test)
- `./trips-groups.service` — `TripsGroupsService` (mocked provider)
- `./dto/trip-group-response.dto` — `TripGroupResponseDto` type for mock response fixture
- `@/types/express` — `AuthenticatedUser` type for mock user fixture

### Definitions

- `mockUser` (const) — fixture representing an authenticated `PlatformRole.USER`
- `mockGroupTripResponse` (const) — fixture for a `TripGroupResponseDto` response
- `TripsGroupsController` describe block — unit tests verifying that each controller method delegates correctly to the service

### Exports

- _(none)_

---

## trips-groups.service.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `Logger`, `NotFoundException` for DI, logging, and error handling
- `drizzle-orm` — `and`, `eq`, `inArray`, `isNull` for composing Drizzle query conditions
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` for injecting the Drizzle database client
- `@/types/express` — `AuthenticatedUser` type for authenticated user parameter
- `@/modules/assets/schema/assets.schema` — `assets` Drizzle table reference for cover asset lookups
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` for resolving asset rows to public URLs
- `@/modules/assets/asset.utils` — `assetRowToAsset` mapper from raw DB row to domain asset object
- `@/modules/groups/schema/groups.schema` — `groups` Drizzle table reference
- `@/modules/trips/schema/group-trips.schema` — `groupTrips` Drizzle table reference for trip-group association records
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table reference for trip existence checks
- `@/modules/trips/trips.service` — `TripsService` for `assertOrganizerRole` authorization guard
- `./dto/trip-group-response.dto` — `TripGroupResponseDto` type for organizer-facing response
- `./dto/trip-linked-group.dto` — `TripLinkedGroupDto` type for public linked-group response
- `./dto/add-trip-group.dto` — `AddTripGroupDto` type for link-creation request

### Definitions

- `TripsGroupsService` (service) — manages trip-group associations; exposes `listLinkedGroups` (public, resolves cover URLs), `listTripGroups` (organizer only), `addTripGroup` (idempotent, organizer only), `removeTripGroup` (organizer only), and a private `mapTripGroup` row-to-DTO mapper

### Exports

- `TripsGroupsService` — named

---

## trips-groups.service.spec.ts

### Imports

- `@nestjs/common` — `ForbiddenException`, `NotFoundException` for asserting thrown errors
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test harness
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`, `TripVisibility` for mock fixtures
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for mocking the DB client
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (mocked)
- `./trips-groups.service` — `TripsGroupsService` (subject under test)
- `@/modules/trips/trips.service` — `TripsService` (mocked for `assertOrganizerRole`)
- `@/types/express` — `AuthenticatedUser` type for mock user fixture

### Definitions

- `mockUser` (const) — fixture for an authenticated user
- `mockTripRow` (const) — fixture for a trips DB row
- `mockGroupRow` (const) — fixture for a groups DB row
- `mockGroupTripRow` (const) — fixture for a groupTrips DB row
- `TripsGroupsService` describe block — unit tests covering `listLinkedGroups`, `listTripGroups`, `addTripGroup`, and `removeTripGroup` including NotFoundException and ForbiddenException paths

### Exports

- _(none)_
