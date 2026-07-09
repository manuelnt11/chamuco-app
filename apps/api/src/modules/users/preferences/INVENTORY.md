# Inventory: preferences

---

## users-preferences.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Get`, `HttpCode`, `Patch` decorators for routing and request handling
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBody`, `ApiBearerAuth`, `ApiNotFoundResponse`, `ApiOperation`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse` for OpenAPI documentation
- `@/common/decorators/current-user.decorator` — `CurrentUser` param decorator to extract the authenticated user
- `@/types/express` — `AuthenticatedUser` type representing the resolved Firebase-authenticated user
- `./users-preferences.service` — `UsersPreferencesService` for delegating business logic
- `./dto/notification-preferences-response.dto` — `NotificationPreferencesResponseDto` response shape
- `./dto/update-notification-preferences.dto` — `UpdateNotificationPreferencesDto` request body shape
- `./dto/update-user-preferences.dto` — `UpdateUserPreferencesDto` request body shape
- `./dto/user-preferences-response.dto` — `UserPreferencesResponseDto` response shape

### Definitions

- `UsersPreferencesController` (controller) — NestJS controller under `v1/users`; exposes four endpoints: GET/PATCH `me/preferences` and GET/PATCH `me/notification-preferences`

### Exports

- `UsersPreferencesController` — named

---

## users-preferences.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for building the NestJS test module
- `@chamuco/shared-types` — `AppCurrency`, `AppLanguage`, `AppTheme`, `AuthProvider`, `PlatformRole`, `ProfileVisibility` enums used to build mock fixtures
- `./users-preferences.controller` — `UsersPreferencesController` (subject under test)
- `./users-preferences.service` — `UsersPreferencesService` (mocked provider)
- `@/types/express` — `AuthenticatedUser` type for mock user fixture
- `./dto/update-notification-preferences.dto` — `UpdateNotificationPreferencesDto` type for test inputs
- `./dto/update-user-preferences.dto` — `UpdateUserPreferencesDto` type for test inputs
- `./dto/user-preferences-response.dto` — `UserPreferencesResponseDto` type for expected results

### Definitions

- `mockAuthUser` (const) — stub `AuthenticatedUser` object used across all test cases
- `mockPreferencesResponse` (const) — stub `UserPreferencesResponseDto` returned by mocked service
- `mockNotifPrefsResponse` (const) — stub notification preferences response returned by mocked service

### Exports

- none (test file)

---

## users-preferences.service.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `NotFoundException` for DI and error handling
- `drizzle-orm` — `eq` query helper for WHERE clauses
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/users/schema/user-preferences.schema` — `userPreferences` Drizzle table definition
- `@chamuco/shared-types` — `DisabledNotificationChannels` type, `NotificationChannel` and `NotificationType` enums for validation
- `./dto/notification-preferences-response.dto` — `NotificationPreferencesResponseDto` return type
- `./dto/update-notification-preferences.dto` — `UpdateNotificationPreferencesDto` input type
- `./dto/update-user-preferences.dto` — `UpdateUserPreferencesDto` input type
- `./dto/user-preferences-response.dto` — `UserPreferencesResponseDto` return type

### Definitions

- `UsersPreferencesService` (service) — injectable service; reads and writes the `user_preferences` row for the authenticated user; exposes `getPreferences`, `updatePreferences`, `getNotificationPreferences`, `updateNotificationPreferences`
- `mapPreferencesResponse` (function) — private helper that projects a Drizzle `userPreferences` select result into `UserPreferencesResponseDto`
- `sanitizeNotificationPreferences` (function) — private helper that strips invalid `NotificationType` keys and `NotificationChannel` values from the incoming opt-out map before persisting

### Exports

- `UsersPreferencesService` — named

---

## users-preferences.service.spec.ts

### Imports

- `@nestjs/common` — `NotFoundException` for asserting thrown errors
- `@nestjs/testing` — `Test`, `TestingModule` for building the NestJS test module
- `@chamuco/shared-types` — `AppCurrency`, `AppLanguage`, `AppTheme`, `NotificationChannel`, `NotificationType` enums used to build fixtures and test sanitization logic
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for providing the mock Drizzle client
- `./users-preferences.service` — `UsersPreferencesService` (subject under test)
- `./dto/update-user-preferences.dto` — `UpdateUserPreferencesDto` type for test inputs
- `./dto/update-notification-preferences.dto` — `UpdateNotificationPreferencesDto` type for test inputs

### Definitions

- `mockPreferences` (const) — stub `userPreferences` DB row used across all test cases

### Exports

- none (test file)
