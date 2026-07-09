# Inventory: trips

---

## trips.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`, `TripRole`, `TripStatus`, `TripVisibility` (shared enums)
- `./trips.controller` — `TripsController` (subject under test)
- `./trips.service` — `TripsService` (mocked dependency)
- `./discovery/trip-discovery.service` — `TripDiscoveryService` (mocked dependency)
- `./dto/create-trip.dto` — `CreateTripDto` (type, request fixture)
- `./dto/update-trip.dto` — `UpdateTripDto` (type, request fixture)
- `./dto/transition-trip-status.dto` — `TransitionTripStatusDto` (type, request fixture)
- `./dto/trip-response.dto` — `TripResponseDto` (type, response fixture)
- `./dto/my-trip-list-item-response.dto` — `MyTripListItemResponseDto` (type, response fixture)
- `@/types/express` — `AuthenticatedUser` (type, user fixture)

### Definitions

- `mockUser` (const) — `AuthenticatedUser` fixture shared across all test cases
- `mockListItemResponse` (const) — `MyTripListItemResponseDto` fixture for list endpoint tests
- `mockResponse` (const) — `TripResponseDto` fixture for single-trip endpoint tests
- `describe('TripsController')` — test suite verifying all six controller methods delegate correctly to `TripsService` and `TripDiscoveryService`

### Exports

- none

---

## trips.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`, `Query` (routing and HTTP decorators)
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBearerAuth`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags` (OpenAPI decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (custom param decorator for authenticated user)
- `@/types/express` — `AuthenticatedUser` (type)
- `./trips.service` — `TripsService`
- `./dto/create-trip.dto` — `CreateTripDto`
- `./dto/update-trip.dto` — `UpdateTripDto`
- `./dto/trip-response.dto` — `TripResponseDto`
- `./dto/my-trip-list-item-response.dto` — `MyTripListItemResponseDto`
- `./dto/transition-trip-status.dto` — `TransitionTripStatusDto`
- `./discovery/trip-discovery.service` — `TripDiscoveryService`
- `./discovery/dto/search-trips-query.dto` — `SearchTripsQueryDto`
- `./discovery/dto/trip-search-result.dto` — `TripSearchResponseDto`

### Definitions

- `TripsController` (controller) — REST controller at `v1/trips`; exposes `getMyTrips` (GET /), `createTrip` (POST /), `searchTrips` (GET /search), `getTrip` (GET /:id), `updateTrip` (PATCH /:id), `deleteTrip` (DELETE /:id), `transitionStatus` (PATCH /:id/status)

### Exports

- `TripsController` — named

---

## trips.module.ts

### Imports

- `@nestjs/common` — `Module`
- `@/modules/notifications/notifications.module` — `NotificationsModule`
- `./trips.controller` — `TripsController`
- `./destinations/trips-destinations.controller` — `TripsDestinationsController`
- `./groups/trips-groups.controller` — `TripsGroupsController`
- `./announcements/trip-announcements.controller` — `TripAnnouncementsController`
- `./participants/trip-participants.controller` — `TripParticipantsController`
- `./invitations/trip-invitations.controller` — `TripInvitationsController`
- `./join-requests/trip-join-requests.controller` — `TripJoinRequestsController`
- `./trips.service` — `TripsService`
- `./destinations/trips-destinations.service` — `TripsDestinationsService`
- `./groups/trips-groups.service` — `TripsGroupsService`
- `./announcements/trip-announcements.service` — `TripAnnouncementsService`
- `./participants/trip-participants.service` — `TripParticipantsService`
- `./invitations/trip-invitations.service` — `TripInvitationsService`
- `./join-requests/trip-join-requests.service` — `TripJoinRequestsService`
- `./discovery/trip-discovery.service` — `TripDiscoveryService`

### Definitions

- `TripsModule` (module) — NestJS module aggregating all trip controllers and services (core, destinations, groups, announcements, participants, invitations, join-requests, discovery); imports `NotificationsModule`; exports `TripsService`

### Exports

- `TripsModule` — named

---

## trips.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `NotFoundException` (exception classes asserted in tests)
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `AuthProvider`, `NotificationChannel`, `NotificationType`, `PlatformRole`, `ProfileVisibility`, `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripVisibility`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for mocked DB)
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (mocked)
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` (mocked)
- `@/modules/notifications/notifications.service` — `NotificationsService` (mocked)
- `./trips.service` — `TripsService` (subject under test)
- `./dto/create-trip.dto` — `CreateTripDto` (type)
- `./dto/update-trip.dto` — `UpdateTripDto` (type)
- `./dto/transition-trip-status.dto` — `TransitionTripStatusDto` (type)
- `@/types/express` — `AuthenticatedUser` (type)

### Definitions

- `mockUser` (const) — `AuthenticatedUser` fixture
- `mockTripRow` (const) — raw DB trip row fixture
- `mockCoOrganizerParticipantAccepted` (const) — mock CO_ORGANIZER participant row with ACCEPTED status
- `mockOrganizerParticipant` (const) — mock ORGANIZER participant row with CONFIRMED status
- `createDto` (const) — `CreateTripDto` fixture used across createTrip tests
- `describe('TripsService')` — test suite covering createTrip, getTrip, updateTrip, deleteTrip, transitionStatus (including DRAFT→OPEN group member invitation logic), and getMyTrips with cover URL and participant count enrichment

### Exports

- none

---

## trips.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException`
- `drizzle-orm` — `and`, `count`, `eq`, `inArray` (query builder utilities)
- `@chamuco/shared-types` — `GroupMemberStatus`, `NotificationChannel`, `NotificationType`, `PlatformRole`, `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripVisibility`
- `@/modules/groups/schema/group-members.schema` — `groupMembers` (Drizzle table reference)
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `@/modules/trips/schema/trip-announcements.schema` — `tripAnnouncements` (Drizzle table reference)
- `@/modules/trips/schema/group-trips.schema` — `groupTrips` (Drizzle table reference)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient`
- `@/modules/assets/schema/assets.schema` — `assets` (Drizzle table reference)
- `@/modules/assets/asset-resolver.service` — `AssetResolverService`
- `@/modules/assets/asset.utils` — `assetRowToAsset` (converts DB row to asset domain object)
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService`
- `@/modules/cloud-storage/cloud-storage.constants` — `PUBLIC_OBJECT_PREFIXES` (set of GCS key prefixes requiring makePublic)
- `@/types/express` — `AuthenticatedUser` (type)
- `./schema/trips.schema` — `trips` (Drizzle table reference)
- `./schema/trip-destinations.schema` — `tripDestinations` (Drizzle table reference)
- `./schema/trip-participants.schema` — `tripParticipants` (Drizzle table reference)
- `./dto/create-trip.dto` — `CreateTripDto` (type)
- `./dto/update-trip.dto` — `UpdateTripDto` (type)
- `./dto/trip-response.dto` — `TripResponseDto` (type)
- `./dto/my-trip-list-item-response.dto` — `MyTripListItemResponseDto` (type)
- `./dto/transition-trip-status.dto` — `TransitionTripStatusDto` (type)
- `./participants/trip-participants.constants` — `ACTIVE_STATUSES` (array of active participant statuses)

### Definitions

- `FEEDBACK_WINDOW_DAYS` (const) — feedback window duration in days, read from `TRIP_FEEDBACK_WINDOW_DAYS` env var (default 7)
- `VALID_TRANSITIONS` (const) — state machine map of `TripStatus → TripStatus[]` defining all allowed status transitions
- `TripsService` (service) — injectable service managing trip lifecycle; public methods: `getMyTrips` (list user's trips enriched with cover URL, participant count, and role), `createTrip` (transactional insert of asset + trip + organizer participant), `getTrip` (fetch single trip), `updateTrip` (patch trip fields with capacity/immutability/visibility guards and cover asset swap), `deleteTrip` (hard delete for DRAFT or SUPPORT_ADMIN), `transitionStatus` (enforces VALID_TRANSITIONS, checks destination count for DRAFT→OPEN, triggers group member invitations), `assertOrganizerRole` (shared ORGANIZER/CO_ORGANIZER guard used by other sub-resource services); private methods: `inviteLinkedGroupMembers`, `fetchAndMapTrip`, `mapTrip`

### Exports

- `TripsService` — named
