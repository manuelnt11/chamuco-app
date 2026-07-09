# Inventory: emergency-contacts

---

## users-emergency-contacts.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` (HTTP method decorators, param parsing, response code)
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBody`, `ApiBearerAuth`, `ApiConflictResponse`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (extracts authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user object)
- `./users-emergency-contacts.service` — `UsersEmergencyContactsService` (business logic for CRUD operations)
- `./dto/emergency-contact.dto` — `EmergencyContactDto`, `UpdateEmergencyContactDto` (request/response DTOs)

### Definitions

- `UsersEmergencyContactsController` (controller) — REST controller under `v1/users` exposing CRUD endpoints for the authenticated user's emergency contacts; delegates all logic to `UsersEmergencyContactsService`

### Exports

- `UsersEmergencyContactsController` — named

---

## users-emergency-contacts.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `Inject`, `Injectable`, `NotFoundException` (DI and HTTP exception classes)
- `drizzle-orm` — `eq` (equality comparison helper for Drizzle queries)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and type for the Drizzle database client)
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` (Drizzle table reference for user profiles)
- `./dto/emergency-contact.dto` — `EmergencyContactDto`, `UpdateEmergencyContactDto` (DTO types used in method signatures)

### Definitions

- `UsersEmergencyContactsService` (service) — injectable service managing CRUD operations on the `emergencyContacts` JSONB column of `userProfiles`; enforces primary-contact invariants and delegates persistence to Drizzle
- `fetchContacts` (function) — private helper that retrieves a user profile by `userId`, throws `NotFoundException` if absent, and returns the profile row alongside the typed contacts array

### Exports

- `UsersEmergencyContactsService` — named

---

## users-emergency-contacts.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` (enums used to construct the mock authenticated user)
- `./users-emergency-contacts.controller` — `UsersEmergencyContactsController` (subject under test)
- `./users-emergency-contacts.service` — `UsersEmergencyContactsService` (mocked dependency)
- `@/types/express` — `AuthenticatedUser` (type for mock user fixture)
- `./dto/emergency-contact.dto` — `EmergencyContactDto`, `UpdateEmergencyContactDto` (DTO types for fixtures)

### Definitions

- `UsersEmergencyContactsController` (controller) — unit tests verifying that each route handler calls the correct service method with the correct arguments and returns the service's result

### Exports

- _(none — test file)_

---

## users-emergency-contacts.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `NotFoundException` (asserted in thrown-error tests)
- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for mocked Drizzle client)
- `./users-emergency-contacts.service` — `UsersEmergencyContactsService` (subject under test)
- `./dto/emergency-contact.dto` — `EmergencyContactDto`, `UpdateEmergencyContactDto` (DTO types for fixtures)

### Definitions

- `UsersEmergencyContactsService` (service) — unit tests covering all four public methods (`getEmergencyContacts`, `addEmergencyContact`, `updateEmergencyContact`, `deleteEmergencyContact`) including happy paths, primary-contact promotion/demotion logic, conflict guards, not-found cases, and database error propagation

### Exports

- _(none — test file)_
