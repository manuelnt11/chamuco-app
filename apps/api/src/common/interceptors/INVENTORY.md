# Inventory: interceptors

---

## index.ts

### Imports

- `@/common/interceptors/support-admin-audit.interceptor` — `SupportAdminAuditInterceptor`

### Definitions

_No local definitions — barrel re-export only._

### Exports

- `SupportAdminAuditInterceptor` — barrel re-export from `support-admin-audit.interceptor`

---

## support-admin-audit.interceptor.ts

### Imports

- `@nestjs/common` — `CallHandler`, `ExecutionContext`, `Inject`, `Injectable`, `Logger`, `NestInterceptor`
- `@nestjs/core` — `Reflector` (reads handler/class metadata set by decorators)
- `drizzle-orm` — `InferSelectModel` (derives row type from schema), `sql` (tagged SQL template builder)
- `rxjs` — `Observable`, `catchError`, `from`, `mergeMap`, `tap`, `throwError` (reactive stream operators)
- `@/common/decorators/audit-target.decorator` — `AUDIT_TARGET_KEY`, `AuditTargetMetadata` (metadata key and shape for `@AuditTarget`)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and typed DB client)
- `@/modules/users/schema/support-admin-audit-log.schema` — `supportAdminAuditLog` (Drizzle table reference for audit entries)
- `@/modules/users/schema/users.schema` — `users` (Drizzle table reference used to type `AuthenticatedUser`)
- `@chamuco/shared-types` — `PlatformRole` (enum used to gate auditing to `SUPPORT_ADMIN`)

### Definitions

- `AuthenticatedUser` (type) — local alias for the inferred row type of the `users` table; scopes request user typing
- `WRITE_METHODS` (const) — `Set<string>` allowlist of HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) that trigger auditing
- `NIL_UUID` (const) — sentinel UUID `00000000-0000-0000-0000-000000000000` used as `target_id` when a POST fails before record creation
- `TABLE_NAME_RE` (const) — regex `^[a-z_][a-z0-9_]*$` that validates table names before passing them to `sql.raw()`
- `METHOD_TO_ACTION` (const) — maps HTTP method strings to human-readable action labels (`CREATE`, `UPDATE`, `DELETE`) stored in the audit log
- `SupportAdminAuditInterceptor` (interceptor) — NestJS interceptor that logs every write operation by a `SUPPORT_ADMIN` to `support_admin_audit_log`; short-circuits for non-admins and read-only methods; captures `before_state` via a pre-handler DB query and `after_state` from the response body; audit log failures never propagate to the caller

### Exports

- `SupportAdminAuditInterceptor` — named

---

## support-admin-audit.interceptor.spec.ts

### Imports

- `@nestjs/common` — `ExecutionContext`
- `@nestjs/core` — `Reflector`
- `rxjs` — `of`, `throwError` (create mock observable return values)
- `@/database/drizzle.provider` — `DrizzleClient` (type used for mock casting)
- `@chamuco/shared-types` — `PlatformRole`
- `./support-admin-audit.interceptor` — `SupportAdminAuditInterceptor` (class under test)

### Definitions

- `makeUser` (function) — factory that returns a minimal user object with a given `PlatformRole`
- `makeContext` (function) — factory that constructs a mock `ExecutionContext` with configurable HTTP method, user, params, and path
- `makeCallHandler` (function) — factory that returns a `CallHandler` whose `handle()` emits a single value via `of()`
- `makeThrowingCallHandler` (function) — factory that returns a `CallHandler` whose `handle()` errors via `throwError()`

### Exports

_No exports — test file only._
