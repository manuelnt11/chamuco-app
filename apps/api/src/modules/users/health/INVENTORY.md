# Inventory: health

---

## users-health.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Get`, `HttpCode`, `Patch` (routing and HTTP decorators)
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBody`, `ApiBearerAuth`, `ApiNotFoundResponse`, `ApiOperation`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (param decorator that extracts the authenticated user from the request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user shape)
- `./users-health.service` — `UsersHealthService` (service providing health read/write logic)
- `./dto/update-user-health.dto` — `UpdateUserHealthDto` (request DTO for PATCH)
- `./dto/user-health-response.dto` — `UserHealthResponseDto` (response DTO for health endpoints)

### Definitions

- `UsersHealthController` (controller) — REST controller under `v1/users`; exposes `GET me/health` and `PATCH me/health` endpoints; delegates all logic to `UsersHealthService`

### Exports

- `UsersHealthController` — named

---

## users-health.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `AuthProvider`, `DietaryPreference`, `PlatformRole`, `ProfileVisibility` (enums used to build mock fixtures)
- `./users-health.controller` — `UsersHealthController` (unit under test)
- `./users-health.service` — `UsersHealthService` (mocked dependency)
- `@/types/express` — `AuthenticatedUser` (type for mock user fixture)
- `./dto/update-user-health.dto` — `UpdateUserHealthDto` (type for PATCH body fixture)
- `./dto/user-health-response.dto` — `UserHealthResponseDto` (type for expected response fixture)

### Definitions

- `UsersHealthController` test suite (function) — verifies that `getHealthProfile` and `updateHealthProfile` delegate correctly to `UsersHealthService` with the right arguments

### Exports

- none

---

## users-health.service.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `NotFoundException` (DI and exception utilities)
- `drizzle-orm` — `eq` (equality operator for Drizzle WHERE clauses)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and typed Drizzle client)
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` (Drizzle table definition for user profiles)
- `./dto/update-user-health.dto` — `UpdateUserHealthDto` (type for incoming PATCH payload)
- `./dto/user-health-response.dto` — `UserHealthResponseDto` (type for shaped response)

### Definitions

- `UsersHealthService` (service) — reads and updates health fields on the `user_profiles` table; `getHealth` fetches and maps the profile; `updateHealth` applies a sparse patch (skips write when DTO is empty, normalises whitespace-only strings to null); `mapHealthResponse` (private) maps a raw Drizzle row to `UserHealthResponseDto`

### Exports

- `UsersHealthService` — named

---

## users-health.service.spec.ts

### Imports

- `@nestjs/common` — `NotFoundException` (asserted in error-path tests)
- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@chamuco/shared-types` — `BloodType`, `DietaryPreference`, `FoodAllergen`, `MedicalConditionType`, `PhobiaType`, `PhysicalLimitationType` (enums used in test fixtures)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for mock DB)
- `./users-health.service` — `UsersHealthService` (unit under test)
- `./dto/update-user-health.dto` — `UpdateUserHealthDto` (type for DTO fixtures)
- `./dto/user-health-response.dto` — `UserHealthResponseDto` (type for expected response fixtures)

### Definitions

- `UsersHealthService` test suite (function) — covers `getHealth` (found, not found, DB error) and `updateHealth` (empty DTO no-op, text normalisation, field updates for all JSONB arrays, blood type set and clear, not found on fetch, not found on update, DB errors)

### Exports

- none
