# Inventory: profile

---

## users-profile.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Get`, `HttpCode`, `Patch` (routing and HTTP method decorators)
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBody`, `ApiBearerAuth`, `ApiNotFoundResponse`, `ApiOperation`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` (OpenAPI documentation decorators)
- `@/common/decorators/current-user.decorator` — `CurrentUser` (extracts authenticated user from request)
- `@/types/express` — `AuthenticatedUser` (type for the authenticated user object)
- `./users-profile.service` — `UsersProfileService` (service handling profile read/write logic)
- `./dto/update-user-profile.dto` — `UpdateUserProfileDto` (DTO for profile update request body)
- `./dto/user-profile-response.dto` — `UserProfileResponseDto` (DTO for profile response shape)

### Definitions

- `UsersProfileController` (controller) — NestJS controller at `v1/users` exposing `GET me/profile` and `PATCH me/profile` endpoints for reading and updating the authenticated user's personal profile

### Exports

- `UsersProfileController` — named

---

## users-profile.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness utilities)
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` (shared enums used to build mock data)
- `./users-profile.controller` — `UsersProfileController` (class under test)
- `./users-profile.service` — `UsersProfileService` (mocked dependency)
- `@/types/express` — `AuthenticatedUser` (type for mock authenticated user fixture)
- `./dto/update-user-profile.dto` — `UpdateUserProfileDto` (type for mock update payload)
- `./dto/user-profile-response.dto` — `UserProfileResponseDto` (type for mock response fixture)

### Definitions

- `UsersProfileController` test suite (class) — verifies that `getProfile` and `updateProfile` delegate to `UsersProfileService` with correct arguments and return its result

### Exports

- none

---

## users-profile.service.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `NotFoundException` (DI decorators and HTTP exception)
- `drizzle-orm` — `eq` (equality operator for Drizzle query conditions)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and typed Drizzle client)
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` (Drizzle table definition for `user_profiles`)
- `./dto/date-of-birth.dto` — `DateOfBirthDto` (type for the mapped date-of-birth response shape)
- `./dto/update-user-profile.dto` — `UpdateUserProfileDto` (type for the update request payload)
- `./dto/user-profile-response.dto` — `UserProfileResponseDto` (type for the service return value)

### Definitions

- `UsersProfileService` (service) — retrieves and updates a user's personal profile via Drizzle; normalizes `year_visible` ↔ `yearVisible`, trims nullable text fields, and resets `emailVerified` to `false` when the email address changes
- `mapProfileResponse` (function) — private helper that converts a raw `userProfiles` row into `UserProfileResponseDto`, translating `year_visible` to `yearVisible` in the date-of-birth object

### Exports

- `UsersProfileService` — named

---

## users-profile.service.spec.ts

### Imports

- `@nestjs/common` — `NotFoundException` (asserted in error-path tests)
- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness utilities)
- `@chamuco/shared-types` — `DietaryPreference` (enum used to build mock profile row)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` (injection token for the mock Drizzle client)
- `./users-profile.service` — `UsersProfileService` (class under test)
- `./dto/update-user-profile.dto` — `UpdateUserProfileDto` (type for update payload in tests)

### Definitions

- `UsersProfileService` test suite (class) — covers `getProfile` and `updateProfile`: not-found paths, `year_visible` mapping, nullable field normalization, empty-patch short-circuit, email-change `emailVerified` reset, and DB error propagation

### Exports

- none
