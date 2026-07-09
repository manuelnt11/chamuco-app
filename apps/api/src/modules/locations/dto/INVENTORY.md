# Inventory: dto

---

## city-search-query.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-transformer` — `Transform` for transforming input values before validation
- `class-validator` — `IsISO31661Alpha2`, `IsString`, `MinLength` for request validation decorators

### Definitions

- `CitySearchQueryDto` (class) — Query DTO for city autocomplete; validates `namePrefix` (string, min 2 chars) and `country` (ISO 3166-1 alpha-2, uppercased via Transform)

### Exports

- `CitySearchQueryDto` — named

---

## city-search-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `@chamuco/shared-types` — `CityResult` interface implemented by the response DTO

### Definitions

- `CityResultDto` (class) — Response DTO for a single city search result; implements `CityResult` with `name` (city name) and `region` (administrative region) fields

### Exports

- `CityResultDto` — named
