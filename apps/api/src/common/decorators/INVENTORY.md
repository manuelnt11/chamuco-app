# Inventory: decorators

---

## audit-target.decorator.ts

### Imports

- `@nestjs/common` — `SetMetadata` for attaching metadata to route handlers

### Definitions

- `AuditTargetMetadata` (interface) — shape of the metadata object: `table` (DB table name) and `idParam` (route param key, defaults to `'id'`)
- `AUDIT_TARGET_KEY` (const) — metadata key string `'auditTarget'` used by `SupportAdminAuditInterceptor` to read the metadata
- `AuditTarget` (decorator) — method decorator that stores table + idParam metadata so the audit interceptor can capture before/after state; falls back to URL heuristic when absent

### Exports

- `AuditTargetMetadata` — named
- `AUDIT_TARGET_KEY` — named
- `AuditTarget` — named

---

## current-user.decorator.ts

### Imports

- `@nestjs/common` — `createParamDecorator`, `ExecutionContext` for building a custom param decorator
- `express` — `Request` type (type-only import)
- `@/types/express.d` — `AuthenticatedUser` type (type-only import) representing the authenticated user shape on `req.user`

### Definitions

- `CurrentUser` (decorator) — custom param decorator that extracts `request.user` (typed as `AuthenticatedUser | undefined`) from the HTTP execution context

### Exports

- `CurrentUser` — named

---

## decorators.spec.ts

### Imports

- `@nestjs/common` — `ExecutionContext` for mock context typing
- `@nestjs/core` — `Reflector` for reading Reflect metadata in tests
- `@chamuco/shared-types` — `PlatformRole` enum used in `@Roles` test cases
- `@/common/decorators/audit-target.decorator` — `AuditTarget`, `AUDIT_TARGET_KEY`
- `@/common/decorators/current-user.decorator` — `CurrentUser`
- `@/common/decorators/public.decorator` — `IS_PUBLIC_KEY`, `Public`
- `@/common/decorators/roles.decorator` — `ROLES_KEY`, `Roles`

### Definitions

- `applyToHandler` (function) — test helper that applies a `MethodDecorator` to a stub controller method so `Reflector` can read its metadata; used by `@Public`, `@Roles`, and `@AuditTarget` tests
- `extractCurrentUserFactory` (function) — extracts the NestJS param-decorator factory from `__routeArguments__` Reflect metadata on a dummy controller; allows unit-testing the `@CurrentUser` factory body without a full HTTP pipeline

### Exports

- (none — spec file)

---

## firebase-only.decorator.ts

### Imports

- `@nestjs/common` — `SetMetadata` for attaching route metadata

### Definitions

- `IS_FIREBASE_ONLY_KEY` (const) — metadata key string `'isFirebaseOnly'`
- `FirebaseOnly` (decorator) — method decorator that marks a route as Firebase-authenticated only by setting `IS_FIREBASE_ONLY_KEY` to `true`; used by guards to differentiate Firebase-only vs. standard auth routes

### Exports

- `IS_FIREBASE_ONLY_KEY` — named
- `FirebaseOnly` — named

---

## index.ts

### Imports

- (none — barrel re-export file)

### Definitions

- (none)

### Exports

- `Public`, `IS_PUBLIC_KEY` — barrel re-export from `./public.decorator`
- `Roles`, `ROLES_KEY` — barrel re-export from `./roles.decorator`
- `CurrentUser` — barrel re-export from `./current-user.decorator`
- `AuditTarget`, `AUDIT_TARGET_KEY` — barrel re-export from `./audit-target.decorator`
- `AuditTargetMetadata` — barrel re-export (type) from `./audit-target.decorator`
- `FirebaseOnly`, `IS_FIREBASE_ONLY_KEY` — barrel re-export from `./firebase-only.decorator`

---

## public.decorator.ts

### Imports

- `@nestjs/common` — `SetMetadata` for attaching route metadata

### Definitions

- `IS_PUBLIC_KEY` (const) — metadata key string `'isPublic'`
- `Public` (decorator) — method decorator that marks a route as publicly accessible (no auth required) by setting `IS_PUBLIC_KEY` to `true`; read by the JWT/Firebase auth guard to skip token verification

### Exports

- `IS_PUBLIC_KEY` — named
- `Public` — named

---

## roles.decorator.ts

### Imports

- `@nestjs/common` — `SetMetadata` for attaching metadata to route handlers
- `@chamuco/shared-types` — `PlatformRole` enum defining valid platform-level roles (`USER`, `SUPPORT_ADMIN`, etc.)

### Definitions

- `ROLES_KEY` (const) — metadata key string `'roles'`
- `Roles` (decorator) — method decorator that stores one or more `PlatformRole` values under `ROLES_KEY`; read by the roles guard to enforce access control on a handler

### Exports

- `ROLES_KEY` — named
- `Roles` — named
