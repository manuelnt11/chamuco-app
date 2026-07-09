# Inventory: participants

---

## trip-participants.constants.ts

### Imports

- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole` enums used to define constant arrays

### Definitions

- `ORGANIZER_ROLES` (const) — Readonly tuple of `[TripRole.ORGANIZER, TripRole.CO_ORGANIZER]` used to check organizer-level access
- `ACTIVE_STATUSES` (const) — Readonly tuple of `[TripParticipantStatus.ACCEPTED, TripParticipantStatus.CONFIRMED]` used to filter active participants

### Exports

- `ORGANIZER_ROLES` — named
- `ACTIVE_STATUSES` — named

---

## trip-participants.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Query`, `Res`, `StreamableFile` (HTTP routing and response helpers)
- `express` — `Response` type for streaming file responses
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiProduces`, `ApiQuery`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI decorators)
- `@chamuco/shared-types` — `ExportField`, `ExportFormat` enums
- `@/common/decorators/current-user.decorator` — `CurrentUser` decorator to extract authenticated user from request
- `@/types/express` — `AuthenticatedUser` type for typed user object
- `./dto/export-participants-query.dto` — `ExportParticipantsQueryDto`
- `./trip-participants.service` — `ALL_EXPORT_FIELDS`, `TripParticipantsService`
- `./dto/update-participant-role.dto` — `UpdateParticipantRoleDto`
- `./dto/participant-response.dto` — `ParticipantResponseDto`
- `./dto/my-participation-response.dto` — `MyParticipationResponseDto`
- `./dto/pending-participant-response.dto` — `PendingParticipantResponseDto`
- `./dto/my-trip-invitation-response.dto` — `MyTripInvitationResponseDto`

### Definitions

- `EXPORT_CONTENT_TYPES` (const) — Maps `ExportFormat` enum values to MIME type strings for response headers
- `EXPORT_EXTENSIONS` (const) — Maps `ExportFormat` enum values to file extension strings for `Content-Disposition`
- `TripParticipantsController` (controller) — REST controller at `v1/trips`; exposes participant list, pending list, my participation, role update, confirmation toggle, remove, export, and my invitations endpoints

### Exports

- `TripParticipantsController` — named

---

## trip-participants.service.ts

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException` (NestJS DI and exception classes)
- `drizzle-orm` — `and`, `eq`, `inArray` (query condition helpers)
- `exceljs` — `ExcelJS` default import for building XLSX workbooks
- `jszip` — `JSZip` default import for building ODS zip archives
- `@chamuco/shared-types` — `ExportField`, `ExportFormat`, `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole` enums
- `@/modules/assets/asset.utils` — `assetRowToAsset` utility for converting DB rows to asset objects
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/users/schema/users.schema` — `users` Drizzle table reference
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` Drizzle table reference
- `@/modules/users/schema/user-nationalities.schema` — `userNationalities` Drizzle table reference
- `@/modules/users/schema/user-preferences.schema` — `userPreferences` Drizzle table reference
- `@/modules/assets/schema/assets.schema` — `assets` Drizzle table reference
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` for resolving signed/public asset URLs
- `@/modules/notifications/notifications.service` — `NotificationsService` for dispatching push notifications
- `@/modules/trips/schema/trips.schema` — `trips` Drizzle table reference
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants` Drizzle table reference
- `@/modules/users/emergency-contacts/dto/emergency-contact.dto` — `EmergencyContactDto` type for JSONB casting
- `./dto/update-participant-role.dto` — `UpdateParticipantRoleDto` type
- `./dto/participant-response.dto` — `ParticipantResponseDto` type
- `./dto/pending-participant-response.dto` — `PendingParticipantResponseDto` type
- `./dto/my-participation-response.dto` — `MyParticipationResponseDto` type
- `./dto/my-trip-invitation-response.dto` — `MyTripInvitationResponseDto` type
- `./trip-participants.constants` — `ACTIVE_STATUSES`, `ORGANIZER_ROLES`

### Definitions

- `EXPORT_COLUMN_META` (const) — Maps every `ExportField` to its default English header label and column width for spreadsheet export
- `ExportLangBundle` (interface) — Shape of a per-language translation bundle (headers, role/status/dietary/bloodType labels, yes/no strings)
- `EXPORT_TRANSLATIONS` (const) — Keyed `en`/`es` translation bundles used to localise export output based on user preferences
- `ParticipantExportRow` (type) — `Record<ExportField, string>` alias for a single export data row
- `ALL_EXPORT_FIELDS` (const) — Ordered array of all `ExportField` values; used as the default field set for exports
- `TripParticipantsService` (service) — Core service managing participant lifecycle: remove/leave, role update (with ownership transfer), confirmation toggle, active/pending listing, my participation query, my invitations query, and multi-format (XLSX/CSV/ODS) participant export with i18n support
  - `removeParticipant` — Handles self-leave (withdraw pending or cancel active) and organizer-initiated removal; sends `TRIP_PARTICIPANT_REMOVED` push notification
  - `updateParticipantRole` — Updates a participant's role; performs atomic ORGANIZER transfer in a DB transaction; sends `TRIP_ROLE_CHANGED` push notification
  - `toggleParticipantConfirmation` — Toggles an active participant's status between ACCEPTED and CONFIRMED (organizer/co-organizer only)
  - `getMyParticipation` — Returns the caller's current status and role for a trip
  - `listMyInvitations` — Returns all INVITED participation records with resolved trip cover URLs
  - `listActiveParticipants` — Returns all ACCEPTED/CONFIRMED participants with resolved avatar URLs; requires caller to be an active participant
  - `listPendingParticipants` — Returns INVITED and PENDING_REQUEST participants; organizer only
  - `findParticipantOrThrow` (public helper) — Fetches a participation record or throws `NotFoundException`; used by sibling services
  - `assertTripExists` (public helper) — Fetches a trip or throws `NotFoundException`; used by sibling services
  - `assertTripOrganizer` (public helper) — Asserts caller has an active organizer-role participation; used by sibling services
  - `exportParticipants` — Generates a participant spreadsheet (XLSX/CSV/ODS) with profile, nationality, health, and emergency contact data; reads user language preference from DB; supports field selection with canonical ordering
  - `buildXlsxBuffer` (private) — Builds an XLSX buffer via ExcelJS
  - `buildCsvBuffer` (private) — Builds a UTF-8 CSV buffer with RFC 4180 quoting
  - `buildOdsBuffer` (private) — Builds an ODS (OpenDocument Spreadsheet) buffer via JSZip and raw XML
  - `batchResolveAvatarUrls` (private) — Batch-resolves avatar asset URLs for a list of user rows

### Exports

- `ALL_EXPORT_FIELDS` — named
- `TripParticipantsService` — named

---

## trip-participants.controller.spec.ts

### Imports

- `@nestjs/common` — `StreamableFile`
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `AuthProvider`, `ExportField`, `ExportFormat`, `PlatformRole`, `ProfileVisibility`, `TripParticipantStatus`, `TripRole`
- `express` — `Response` type
- `./trip-participants.controller` — `TripParticipantsController` (class under test)
- `./trip-participants.service` — `TripParticipantsService` (mocked dependency)
- `./dto/update-participant-role.dto` — `UpdateParticipantRoleDto`
- `./dto/participant-response.dto` — `ParticipantResponseDto`
- `./dto/pending-participant-response.dto` — `PendingParticipantResponseDto`
- `./dto/my-trip-invitation-response.dto` — `MyTripInvitationResponseDto`
- `@/types/express` — `AuthenticatedUser`

### Definitions

- `TripParticipantsController` test suite — Unit tests verifying that each controller method delegates to the correct service method with the correct arguments and sets appropriate response headers for file export endpoints

### Exports

- _(none — test file)_

---

## trip-participants.service.spec.ts

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException`
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `ExportField`, `ExportFormat`, `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token
- `@/modules/assets/asset-resolver.service` — `AssetResolverService`
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `./trip-participants.service` — `TripParticipantsService` (class under test)
- `./dto/update-participant-role.dto` — `UpdateParticipantRoleDto`

### Definitions

- `TripParticipantsService` test suite — Comprehensive unit tests covering `removeParticipant`, `updateParticipantRole`, `toggleParticipantConfirmation`, `getMyParticipation`, `listMyInvitations`, `listActiveParticipants`, `listPendingParticipants`, `assertTripExists`, `assertTripOrganizer`, `findParticipantOrThrow`, `exportParticipants` (all formats, field selection, i18n, nationality data, emergency contacts), and notification error tolerance

### Exports

- _(none — test file)_
