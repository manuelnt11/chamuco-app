# Inventory: health

---

## health.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule`: NestJS test harness for building isolated module instances
- `@nestjs/terminus` — `HealthCheckService`, `HealthCheckResult`: health check service mock and result type
- `@/modules/health/health.controller` — `HealthController`: the subject under test

### Definitions

- `HealthController` (describe block) — unit tests verifying the controller is defined and that `check()` delegates to `HealthCheckService.check([])` and returns the result

### Exports

- _(none — test file, no exports)_

---

## health.controller.ts

### Imports

- `@nestjs/common` — `Controller`, `Get`: route registration decorators
- `@nestjs/swagger` — `ApiTags`, `ApiOperation`, `ApiResponse`: OpenAPI documentation decorators
- `@nestjs/terminus` — `HealthCheck`, `HealthCheckService`, `HealthCheckResult`: terminus health check decorator, service, and return type
- `@/common/decorators/public.decorator` — `Public`: marks the endpoint as unauthenticated (bypasses JWT guard)

### Definitions

- `HealthController` (controller) — NestJS controller registered at `GET /health`; exposes a single public readiness-probe endpoint that delegates to `HealthCheckService.check([])`

### Exports

- `HealthController` — named

---

## health.module.ts

### Imports

- `@nestjs/common` — `Module`: NestJS module decorator
- `@nestjs/terminus` — `TerminusModule`: provides `HealthCheckService` and related providers
- `@/modules/health/health.controller` — `HealthController`: controller registered by this module

### Definitions

- `HealthModule` (module) — NestJS feature module that wires `TerminusModule` and `HealthController` together for the readiness-probe endpoint

### Exports

- `HealthModule` — named
