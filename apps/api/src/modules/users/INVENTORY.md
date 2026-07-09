# Inventory: users

---

## users.controller.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `NotFoundException` for testing thrown exceptions
- `@nestjs/testing` — `Test`, `TestingModule` for building the test module
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` enums used in mock data
- `./users.controller` — `UsersController` (class under test)
- `./users.service` — `UsersService` (mocked provider)
- `./dto/update-avatar.dto` — `UpdateAvatarDto` type for avatar update test payloads
- `./dto/update-user.dto` — `UpdateUserDto` type for profile update test payloads
- `./dto/public-profile-response.dto` — `PublicProfileResponseDto` type for public profile assertions
- `@/types/express` — `AuthenticatedUser` type for mock authenticated user fixture

### Definitions

- `mockAuthUser` (const) — Fixture representing a fully populated `AuthenticatedUser` for controller tests
- `mockPublicProfileResponse` (const) — Fixture representing a `PublicProfileResponseDto` with null gamification fields
- `UsersController` describe block (function) — Test suite covering `getMe`, `updateAvatar`, `checkUsernameAvailability`, `updateMe`, `getPublicProfile`, and `searchUsers` controller methods

### Exports

- (none — test file)

---

## users.controller.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `Body`, `Controller`, `Get`, `HttpCode`, `Param`, `Patch`, `Query` for route and request handling
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBody`, `ApiBearerAuth`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiQuery`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` for OpenAPI documentation
- `@nestjs/throttler` — `Throttle` for rate-limiting specific endpoints
- `@/common/decorators/current-user.decorator` — `CurrentUser` parameter decorator to extract the authenticated user
- `@/common/decorators/firebase-only.decorator` — `FirebaseOnly` guard decorator for pre-registration endpoints
- `@/common/decorators/public.decorator` — `Public` decorator to bypass the global auth guard
- `@/types/express` — `AuthenticatedUser` type for typed request user
- `./users.service` — `UsersService` injected dependency
- `./dto/update-avatar.dto` — `UpdateAvatarDto` request body type
- `./dto/update-user.dto` — `UpdateUserDto` request body type
- `./dto/public-profile-response.dto` — `PublicProfileResponseDto` response type
- `./dto/user-response.dto` — `UserResponseDto` response type
- `./dto/username-availability.dto` — `UsernameAvailabilityDto` response type
- `./dto/search-users-query.dto` — `SearchUsersQueryDto` query params type
- `./dto/user-search-result.dto` — `UserSearchResponseDto` response type

### Definitions

- `UsersController` (controller) — REST controller at `v1/users`; exposes `getMe`, `updateMe`, `updateAvatar`, `checkUsernameAvailability`, `searchUsers`, and `getPublicProfile` endpoints

### Exports

- `UsersController` — named

---

## users.module.ts

### Imports

- `@nestjs/common` — `Module` decorator
- `./users.controller` — `UsersController`
- `./users.service` — `UsersService`
- `./profile/users-profile.controller` — `UsersProfileController`
- `./profile/users-profile.service` — `UsersProfileService`
- `./health/users-health.controller` — `UsersHealthController`
- `./health/users-health.service` — `UsersHealthService`
- `./emergency-contacts/users-emergency-contacts.controller` — `UsersEmergencyContactsController`
- `./emergency-contacts/users-emergency-contacts.service` — `UsersEmergencyContactsService`
- `./travel-docs/users-travel-docs.controller` — `UsersTravelDocsController`
- `./travel-docs/users-travel-docs.service` — `UsersTravelDocsService`
- `./loyalty-programs/users-loyalty-programs.controller` — `UsersLoyaltyProgramsController`
- `./loyalty-programs/users-loyalty-programs.service` — `UsersLoyaltyProgramsService`
- `./preferences/users-preferences.controller` — `UsersPreferencesController`
- `./preferences/users-preferences.service` — `UsersPreferencesService`

### Definitions

- `UsersModule` (module) — Registers all users sub-resource controllers and services; exports `UsersService` for use in other modules; orders controllers so parameterized routes (`:username/profile`) register after literal routes

### Exports

- `UsersModule` — named

---

## users.service.spec.ts

### Imports

- `@nestjs/common` — `NotFoundException` for testing thrown exceptions
- `@nestjs/testing` — `Test`, `TestingModule` for building the test module
- `class-transformer` — `plainToInstance` for DTO transformation tests
- `@chamuco/shared-types` — `AuthProvider`, `DietaryPreference`, `PlatformRole`, `ProfileVisibility` enums used in mock data
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for the mock Drizzle client
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` (mocked)
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` (mocked)
- `./users.service` — `UsersService` (class under test)
- `./dto/update-avatar.dto` — `UpdateAvatarDto` type for avatar test payloads
- `./dto/update-user.dto` — `UpdateUserDto` type for profile update test payloads
- `@/types/express` — `AuthenticatedUser` type for mock user fixture

### Definitions

- `mockHealthProfile` (const) — Fixture for a populated `userProfiles` row used in public-profile tests
- `mockUser` (const) — Fixture for a fully populated `AuthenticatedUser` used across service tests
- `UsersService` describe block (function) — Test suite covering `findByFirebaseUid`, `checkUsernameAvailability`, `updateMe`, `getMe`, `updateAvatar`, `getPublicProfile`, `searchUsers`, `SearchUsersQueryDto`, and `UserSearchResultDto`/`UserSearchResponseDto`

### Exports

- (none — test file)

---

## users.service.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `NotFoundException` for DI and error handling
- `drizzle-orm` — `and`, `count`, `eq`, `ilike`, `inArray`, `ne`, `or` for query building
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/assets/schema/assets.schema` — `assets` Drizzle table reference
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` for resolving asset rows to URLs
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` for GCS operations
- `@/modules/cloud-storage/cloud-storage.constants` — `PUBLIC_OBJECT_PREFIXES` set for deciding whether to call `makePublic`
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` Drizzle table reference
- `@/modules/users/schema/users.schema` — `users` Drizzle table reference
- `@chamuco/shared-types` — `ProfileVisibility` enum, `ResolvedAsset` type
- `@/modules/assets/asset.utils` — `assetRowToAsset` utility for converting DB rows to asset objects
- `@/types/express` — `AuthenticatedUser` type
- `./dto/*` — `UpdateAvatarDto`, `UpdateUserDto`, `PublicProfileResponseDto`, `UserResponseDto`, `UsernameAvailabilityDto`, `SearchUsersQueryDto`, `UserSearchResponseDto`, `UserSearchResultDto` (all imported as types)

### Definitions

- `UsersService` (service) — Core user service; handles profile reads/writes, avatar management, username availability checks, public profile retrieval, and user search
- `findByFirebaseUid` (function) — Looks up a user by Firebase UID; throws `NotFoundException` if absent
- `checkUsernameAvailability` (function) — Returns `{ available, username }` indicating whether a username is free
- `searchUsers` (function) — Full-text search over username (prefix) and displayName (partial); excludes the requesting user; resolves avatar assets
- `updateMe` (function) — Applies a partial patch (`displayName`, `timezone`, `profileVisibility`) to the authenticated user's record
- `getMe` (function) — Returns a mapped `UserResponseDto` for the authenticated user
- `getPublicProfile` (function) — Returns public-facing profile; gamification fields gated on `ProfileVisibility.PUBLIC`
- `updateAvatar` (function) — Atomically inserts a new asset record, updates the user FK, makes GCS object public if needed, then deletes the old asset record and GCS object
- `mapUserResponse` (function) — Private helper that strips `firebaseUid` and resolves the avatar asset before returning a `UserResponseDto`
- `fetchAndResolveAvatar` (function) — Private helper that fetches an asset row by ID and resolves it to a `ResolvedAsset` via `AssetResolverService`

### Exports

- `UsersService` — named
