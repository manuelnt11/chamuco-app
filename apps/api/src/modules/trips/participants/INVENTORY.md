# Inventory: participants

---

## `trip-participants.constants.ts`

### Imports

- `@chamuco/shared-types` — `TripParticipantStatus` (used to populate `ACTIVE_STATUSES`)

### Definitions

- `ACTIVE_STATUSES` (const) — readonly tuple of active participant statuses: `ACCEPTED` and `CONFIRMED`

### Exports

- `ORGANIZER_ROLES` — barrel re-export from `@chamuco/shared-types`
- `ACTIVE_STATUSES` — named

---

## `trip-participants.controller.spec.ts`

### Imports

- `@nestjs/common` — `StreamableFile`
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `AuthProvider`, `ExportField`, `ExportFormat`, `PlatformRole`, `ProfileVisibility`, `TripParticipantStatus`, `TripRole`
- `express` — `Response`
- `./trip-participants.controller` — `TripParticipantsController`
- `./trip-participants.service` — `TripParticipantsService`
- `./dto/update-participant-role.dto` — `UpdateParticipantRoleDto`
- `./dto/participant-response.dto` — `ParticipantResponseDto`
- `./dto/pending-participant-response.dto` — `PendingParticipantResponseDto`
- `./dto/my-trip-invitation-response.dto` — `MyTripInvitationResponseDto`
- `@/types/express` — `AuthenticatedUser`

### Definitions

- `TripParticipantsController` test suite (describe block) — unit tests verifying each controller method delegates to the correct service method with the correct arguments and sets appropriate response headers for export endpoints

### Exports

- _(none — test file)_

---

## `trip-participants.controller.ts`

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `HttpStatus`, `Param`, `ParseUUIDPipe`, `Patch`, `Query`, `Res`, `StreamableFile`
- `express` — `Response`
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiBody`, `ApiConflictResponse`, `ApiForbiddenResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiProduces`, `ApiQuery`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse`
- `@chamuco/shared-types` — `ExportField`, `ExportFormat`
- `@/common/decorators/current-user.decorator` — `CurrentUser`
- `@/types/express` — `AuthenticatedUser`
- `./dto/export-participants-query.dto` — `ExportParticipantsQueryDto`
- `./trip-participants.service` — `ALL_EXPORT_FIELDS`, `TripParticipantsService`
- `./dto/update-participant-role.dto` — `UpdateParticipantRoleDto`
- `./dto/participant-response.dto` — `ParticipantResponseDto`
- `./dto/my-participation-response.dto` — `MyParticipationResponseDto`
- `./dto/pending-participant-response.dto` — `PendingParticipantResponseDto`
- `./dto/my-trip-invitation-response.dto` — `MyTripInvitationResponseDto`

### Definitions

- `EXPORT_CONTENT_TYPES` (const) — maps each `ExportFormat` value to its MIME type string for response headers
- `EXPORT_EXTENSIONS` (const) — maps each `ExportFormat` value to its file extension string for `Content-Disposition`
- `TripParticipantsController` (controller) — NestJS controller at `v1/trips`; endpoints: `GET /invitations`, `DELETE /:id/participants/:userId`, `PATCH /:id/participants/:userId/confirmation`, `PATCH /:id/participants/:userId/role`, `GET /:id/participants/me`, `GET /:id/participants`, `GET /:id/participants/pending`, `GET /:id/participants/export`

### Exports

- `TripParticipantsController` — named

---

## `trip-participants.service.spec.ts`

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `NotFoundException`
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `ExportField`, `ExportFormat`, `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`
- `@/modules/assets/asset-resolver.service` — `AssetResolverService`
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `./trip-participants.service` — `TripParticipantsService`
- `./dto/update-participant-role.dto` — `UpdateParticipantRoleDto`

### Definitions

- `TripParticipantsService` test suite (describe block) — comprehensive unit tests covering: `removeParticipant`, `updateParticipantRole`, `toggleParticipantConfirmation`, `getMyParticipation`, `listMyInvitations`, `listActiveParticipants`, `listPendingParticipants`, `assertTripExists`, `assertTripOrganizer`, `findParticipantOrThrow`, `exportParticipants` (all formats, field selection, i18n, nationality/emergency-contact data), and notification error tolerance

### Exports

- _(none — test file)_

---

## `trip-participants.service.ts`

### Imports

- `@nestjs/common` — `ConflictException`, `ForbiddenException`, `Inject`, `Injectable`, `Logger`, `NotFoundException`
- `drizzle-orm` — `and`, `count`, `eq`, `inArray`
- `exceljs` — `ExcelJS` (XLSX workbook generation)
- `jszip` — `JSZip` (ODS zip packaging)
- `@chamuco/shared-types` — `ExportField`, `ExportFormat`, `NotificationChannel`, `NotificationType`, `TripParticipantStatus`, `TripRole`
- `@/modules/assets/asset.utils` — `assetRowToAsset`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient`
- `@/modules/users/schema/users.schema` — `users`
- `@/modules/users/schema/user-profiles.schema` — `userProfiles`
- `@/modules/users/schema/user-nationalities.schema` — `userNationalities`
- `@/modules/users/schema/user-preferences.schema` — `userPreferences`
- `@/modules/assets/schema/assets.schema` — `assets`
- `@/modules/assets/asset-resolver.service` — `AssetResolverService`
- `@/modules/notifications/notifications.service` — `NotificationsService`
- `@/modules/trips/schema/trips.schema` — `trips`
- `@/modules/trips/schema/trip-participants.schema` — `tripParticipants`
- `@/modules/users/emergency-contacts/dto/emergency-contact.dto` — `EmergencyContactDto`
- `./dto/update-participant-role.dto` — `UpdateParticipantRoleDto`
- `./dto/participant-response.dto` — `ParticipantResponseDto`
- `./dto/pending-participant-response.dto` — `PendingParticipantResponseDto`
- `./dto/my-participation-response.dto` — `MyParticipationResponseDto`
- `./dto/my-trip-invitation-response.dto` — `MyTripInvitationResponseDto`
- `./trip-participants.constants` — `ACTIVE_STATUSES`, `ORGANIZER_ROLES`

### Definitions

- `EXPORT_COLUMN_META` (const) — maps each `ExportField` to its default English header label and column width for spreadsheet export
- `ExportLangBundle` (interface) — shape of a per-language translation bundle (headers map, role/status/dietary/bloodType label maps, yes/no tuple)
- `EXPORT_TRANSLATIONS` (const) — keyed `en`/`es` `ExportLangBundle` instances used to localise export output based on the organizer's DB language preference
- `ParticipantExportRow` (type) — `Record<ExportField, string>` alias representing one participant row in an export spreadsheet
- `ALL_EXPORT_FIELDS` (const) — ordered array of all `ExportField` enum values; defines canonical column order and default field set for exports
- `TripParticipantsService` (service) — NestJS injectable service; manages participant removal/self-leave, role updates (including atomic ORGANIZER transfer), confirmation toggle, active/pending participant listing, invitation listing, participant export (XLSX/CSV/ODS with i18n), and capacity check; exposes `findParticipantOrThrow`, `assertTripExists`, `assertTripOrganizer`, `assertCapacityAvailable` as public helpers consumed by sibling services

### Exports

- `ALL_EXPORT_FIELDS` — named
- `TripParticipantsService` — named
