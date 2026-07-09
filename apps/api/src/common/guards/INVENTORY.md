# Inventory: guards

---

## index.ts

### Imports

- `@/modules/auth/firebase-auth.guard` — FirebaseAuthGuard
- `@/common/guards/roles.guard` — RolesGuard
- `@/common/guards/user-throttler.guard` — UserThrottlerGuard

### Definitions

_No local definitions — barrel re-export file only._

### Exports

- `FirebaseAuthGuard` — barrel re-export from `@/modules/auth/firebase-auth.guard`
- `RolesGuard` — barrel re-export from `@/common/guards/roles.guard`
- `UserThrottlerGuard` — barrel re-export from `@/common/guards/user-throttler.guard`

---

## roles.guard.ts

### Imports

- `@nestjs/common` — `CanActivate`, `ExecutionContext`, `ForbiddenException`, `Injectable`, `Logger`
- `@nestjs/core` — `Reflector` (reads handler/class metadata)
- `@chamuco/shared-types` — `PlatformRole` (enum of platform-level roles)
- `@/common/decorators/roles.decorator` — `ROLES_KEY` (metadata key set by `@Roles()` decorator)
- `express` — `Request` (type-only; used to type the HTTP request object)

### Definitions

- `RolesGuard` (guard) — Reads `@Roles()` metadata via `Reflector`; allows `SUPPORT_ADMIN` unconditionally, denies unauthenticated requests and users whose `platformRole` is not in the required list, throws `ForbiddenException` on denial

### Exports

- `RolesGuard` — named

---

## roles.guard.spec.ts

### Imports

- `@nestjs/common` — `ExecutionContext`, `ForbiddenException`
- `@nestjs/core` — `Reflector`
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `AuthProvider`, `PlatformRole`, `ProfileVisibility`
- `@/common/guards/roles.guard` — `RolesGuard` (subject under test)
- `@/types/express.d` — `AuthenticatedUser` (type-only; used to build mock request users)

### Definitions

- `buildUser` (function) — Factory that constructs a mock `AuthenticatedUser` with a given `PlatformRole`
- `buildContext` (function) — Factory that constructs a mock `ExecutionContext` wrapping a request with an optional user

### Exports

_No exports — test file._

---

## user-throttler.guard.ts

### Imports

- `@nestjs/common` — `Injectable`
- `@nestjs/throttler` — `ThrottlerGuard` (base class providing rate-limiting logic)

### Definitions

- `UserThrottlerGuard` (guard) — Extends `ThrottlerGuard`; overrides `getTracker` to key rate-limiting by `user.id` when authenticated, falling back to `req.ip`, then `socket.remoteAddress`, then `'unknown'`

### Exports

- `UserThrottlerGuard` — named

---

## user-throttler.guard.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule`
- `@nestjs/throttler` — `ThrottlerModule` (configured in-test with a short TTL)
- `@/common/guards/user-throttler.guard` — `UserThrottlerGuard` (subject under test)

### Definitions

_No substantial non-exported definitions._

### Exports

_No exports — test file._
