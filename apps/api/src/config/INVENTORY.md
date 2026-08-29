# Inventory: config

---

## config.module.ts

### Imports

- `@nestjs/common` — `Module` decorator for defining NestJS modules
- `@nestjs/config` — `ConfigModule` (aliased as `NestConfigModule`) for loading and exposing environment config
- `@/config/environment.schema` — `validate` function used to validate env vars at startup

### Definitions

- `ConfigModule` (module) — Wraps `NestConfigModule.forRoot` with `isGlobal: true` and the custom `validate` function; makes config globally available across the app

### Exports

- `ConfigModule` — named

---

## environment.schema.spec.ts

### Imports

- `reflect-metadata` — required for `class-transformer`/`class-validator` decorator reflection
- `@/config/environment.schema` — `validate` function under test

### Definitions

- `baseEnv` (const) — Minimal valid environment object used as baseline for test cases across all `describe` blocks

### Exports

- _(none — test file only)_

---

## environment.schema.ts

### Imports

- `class-transformer` — `plainToClass` for transforming plain objects into typed class instances
- `class-validator` — `IsEnum`, `IsJSON`, `IsNotEmpty`, `IsNumber`, `IsBoolean`, `IsOptional`, `IsString`, `Matches`, `Min`, `Max`, `validateSync` decorators for runtime validation

### Definitions

- `Environment` (enum) — Declares `Development`, `Production`, and `Test` environment values; used to constrain `NODE_ENV`
- `EnvironmentVariables` (class) — Decorated class holding all required and optional env vars with validation rules; covers `NODE_ENV`, `PORT`, `SWAGGER_ENABLED`, `DATABASE_URL`, `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `GEONAMES_USERNAME`, `CORS_ORIGIN`, `GOOGLE_CLOUD_STORAGE_BUCKET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FRONTEND_URL`, and `CHROMIUM_EXECUTABLE_PATH` (optional, defaults to `/usr/bin/chromium-browser`, the Alpine `apk add chromium` path used by `TripItineraryPdfService`)
- `validate` (function) — Transforms a plain config record into an `EnvironmentVariables` instance, runs `validateSync`, and throws a descriptive error if validation fails; used by `ConfigModule`

### Exports

- `validate` — named
