# Inventory: loyalty-programs

---

## users-loyalty-programs.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `Param`, `ParseUUIDPipe`, `Patch`, `Post` (HTTP method decorators, param extraction, UUID validation)
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBody`, `ApiBearerAuth`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (extracts authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated request user)
- `./users-loyalty-programs.service` — `UsersLoyaltyProgramsService` (service handling business logic)
- `./dto/loyalty-program.dto` — `LoyaltyProgramDto`, `UpdateLoyaltyProgramDto` (request/response DTOs)

### Definitions

- `UsersLoyaltyProgramsController` (controller) — REST controller under `v1/users` exposing CRUD endpoints for the authenticated user's loyalty programs (GET, POST, PATCH, DELETE on `me/loyalty-programs`)

### Exports

- `UsersLoyaltyProgramsController` — named

---

## users-loyalty-programs.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` (enums for mock user fixture)
- `./users-loyalty-programs.controller` — `UsersLoyaltyProgramsController` (class under test)
- `./users-loyalty-programs.service` — `UsersLoyaltyProgramsService` (mocked dependency)
- `@/types/express` — `AuthenticatedUser` (type for mock user)
- `./dto/loyalty-program.dto` — `LoyaltyProgramDto`, `UpdateLoyaltyProgramDto` (DTO types used in test fixtures)

### Definitions

- `UsersLoyaltyProgramsController` test suite (class) — unit tests verifying each controller method delegates correctly to the service and returns its result

### Exports

- _(none)_

---

## users-loyalty-programs.service.ts

### Imports

- `@nestjs/common` — `ConflictException`, `Inject`, `Injectable`, `NotFoundException` (DI decorators and HTTP exceptions)
- `drizzle-orm` — `eq` (equality operator for Drizzle WHERE clauses)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and typed Drizzle client)
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` (Drizzle table reference for user profiles)
- `./dto/loyalty-program.dto` — `LoyaltyProgramDto`, `UpdateLoyaltyProgramDto` (DTO types for loyalty program data)

### Definitions

- `UsersLoyaltyProgramsService` (service) — injectable service managing CRUD operations on the `loyaltyPrograms` JSONB array stored in `userProfiles`; enforces case-insensitive duplicate detection on add
- `fetchLoyaltyPrograms` (function) — private helper that queries `userProfiles` by `userId`, throws `NotFoundException` if not found, and returns the profile row plus the parsed `loyaltyPrograms` array

### Exports

- `UsersLoyaltyProgramsService` — named

---

## users-loyalty-programs.service.spec.ts

### Imports

- `@nestjs/common` — `ConflictException`, `NotFoundException` (exception classes asserted in tests)
- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for mock DB)
- `./users-loyalty-programs.service` — `UsersLoyaltyProgramsService` (class under test)
- `./dto/loyalty-program.dto` — `LoyaltyProgramDto` (type for test fixtures)

### Definitions

- `UsersLoyaltyProgramsService` test suite (class) — unit tests covering `getLoyaltyPrograms`, `addLoyaltyProgram`, `updateLoyaltyProgram`, and `deleteLoyaltyProgram`, including duplicate detection, not-found scenarios, and partial updates

### Exports

- _(none)_
