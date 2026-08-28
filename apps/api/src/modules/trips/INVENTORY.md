# Inventory: trips

---

## `caller-language.util.spec.ts`

### Imports

- `./caller-language.util` — `resolveCallerLanguage` function under test

### Definitions

- `resolveCallerLanguage()` test suite — covers: returns the lowercased language preference, defaults to `'en'` with no preferences row, defaults to `'en'` when the row has no language set

### Exports

- _(none — test file)_

---

## `caller-language.util.ts`

### Imports

- `drizzle-orm` — `eq`
- `@/database/drizzle.provider` — `DrizzleClient` type
- `@/modules/users/schema/user-preferences.schema` — `userPreferences` table reference

### Definitions

- `resolveCallerLanguage(db, userId)` (function) — looks up the caller's `user_preferences.language`, lowercased, defaulting to `'en'`. Shared by every generated-document endpoint (`TripParticipantsService.exportParticipants`, `TripItineraryPdfService.generate`) so the caller's app language drives the document's copy.

### Exports

- `resolveCallerLanguage` — named

---

## `trip-completion.util.spec.ts`

### Imports

- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType` enums for assertions
- `./trip-completion.util` — `notifyTripCompleted` function under test

### Definitions

- `notifyTripCompleted()` test suite — covers: notifies all active participants, excludes a given user, no-ops when no active participants remain, logs (not throws) on `notifyMany` rejection

### Exports

- _(none — test file)_

---

## `trip-completion.util.ts`

### Imports

- `@nestjs/common` — `Logger` for logging notify failures
- `drizzle-orm` — `and`, `eq`, `inArray` query helpers
- `@chamuco/shared-types` — `NotificationChannel`, `NotificationType` enums
- `@/database/drizzle.provider` — `DrizzleClient` type
- `@/modules/notifications/notifications.service` — `NotificationsService` type
- `@/modules/trips/participants/trip-participants.constants` — `ACTIVE_STATUSES`
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` table reference

### Definitions

- `notifyTripCompleted(db, notifications, tripId, tripName, excludeUserId?)` (function) — shared logic for dispatching `TRIP_COMPLETED`: looks up the trip's `ACTIVE_STATUSES` participants (optionally excluding one user), sends via `notifyMany`, and logs (not throws) on failure. Used by both `TripsService.transitionStatus` and `TripStatusJob.completeTrip` — the two places a trip can become `COMPLETED`.

### Exports

- `notifyTripCompleted` — named

---

## `trips.controller.spec.ts`

### Imports

- `@nestjs/common` — `StreamableFile` for asserting the PDF export response type
- `@nestjs/testing` — `Test`, `TestingModule` for building isolated test modules
- `express` — `Response` type for the mocked response object in export tests
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`, `TripRole`, `TripStatus`, `TripVisibility` enums used in mock data and DTOs
- `./trips.controller` — `TripsController` (system under test)
- `./trips.service` — `TripsService` (mocked provider)
- `./discovery/trip-discovery.service` — `TripDiscoveryService` (mocked provider)
- `./join-requests/trip-join-requests.service` — `TripJoinRequestsService` (mocked provider)
- `./itinerary-pdf/trip-itinerary-pdf.service` — `TripItineraryPdfService` (mocked provider)
- `./dto/create-trip.dto` — `CreateTripDto` type for test input
- `./dto/update-trip.dto` — `UpdateTripDto` type for test input
- `./dto/transition-trip-status.dto` — `TransitionTripStatusDto` type for test input
- `./dto/trip-response.dto` — `TripResponseDto` type for mock response
- `./dto/my-trip-list-item-response.dto` — `MyTripListItemResponseDto` type for mock list response
- `./join-requests/dto/my-trip-join-request-response.dto` — `MyTripJoinRequestResponseDto` type for mock join request response
- `@/types/express` — `AuthenticatedUser` type for mock user

### Definitions

- `mockUser` (const) — mock `AuthenticatedUser` fixture used across all controller tests
- `mockListItemResponse` (const) — mock `MyTripListItemResponseDto` fixture for list endpoint tests
- `mockResponse` (const) — mock `TripResponseDto` fixture for single-trip endpoint tests
- `TripsController` (describe block) — test suite covering all controller methods with mocked service delegates, including `GET /v1/trips/:id/itinerary/pdf` delegating to `TripItineraryPdfService`

### Exports

- none

---

## `trips.controller.ts`

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`, `Query`, `Res`, `StreamableFile` decorators and utilities
- `express` — `Response` type for the itinerary PDF response
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBearerAuth`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiProduces`, `ApiResponse`, `ApiTags` for OpenAPI documentation
- `@/common/decorators/current-user.decorator` — `CurrentUser` parameter decorator
- `@/types/express` — `AuthenticatedUser` type for authenticated request context
- `./trips.service` — `TripsService` for core CRUD and lifecycle operations
- `./dto/create-trip.dto` — `CreateTripDto` request body type
- `./dto/update-trip.dto` — `UpdateTripDto` request body type
- `./dto/trip-response.dto` — `TripResponseDto` response shape
- `./dto/my-trip-list-item-response.dto` — `MyTripListItemResponseDto` list response shape
- `./dto/transition-trip-status.dto` — `TransitionTripStatusDto` status transition body
- `./discovery/trip-discovery.service` — `TripDiscoveryService` for public trip search
- `./discovery/dto/search-trips-query.dto` — `SearchTripsQueryDto` query parameters for search
- `./discovery/dto/trip-search-result.dto` — `TripSearchResponseDto` paginated search response
- `./join-requests/trip-join-requests.service` — `TripJoinRequestsService` for the caller's pending join requests
- `./join-requests/dto/my-trip-join-request-response.dto` — `MyTripJoinRequestResponseDto` response shape
- `./itinerary-pdf/trip-itinerary-pdf.service` — `TripItineraryPdfService` for rendering the itinerary PDF

### Definitions

- `TripsController` (controller) — REST controller at `v1/trips`; handles `GET /`, `POST /`, `GET /join-requests/mine`, `GET /search`, `GET /:id`, `GET /:id/itinerary/pdf`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/status`
- `TripsController.exportItineraryPdf` (function) — streams the trip itinerary PDF generated by `TripItineraryPdfService.generate` (active participants only, throws `ForbiddenException` otherwise), setting `Content-Type: application/pdf` and a `Content-Disposition` attachment header

### Exports

- `TripsController` — named

---

## `trips.module.ts`

### Imports

- `@nestjs/common` — `Module` decorator
- `@/modules/notifications/notifications.module` — `NotificationsModule` for push/email notifications
- `./trips.controller` — `TripsController`
- `./destinations/trips-destinations.controller` — `TripsDestinationsController`
- `./tasks/trips-tasks.controller` — `TripsTasksController`
- `./groups/trips-groups.controller` — `TripsGroupsController`
- `./announcements/trip-announcements.controller` — `TripAnnouncementsController`
- `./participants/trip-participants.controller` — `TripParticipantsController`
- `./invitations/trip-invitations.controller` — `TripInvitationsController`
- `./join-requests/trip-join-requests.controller` — `TripJoinRequestsController`
- `./trips.service` — `TripsService`
- `./destinations/trips-destinations.service` — `TripsDestinationsService`
- `./tasks/trips-tasks.service` — `TripsTasksService`
- `./groups/trips-groups.service` — `TripsGroupsService`
- `./announcements/trip-announcements.service` — `TripAnnouncementsService`
- `./participants/trip-participants.service` — `TripParticipantsService`
- `./invitations/trip-invitations.service` — `TripInvitationsService`
- `./join-requests/trip-join-requests.service` — `TripJoinRequestsService`
- `./discovery/trip-discovery.service` — `TripDiscoveryService`
- `./itinerary-pdf/trip-itinerary-pdf.service` — `TripItineraryPdfService`

### Definitions

- `TripsModule` (module) — NestJS feature module bundling all trip-related controllers and services; exports `TripsService`

### Exports

- `TripsModule` — named

---

## `trips.service.spec.ts`

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `NotFoundException` for assertion checks
- `@nestjs/testing` — `Test`, `TestingModule` for building isolated test modules
- `@chamuco/shared-types` — `AuthProvider`, `NotificationChannel`, `NotificationType`, `PlatformRole`, `ProfileVisibility`, `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripVisibility` enums
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token (mocked)
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (mocked)
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` (mocked)
- `@/modules/notifications/notifications.service` — `NotificationsService` (mocked)
- `./trips.service` — `TripsService` (system under test)
- `./dto/create-trip.dto` — `CreateTripDto` type for test inputs
- `./dto/update-trip.dto` — `UpdateTripDto` type for test inputs
- `./dto/transition-trip-status.dto` — `TransitionTripStatusDto` type for test inputs
- `@/types/express` — `AuthenticatedUser` type for mock user

### Definitions

- `mockUser` (const) — mock `AuthenticatedUser` fixture shared across all test suites
- `mockTripRow` (const) — mock trip database row fixture
- `mockCoOrganizerParticipantAccepted` (const) — mock participant row with CO_ORGANIZER role and ACCEPTED status
- `mockOrganizerParticipant` (const) — mock participant row with ORGANIZER role and CONFIRMED status
- `createDto` (const) — mock `CreateTripDto` input used in createTrip tests
- `TripsService` (describe block) — comprehensive test suite covering `createTrip`, `getTrip`, `updateTrip`, `deleteTrip`, `transitionStatus`, and `getMyTrips`

### Exports

- none

---

## `trips.service.ts`

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException`
- `drizzle-orm` — `and`, `count`, `eq`, `inArray` query helpers
- `@chamuco/shared-types` — `GroupMemberStatus`, `NotificationChannel`, `NotificationType`, `PlatformRole`, `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripVisibility`, `VALID_TRANSITIONS`
- `@/modules/groups/schema/group-members.schema` — `groupMembers` table reference
- `@/modules/notifications/notifications.service` — `NotificationsService` for push/email notifications
- `@/modules/trips/schema/trip-announcements.schema` — `tripAnnouncements` table reference
- `@/modules/trips/schema/group-trips.schema` — `groupTrips` table reference
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/assets/schema/assets.schema` — `assets` table reference
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` for resolving signed/public URLs
- `@/modules/assets/asset.utils` — `assetRowToAsset` conversion utility
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` for GCS operations
- `@/modules/cloud-storage/cloud-storage.constants` — `PUBLIC_OBJECT_PREFIXES` set of public GCS prefixes
- `@/types/express` — `AuthenticatedUser` type
- `./schema/trips.schema` — `trips` table reference
- `./schema/trip-destinations.schema` — `tripDestinations` table reference
- `./schema/trip-participants.schema` — `tripParticipants` table reference
- `./dto/create-trip.dto` — `CreateTripDto` type
- `./dto/update-trip.dto` — `UpdateTripDto` type
- `./dto/trip-response.dto` — `TripResponseDto` type
- `./dto/my-trip-list-item-response.dto` — `MyTripListItemResponseDto` type
- `./dto/transition-trip-status.dto` — `TransitionTripStatusDto` type
- `./participants/trip-participants.constants` — `ACTIVE_STATUSES` array of active participant statuses
- `./trip-completion.util` — `notifyTripCompleted`, shared with `TripStatusJob`

### Definitions

- `FEEDBACK_WINDOW_DAYS` (const) — number of days after `endDate` that trip feedback remains open; reads from `TRIP_FEEDBACK_WINDOW_DAYS` env var, defaults to 7
- `TripsService` (service) — injectable NestJS service providing all core trip operations
- `TripsService.getMyTrips` (function) — returns all trips where the user is an active participant, enriched with cover URL, confirmed count, and role
- `TripsService.createTrip` (function) — creates trip in DRAFT, inserts cover asset and organizer participant in a single transaction
- `TripsService.getTrip` (function) — fetches a single trip by ID and returns the mapped response DTO
- `TripsService.updateTrip` (function) — patches trip fields with organizer/co-organizer guard; handles cover asset replacement with GCS cleanup
- `TripsService.deleteTrip` (function) — hard-deletes trip and announcements in a transaction; ORGANIZER restricted to DRAFT, SUPPORT_ADMIN unrestricted
- `TripsService.transitionStatus` (function) — validates and applies trip status transitions; the UPDATE re-checks the status it read (via `.returning()`) so a double-submit either idempotently no-ops (target already reached) or throws `BadRequestException` (a different transition won the race); on a real DRAFT→OPEN write auto-invites linked group members, on a real →COMPLETED write calls the shared `notifyTripCompleted` (excluding the caller)
- `TripsService.assertOrganizerRole` (function) — shared guard asserting the user holds ORGANIZER (or optionally CO_ORGANIZER) role on the trip
- `TripsService.inviteLinkedGroupMembers` (function) — private; queries linked groups, inserts INVITED participants, and fires TRIP_INVITATION notifications
- `TripsService.fetchAndMapTrip` (function) — private; fetches trip with coverAsset relation and maps to `TripResponseDto`
- `TripsService.mapTrip` (function) — private; converts a raw trip row to `TripResponseDto`, computing `requiresConfirmation` and `feedbackOpenUntil`

### Exports

- `TripsService` — named
