# Inventory: src

---

## app.module.ts

### Imports

- `@nestjs/common` — `Module` decorator
- `@nestjs/core` — `APP_GUARD`, `APP_INTERCEPTOR` tokens for global providers
- `@nestjs/schedule` — `ScheduleModule` for cron job support
- `@nestjs/throttler` — `ThrottlerModule` for rate limiting
- `nestjs-i18n` — `I18nModule` for backend internationalization
- `path` — `path.join` for resolving i18n translation file directory
- `@/config/config.module` — `ConfigModule` for environment config
- `@/modules/email/email.module` — `EmailModule` for transactional email
- `@/common/interceptors` — `SupportAdminAuditInterceptor` global interceptor
- `@/common/guards` — `UserThrottlerGuard` global rate-limit guard
- `@/database/database.module` — `DatabaseModule` for Drizzle/PostgreSQL
- `@/modules/auth/auth.module` — `AuthModule` for Firebase auth
- `@/modules/feedback/feedback.module` — `FeedbackModule` for GitHub issue creation
- `@/modules/health/health.module` — `HealthModule` for readiness probe
- `@/modules/locations/locations.module` — `LocationsModule` for city search
- `@/modules/jobs/jobs.module` — `JobsModule` for scheduled jobs
- `@/modules/users/users.module` — `UsersModule` for user domain
- `@/modules/assets/assets.module` — `AssetsModule` for asset resolution
- `@/modules/cloud-storage/cloud-storage.module` — `CloudStorageModule` for GCS
- `@/modules/groups/groups.module` — `GroupsModule` for group domain
- `@/modules/trips/trips.module` — `TripsModule` for trip domain
- `@/modules/uploads/uploads.module` — `UploadsModule` for signed URL generation
- `@/modules/invitation-tokens/invitation-tokens.module` — `InvitationTokensModule` for shareable invite links
- `@/i18n/i18n.module` — `I18nHelperModule` for i18n helper utilities

### Definitions

- `AppModule` (module) — Root NestJS module; composes all feature modules, registers global throttler (100 req/60 s), mounts `UserThrottlerGuard` and `SupportAdminAuditInterceptor` globally, and configures `nestjs-i18n` with English fallback.

### Exports

- `AppModule` — named

---

## main.ts

### Imports

- `reflect-metadata` — polyfill required by NestJS decorators
- `@nestjs/core` — `NestFactory` for bootstrapping the application
- `@nestjs/common` — `ValidationPipe` for global request validation
- `@nestjs/swagger` — `SwaggerModule`, `DocumentBuilder` for OpenAPI docs
- `@/app.module` — `AppModule` root module

### Definitions

- `bootstrap` (function) — Async entry point; creates the NestJS app, configures CORS from `CORS_ORIGIN` env var, registers a global `ValidationPipe` (whitelist + transform), conditionally mounts Swagger UI at `/docs` when `SWAGGER_ENABLED=true`, and starts the HTTP server on `PORT` (default 3000).

### Exports

- _(none — module calls `bootstrap()` directly as a side effect)_
