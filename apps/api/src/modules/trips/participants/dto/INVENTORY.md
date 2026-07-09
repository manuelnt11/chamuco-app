# Inventory: dto

---

## export-participants-query.dto.spec.ts

### Imports

- `class-transformer` — `plainToInstance` for transforming plain objects to class instances in tests
- `@chamuco/shared-types` — `ExportField`, `ExportFormat` enums used as expected values
- `./export-participants-query.dto` — `ExportParticipantsQueryDto` class under test

### Definitions

- `ExportParticipantsQueryDto` (spec) — test suite covering `format` default value and `fields` `@Transform` behaviour (comma-split, array passthrough, trimming, empty-entry filtering)

### Exports

- none

---

## export-participants-query.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation
- `class-transformer` — `Transform` for custom query-string parsing of `fields`
- `class-validator` — `IsEnum`, `IsOptional` for runtime validation
- `@chamuco/shared-types` — `ExportField`, `ExportFormat` enums

### Definitions

- `ExportParticipantsQueryDto` (class) — query DTO for the export-participants endpoint; `format` defaults to `CSV`, `fields` accepts a comma-separated string or repeated query param and is transformed into a `ExportField[]`

### Exports

- `ExportParticipantsQueryDto` — named

---

## my-participation-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole` enums

### Definitions

- `MyParticipationResponseDto` (class) — response shape for the current user's own participation record; exposes `status`, `role`, and `isTraveler`

### Exports

- `MyParticipationResponseDto` — named

---

## my-trip-invitation-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation

### Definitions

- `InvitationTripDto` (class) — non-exported inner class; minimal trip summary (id, name, coverUrl) embedded in an invitation response
- `MyTripInvitationResponseDto` (class) — response shape for a pending trip invitation belonging to the current user; contains a nested `trip` (`InvitationTripDto`) and `initiatedAt` timestamp

### Exports

- `MyTripInvitationResponseDto` — named

---

## participant-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole` enums

### Definitions

- `ParticipantResponseDto` (class) — response shape for an accepted or confirmed trip participant; includes `userId`, `username`, `displayName`, `avatarUrl`, `role`, `isTraveler`, `status` (ACCEPTED | CONFIRMED), and `confirmedAt`

### Exports

- `ParticipantResponseDto` — named

---

## pending-participant-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation
- `@chamuco/shared-types` — `TripParticipantStatus` enum

### Definitions

- `PendingParticipantResponseDto` (class) — response shape for a participant in a pending state (INVITED or PENDING_REQUEST); includes `userId`, `username`, `displayName`, `avatarUrl`, `status`, and `initiatedAt`

### Exports

- `PendingParticipantResponseDto` — named

---

## update-participant-role.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation
- `class-validator` — `IsEnum` for runtime validation
- `@chamuco/shared-types` — `TripRole` enum

### Definitions

- `UpdateParticipantRoleDto` (class) — request body DTO for updating a participant's role; single required field `role` validated as a `TripRole` enum value

### Exports

- `UpdateParticipantRoleDto` — named
