# Inventory: travel-docs

---

## users-travel-docs.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module creation
- `@chamuco/shared-types` — `AuthProvider`, `DocumentStatus`, `EtaType`, `PassportStatus`, `PlatformRole`, `ProfileVisibility`, `VisaCoverageType`, `VisaEntries`, `VisaType` enums used in mock fixtures
- `./users-travel-docs.controller` — `UsersTravelDocsController` (subject under test)
- `./users-travel-docs.service` — `UsersTravelDocsService` (mocked dependency)
- `@/types/express` — `AuthenticatedUser` type for mock auth user
- `./dto/nationality.dto` — `CreateNationalityDto`, `NationalityResponseDto`, `UpdateNationalityDto` types
- `./dto/visa.dto` — `CreateVisaDto`, `UpdateVisaDto`, `VisaResponseDto` types
- `./dto/eta.dto` — `CreateEtaDto`, `EtaResponseDto`, `UpdateEtaDto` types

### Definitions

- `UsersTravelDocsController` describe suite (const) — Jest test suite covering all 12 controller methods across nationalities, visas, and ETAs endpoints; verifies delegation to service and return values

### Exports

- none

---

## users-travel-docs.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` route/param decorators
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBody`, `ApiBearerAuth`, `ApiConflictResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` OpenAPI decorators
- `@/common/decorators/current-user.decorator` — `CurrentUser` param decorator to extract authenticated user from request
- `@/types/express` — `AuthenticatedUser` type for typed request user
- `./users-travel-docs.service` — `UsersTravelDocsService` injected service
- `./dto/nationality.dto` — `CreateNationalityDto`, `NationalityResponseDto`, `UpdateNationalityDto`
- `./dto/visa.dto` — `CreateVisaDto`, `UpdateVisaDto`, `VisaResponseDto`
- `./dto/eta.dto` — `CreateEtaDto`, `EtaResponseDto`, `UpdateEtaDto`

### Definitions

- `UsersTravelDocsController` (controller) — NestJS controller at `v1/users`; exposes 12 REST endpoints for managing nationalities (`GET/POST/PATCH/DELETE me/nationalities`), visas (`GET/POST/PATCH/DELETE me/nationalities/:nationalityId/visas`), and ETAs (`GET/POST/PATCH/DELETE me/nationalities/:nationalityId/etas`); fully documented with OpenAPI decorators; delegates all logic to `UsersTravelDocsService`

### Exports

- `UsersTravelDocsController` — named

---

## users-travel-docs.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `NotFoundException` for thrown-error assertions
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test module creation
- `@chamuco/shared-types` — `DocumentStatus`, `EtaType`, `PassportStatus`, `VisaCoverageType`, `VisaEntries`, `VisaType` enums used in mock fixtures and assertions
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for mocked DB
- `./users-travel-docs.service` — `UsersTravelDocsService` (subject under test)
- `./dto/nationality.dto` — `CreateNationalityDto`, `UpdateNationalityDto` types

### Definitions

- `UsersTravelDocsService` describe suite (const) — Jest test suite with a fully mocked Drizzle client; covers getNationalities, addNationality (including passport status computation), updateNationality (including ETA invalidation on passport change and primary demotion), deleteNationality, getVisas, addVisa, updateVisa, deleteVisa, getEtas, addEta (passport number snapshot), updateEta, deleteEta

### Exports

- none

---

## users-travel-docs.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `Inject`, `Injectable`, `NotFoundException`
- `drizzle-orm` — `and`, `eq`, `ne` query helpers for Drizzle where clauses
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/users/schema/user-nationalities.schema` — `userNationalities` Drizzle table schema
- `@/modules/users/schema/user-etas.schema` — `userEtas` Drizzle table schema
- `@/modules/users/schema/user-visas.schema` — `userVisas` Drizzle table schema
- `@chamuco/shared-types` — `DocumentStatus`, `PassportStatus` enums
- `@/common/utils/document-status.util` — `computeDocumentStatus` computes visa/ETA status from expiry date
- `@/common/utils/passport-status.util` — `computePassportStatus` computes passport status from expiry date
- `./dto/nationality.dto` — `CreateNationalityDto`, `NationalityResponseDto`, `UpdateNationalityDto` types
- `./dto/visa.dto` — `CreateVisaDto`, `UpdateVisaDto`, `VisaResponseDto` types
- `./dto/eta.dto` — `CreateEtaDto`, `EtaResponseDto`, `UpdateEtaDto` types

### Definitions

- `UsersTravelDocsService` (service) — Injectable NestJS service managing nationalities, visas, and ETAs for the authenticated user; enforces ownership via `requireNationality`; handles primary-demotion transaction on nationality add/update; synchronously expires ETAs when passport number changes; snapshots passport number at ETA creation time; maps raw Drizzle rows to typed response DTOs
- `requireNationality` (function) — private async helper; fetches a nationality by id+userId and throws `NotFoundException` if not found; used as an ownership guard before visa/ETA operations
- `mapNationalityResponse` (function) — private mapper from `userNationalities.$inferSelect` to `NationalityResponseDto`
- `mapVisaResponse` (function) — private mapper from `userVisas.$inferSelect` to `VisaResponseDto`
- `mapEtaResponse` (function) — private mapper from `userEtas.$inferSelect` to `EtaResponseDto`

### Exports

- `UsersTravelDocsService` — named
