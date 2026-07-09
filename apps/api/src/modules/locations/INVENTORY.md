# Inventory: locations

---

## locations.controller.ts

### Imports

- `@nestjs/common` — `Controller`, `Get`, `Query` (routing and parameter decorators)
- `@nestjs/swagger` — `ApiBearerAuth`, `ApiOperation`, `ApiResponse`, `ApiTags` (OpenAPI documentation decorators)
- `@nestjs/throttler` — `Throttle` (rate-limiting decorator)
- `@/common/decorators` — `FirebaseOnly` (guard decorator requiring a valid Firebase ID token)
- `@/modules/locations/dto/city-search-query.dto` — `CitySearchQueryDto` (validated query DTO)
- `@/modules/locations/dto/city-search-response.dto` — `CityResultDto` (response shape)
- `@/modules/locations/locations.service` — `LocationsService` (business logic)

### Definitions

- `LocationsController` (controller) — REST controller at `v1/locations`; exposes `GET /cities` to search cities by name prefix via GeoNames, protected by Firebase auth and throttled to 30 req/min

### Exports

- `LocationsController` — named

---

## locations.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@/modules/locations/dto/city-search-response.dto` — `CityResultDto` (type used in assertions)
- `@/modules/locations/locations.controller` — `LocationsController` (unit under test)
- `@/modules/locations/locations.service` — `LocationsService` (mocked dependency)

### Definitions

- `LocationsController` describe block (function) — unit tests for `searchCities`: verifies delegation to service, passes query params, and handles empty results

### Exports

- _(none — test file)_

---

## locations.module.ts

### Imports

- `@nestjs/common` — `Module` (module decorator)
- `@/modules/locations/locations.controller` — `LocationsController`
- `@/modules/locations/locations.service` — `LocationsService`

### Definitions

- `LocationsModule` (module) — NestJS feature module that registers `LocationsController` and `LocationsService`

### Exports

- `LocationsModule` — named

---

## locations.service.ts

### Imports

- `@nestjs/common` — `Injectable`, `Logger` (DI decorator and structured logger)
- `@/modules/locations/dto/city-search-response.dto` — `CityResultDto` (return type)

### Definitions

- `GeonamesResponse` (interface) — internal shape of the GeoNames `searchJSON` API response; fields: `geonames` (optional array of `{ name, adminName1?, population? }`)
- `LocationsService` (service) — queries the GeoNames `searchJSON` endpoint by `name_startsWith` + `country`; filters to populated places (`featureClass=P`), orders by population, returns up to 10 `CityResultDto` results; returns `[]` on non-OK HTTP status or network error

### Exports

- `LocationsService` — named

---

## locations.service.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` (NestJS test harness)
- `@/modules/locations/locations.service` — `LocationsService` (unit under test)

### Definitions

- `LocationsService` describe block (function) — unit tests for `searchCities`: covers successful transformation, correct query params, non-OK response, network error, missing `adminName1`, and absent `geonames` field; mocks `global.fetch`

### Exports

- _(none — test file)_
