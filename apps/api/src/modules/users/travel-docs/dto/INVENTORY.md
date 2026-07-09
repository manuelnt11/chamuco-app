# Inventory: dto

---

## date-after.validator.ts

### Imports

- `class-validator` — `registerDecorator`, `ValidationArguments`, `ValidationOptions`, `ValidatorConstraint`, `ValidatorConstraintInterface` for building a custom property decorator

### Definitions

- `IsDateAfterConstraint` (class) — `ValidatorConstraintInterface` that checks whether a date string property is strictly after another named property on the same object; skips validation when either value is absent or not a parseable date
- `IsDateAfter` (function) — Factory function that registers `IsDateAfterConstraint` as a property decorator; accepts the related property name and optional `ValidationOptions`

### Exports

- `IsDateAfterConstraint` — named
- `IsDateAfter` — named

---

## date-after.validator.spec.ts

### Imports

- `class-validator` — `ValidationArguments` for constructing test argument objects
- `./date-after.validator` — `IsDateAfterConstraint` under test

### Definitions

- (test suite only — no substantial non-test declarations)

### Exports

- (none)

---

## eta.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-validator` — `IsDateString`, `IsEnum`, `IsNotEmpty`, `IsOptional`, `IsString`, `Matches` for request validation
- `@chamuco/shared-types` — `DocumentStatus`, `EtaType`, `VisaEntries` enums
- `@chamuco/shared-utils` — `DOCUMENT_ID_FORMAT_REGEX` regex for document ID format validation

### Definitions

- `EtaResponseDto` (class) — Response shape for an ETA record; all fields annotated with `@ApiProperty`; includes computed `etaStatus`
- `CreateEtaDto` (class) — Request body for creating an ETA; validates `destinationCountry` (2-letter ISO), `authorizationNumber` (DOCUMENT_ID_FORMAT_REGEX), `etaType`, `entries`, `expiryDate`, and optional `notes`
- `UpdateEtaDto` (class) — Partial request body for updating an ETA; all fields optional; validates same constraints as `CreateEtaDto` where present

### Exports

- `EtaResponseDto` — named
- `CreateEtaDto` — named
- `UpdateEtaDto` — named

---

## eta.dto.spec.ts

### Imports

- `class-validator` — `validate` for running decorator-based validation
- `class-transformer` — `plainToInstance` for constructing DTO instances from plain objects
- `@chamuco/shared-types` — `EtaType`, `VisaEntries` enums used in test fixtures
- `./eta.dto` — `CreateEtaDto`, `UpdateEtaDto` under test

### Definitions

- (test suite only — no substantial non-test declarations)

### Exports

- (none)

---

## nationality.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-validator` — `IsBoolean`, `IsDefined`, `IsDateString`, `IsNotEmpty`, `IsOptional`, `IsString`, `Matches`, `ValidateIf` for request validation
- `@chamuco/shared-types` — `PassportStatus` enum
- `@chamuco/shared-utils` — `DOCUMENT_ID_FORMAT_REGEX` regex for document ID format validation
- `./date-after.validator` — `IsDateAfter` custom decorator to enforce expiry after issue date
- `./not-future-date.validator` — `IsNotFutureDate` custom decorator to block future issue dates

### Definitions

- `anyPassportFieldPresent` (const) — Local predicate used by `ValidateIf`; returns `true` when any of `passportNumber`, `passportIssueDate`, or `passportExpiryDate` is present, triggering all-or-nothing passport field validation
- `NationalityResponseDto` (class) — Response shape for a nationality record including optional passport fields and computed `passportStatus`
- `CreateNationalityDto` (class) — Request body for adding a nationality; enforces that if any passport field is provided all three must be present; `passportIssueDate` must not be a future date; `passportExpiryDate` must be after `passportIssueDate`
- `UpdateNationalityDto` (class) — Partial request body for updating a nationality; same passport consistency rules as `CreateNationalityDto`; `countryCode` is not updatable

### Exports

- `NationalityResponseDto` — named
- `CreateNationalityDto` — named
- `UpdateNationalityDto` — named

---

## nationality.dto.spec.ts

### Imports

- `reflect-metadata` — side-effect import required for decorator metadata at test runtime
- `class-transformer` — `plainToInstance` for constructing DTO instances from plain objects
- `class-validator` — `validate` for running decorator-based validation
- `./nationality.dto` — `CreateNationalityDto`, `UpdateNationalityDto` under test

### Definitions

- (test suite only — no substantial non-test declarations)

### Exports

- (none)

---

## not-future-date.validator.ts

### Imports

- `class-validator` — `registerDecorator`, `ValidationArguments`, `ValidationOptions`, `ValidatorConstraint`, `ValidatorConstraintInterface` for building a custom property decorator

### Definitions

- `IsNotFutureDateConstraint` (class) — `ValidatorConstraintInterface` that rejects date strings representing a date after today (UTC ISO comparison); skips when value is absent, not a string, or not a parseable date
- `IsNotFutureDate` (function) — Factory function that registers `IsNotFutureDateConstraint` as a property decorator; accepts optional `ValidationOptions`

### Exports

- `IsNotFutureDateConstraint` — named
- `IsNotFutureDate` — named

---

## not-future-date.validator.spec.ts

### Imports

- `class-validator` — `ValidationArguments` for constructing test argument objects
- `./not-future-date.validator` — `IsNotFutureDateConstraint` under test

### Definitions

- (test suite only — no substantial non-test declarations)

### Exports

- (none)

---

## visa.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-validator` — `IsDefined`, `IsDateString`, `IsEnum`, `IsNotEmpty`, `IsOptional`, `IsString`, `Matches`, `ValidateIf` for request validation
- `@chamuco/shared-types` — `DocumentStatus`, `VisaCoverageType`, `VisaEntries`, `VisaType`, `VisaZone` enums

### Definitions

- `VisaResponseDto` (class) — Response shape for a visa record; includes computed `visaStatus`; `countryCode` and `visaZone` are nullable depending on `coverageType`
- `CreateVisaDto` (class) — Request body for creating a visa; `countryCode` is required when `coverageType` is `COUNTRY`; `visaZone` is required when `coverageType` is `ZONE`; validates `visaType`, `entries`, `expiryDate`, and optional `notes`
- `UpdateVisaDto` (class) — Partial request body for updating a visa; `visaType`, `entries`, `expiryDate`, and `notes` are all optional; coverage type and country/zone are not updatable

### Exports

- `VisaResponseDto` — named
- `CreateVisaDto` — named
- `UpdateVisaDto` — named

---

## visa.dto.spec.ts

### Imports

- `class-validator` — `validate` for running decorator-based validation
- `class-transformer` — `plainToInstance` for constructing DTO instances from plain objects
- `@chamuco/shared-types` — `VisaCoverageType`, `VisaEntries`, `VisaType`, `VisaZone` enums used in test fixtures
- `./visa.dto` — `CreateVisaDto`, `UpdateVisaDto` under test

### Definitions

- (test suite only — no substantial non-test declarations)

### Exports

- (none)
