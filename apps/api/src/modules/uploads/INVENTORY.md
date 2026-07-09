# Inventory: uploads

---

## uploads.controller.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `Body`, `Controller`, `ForbiddenException`, `HttpCode`, `HttpStatus`, `Post`: NestJS HTTP primitives and exception classes
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiOperation`, `ApiResponse`, `ApiTags`, `ApiBadRequestResponse`, `ApiForbiddenResponse`: OpenAPI decoration
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService`: signed URL generation and content-type validation
- `@/modules/cloud-storage/cloud-storage.constants` — `UPLOAD_SIZE_LIMITS_BYTES`, `UploadType`: size limits map and upload type enum
- `@/modules/groups/groups.service` — `GroupsService`: group lookup for authorization
- `@/modules/trips/trips.service` — `TripsService`: organizer-role assertion for authorization
- `./dto/generate-signed-url.dto` — `GenerateSignedUrlDto`: request body shape
- `./dto/signed-url-response.dto` — `SignedUrlResponseDto`: response body shape
- `@/common/decorators/current-user.decorator` — `CurrentUser`: param decorator that extracts the authenticated user
- `@/types/express` — `AuthenticatedUser`: type of the authenticated user attached to the request

### Definitions

- `UploadsController` (controller) — handles `POST /v1/uploads/signed-url`; validates content type and file size, delegates authorization per `UploadType`, then calls `CloudStorageService.generateSignedUploadUrl`
- `authorizeUpload` (function) — private method; switches on `UploadType` to enforce per-type ownership rules (`USER_AVATAR` → id match, `GROUP_COVER` → group owner, `TRIP_COVER` → organizer/co-organizer, others → `ForbiddenException`); TypeScript exhaustiveness guard via `never`

### Exports

- `UploadsController` — named

---

## uploads.module.ts

### Imports

- `@nestjs/common` — `Module`: NestJS module decorator
- `@/modules/groups/groups.module` — `GroupsModule`: provides `GroupsService` to the controller
- `@/modules/trips/trips.module` — `TripsModule`: provides `TripsService` to the controller
- `./uploads.controller` — `UploadsController`: the single controller declared by this module

### Definitions

- `UploadsModule` (module) — NestJS module that imports `GroupsModule` and `TripsModule`, declares `UploadsController`; no providers of its own (relies on `@Global()` `CloudStorageModule`)

### Exports

- `UploadsModule` — named

---

## uploads.controller.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ForbiddenException`: exception classes asserted in tests
- `@nestjs/testing` — `Test`, `TestingModule`: NestJS test harness
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`: enum values used to build the mock authenticated user
- `./uploads.controller` — `UploadsController`: the class under test
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService`: mocked provider
- `@/modules/groups/groups.service` — `GroupsService`: mocked provider
- `@/modules/trips/trips.service` — `TripsService`: mocked provider
- `@/modules/cloud-storage/cloud-storage.constants` — `UploadType`: enum values for test scenarios
- `./dto/generate-signed-url.dto` — `GenerateSignedUrlDto`: DTO type used to type test fixtures
- `@/types/express` — `AuthenticatedUser`: type of the mock authenticated user

### Definitions

- `UploadsController` test suite (function) — covers `POST /v1/uploads/signed-url`; tests authorization per upload type (`USER_AVATAR`, `GROUP_COVER`, `TRIP_COVER`, `GROUP_RESOURCE_DOCUMENT`, `TRIP_RESOURCE`, unknown type) and input validation (bad content type, file size over limit, exact-limit acceptance)

### Exports

- _(none — spec file, no exports)_
