# Inventory: auth

---

## auth.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `HttpCode`, `HttpStatus`, `Post`, `Req` for route decorators and HTTP utilities
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiOperation`, `ApiResponse`, `ApiTags` for OpenAPI documentation
- `express` — `Request` type for accessing raw request headers
- `@/common/decorators/current-user.decorator` — `CurrentUser` param decorator to extract authenticated user
- `@/common/decorators/public.decorator` — `Public` decorator to bypass global auth guard
- `@/modules/auth/auth.service` — `AuthService` for business logic delegation
- `@/types/express` — `AuthenticatedUser` type for the current-user parameter
- `./dto/register.dto` — `RegisterDto` request body type
- `./dto/register-response.dto` — `RegisterResponseDto` response body type

### Definitions

- `AuthController` (controller) — NestJS controller for `v1/auth`; exposes `POST /register` (public, Firebase token in header) and `POST /logout` (protected) endpoints

### Exports

- `AuthController` — named

---

## auth.controller.spec.ts

### Imports

- `@nestjs/common` — `HttpStatus` for assertion values
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test harness
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole` enums for fixture construction
- `@/modules/auth/auth.controller` — `AuthController` under test
- `@/modules/auth/auth.service` — `AuthService` for mocking
- `@/types/express` — `AuthenticatedUser` type for logout test fixture
- `express` — `Request` type for register test fixture
- `./dto/register-response.dto` — `RegisterResponseDto` type for mock data
- `./dto/register.dto` — `RegisterDto` type for test inputs

### Definitions

- `mockUser` (const) — fixture `RegisterResponseDto` used across register tests
- `buildRequest` (function) — helper that constructs a minimal Express `Request` with an optional `authorization` header

### Exports

- none (test file)

---

## auth.module.ts

### Imports

- `@nestjs/common` — `Global`, `Module` for module declaration
- `@nestjs/core` — `APP_GUARD` token for registering global guards
- `@/common/guards/roles.guard` — `RolesGuard` global role-based access guard
- `@/modules/auth/auth.controller` — `AuthController`
- `@/modules/auth/auth.service` — `AuthService`
- `@/modules/auth/firebase-auth.guard` — `FirebaseAuthGuard`
- `@/modules/auth/firebase-admin.service` — `FirebaseAdminService`
- `@/modules/users/users.module` — `UsersModule` (imported for `UsersService` dependency)

### Definitions

- `AuthModule` (module) — `@Global()` NestJS module; registers `FirebaseAuthGuard` and `RolesGuard` as `APP_GUARD` providers so they apply to every route application-wide; exports all four services/guards

### Exports

- `AuthModule` — named

---

## auth.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `Inject`, `Injectable`, `Logger`, `UnauthorizedException` for DI and HTTP errors
- `drizzle-orm` — `eq` query helper
- `@chamuco/shared-types` — `ResolvedAsset` type and `AuthProvider` enum
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` injection token and type
- `@/modules/email/email.service` — `EmailService` for sending the welcome email
- `@/modules/auth/firebase-admin.service` — `FirebaseAdminService` for token verification and session revocation
- `@/modules/assets/schema/assets.schema` — `assets` Drizzle table for OAuth avatar asset insert
- `@/modules/users/schema/user-nationalities.schema` — `userNationalities` table
- `@/modules/users/schema/user-preferences.schema` — `userPreferences` table
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` table
- `@/modules/users/schema/users.schema` — `users` table
- `@/common/utils/passport-status.util` — `computePassportStatus` utility
- `@/database/db-errors` — `isUniqueViolation` helper for PG error code detection
- `./dto/register.dto` — `RegisterDto` request payload type
- `./dto/register-response.dto` — `RegisterResponseDto` response type

### Definitions

- `PROVIDER_MAP` (const) — maps Firebase `sign_in_provider` string (`google.com`, `facebook.com`) to `AuthProvider` enum values
- `AuthService` (service) — handles user registration (Firebase token verification, duplicate checks, atomic DB transaction for user + preferences + profile + nationalities + optional avatar asset) and logout (token revocation via Firebase Admin); fires welcome email after successful registration

### Exports

- `AuthService` — named

---

## auth.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `ConflictException`, `UnauthorizedException` for assertion matching
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test harness
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole` enums for fixtures
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for mocking
- `@/modules/email/email.service` — `EmailService` for mocking
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` used to locate the profile insert call in mock assertions
- `@/modules/auth/auth.service` — `AuthService` under test
- `@/modules/auth/firebase-admin.service` — `FirebaseAdminService` for mocking
- `./dto/register-response.dto` — `RegisterResponseDto` type for fixtures
- `./dto/register.dto` — `RegisterDto` type for test inputs

### Definitions

- `getProfileInsertValues` (function) — locates the `userProfiles` insert call in mock call history and returns the `values` mock; used to assert profile fields without coupling to call index
- `NOW` (const) — fixed `Date` used across all fixtures for deterministic timestamps
- `mockCreatedUser` (const) — fixture `RegisterResponseDto` returned by the mocked DB transaction
- `mockDecodedToken` (const) — fixture decoded Firebase token with `google.com` provider
- `validRegisterDto` (const) — minimal valid `RegisterDto` used as baseline for all register tests

### Exports

- none (test file)

---

## firebase-admin.service.ts

### Imports

- `@nestjs/common` — `Injectable`, `OnModuleInit`, `Logger` for DI and lifecycle hook
- `@nestjs/config` — `ConfigService` for reading `FIREBASE_SERVICE_ACCOUNT_JSON` env var
- `firebase-admin/app` — `cert`, `getApps`, `initializeApp`, `ServiceAccount` for Firebase Admin SDK initialization
- `firebase-admin/auth` — `getAuth`, `Auth` for Firebase Authentication access
- `firebase-admin/messaging` — `getMessaging`, `Messaging` for FCM access

### Definitions

- `FirebaseAdminService` (service) — initializes the Firebase Admin SDK once on module startup (idempotent — skips if already initialized); exposes `auth()` returning the Firebase `Auth` instance and `messaging()` returning the `Messaging` instance

### Exports

- `FirebaseAdminService` — named

---

## firebase-admin.service.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test harness
- `@nestjs/config` — `ConfigService` for mocking
- `firebase-admin/app` — `getApps`, `initializeApp`, `cert` (all mocked via `jest.mock`)
- `firebase-admin/auth` — `getAuth` (mocked)
- `@/modules/auth/firebase-admin.service` — `FirebaseAdminService` under test

### Definitions

- `mockServiceAccountJson` (const) — serialized mock service account JSON used for config injection

### Exports

- none (test file)

---

## firebase-auth.guard.ts

### Imports

- `@nestjs/common` — `CanActivate`, `ExecutionContext`, `Inject`, `Injectable`, `Logger`, `NotFoundException`, `UnauthorizedException` for guard interface and HTTP errors
- `@nestjs/core` — `Reflector` for reading decorator metadata
- `drizzle-orm` — `eq` query helper for `updateLastActive`
- `express` — `Request` type for header extraction
- `@/common/decorators/firebase-only.decorator` — `IS_FIREBASE_ONLY_KEY` metadata key
- `@/common/decorators/public.decorator` — `IS_PUBLIC_KEY` metadata key
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` injection token and type
- `@/modules/auth/firebase-admin.service` — `FirebaseAdminService` for token verification
- `@/modules/users/users.service` — `UsersService` for DB user lookup by Firebase UID
- `@/modules/users/schema/users.schema` — `users` table for `last_active_at` update

### Definitions

- `FirebaseAuthGuard` (guard) — global `CanActivate` guard; skips unauthenticated routes marked `@Public()`; for `@FirebaseOnly()` routes verifies the Firebase token and sets `req.firebaseUser` without a DB lookup; for normal protected routes additionally resolves the Chamuco `user` record via `UsersService.findByFirebaseUid`, sets `req.user`, and fire-and-forgets a `last_active_at` update; re-throws `NotFoundException` so the frontend can route unregistered users to `/onboarding`

### Exports

- `FirebaseAuthGuard` — named

---

## firebase-auth.guard.spec.ts

### Imports

- `@nestjs/common` — `ExecutionContext`, `NotFoundException`, `UnauthorizedException` for test assertions
- `@nestjs/core` — `Reflector` for mocking metadata reads
- `@nestjs/testing` — `Test`, `TestingModule` for NestJS test harness
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility` enums for `AuthenticatedUser` fixture
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for mocking
- `@/modules/auth/firebase-admin.service` — `FirebaseAdminService` for mocking
- `@/modules/auth/firebase-auth.guard` — `FirebaseAuthGuard` under test
- `@/modules/users/users.service` — `UsersService` for mocking
- `@/types/express.d` — `AuthenticatedUser` type for fixture

### Definitions

- `mockUser` (const) — fixture `AuthenticatedUser` representing a fully registered Chamuco user
- `mockDecodedToken` (const) — fixture decoded Firebase token
- `buildContext` (function) — constructs a minimal `ExecutionContext` mock with optional `Authorization` header and handler metadata; used across all guard test scenarios

### Exports

- none (test file)
