# Inventory: dto

---

## calendar-date.validator.ts

### Imports

- `class-validator` — `registerDecorator`, `ValidationArguments`, `ValidationOptions`, `ValidatorConstraint`, `ValidatorConstraintInterface` for building custom constraint classes and decorator factories

### Definitions

- `DateFields` (interface) — Internal shape describing optional `month` and `year` used inside `ValidationArguments.object`
- `IsRealCalendarDayConstraint` (class) — `ValidatorConstraint` that verifies a numeric day value actually exists on the calendar for the sibling `month`/`year` fields; uses `Date` round-trip to detect invalid dates like Feb 30
- `IsRealCalendarDay` (function) — Property decorator factory that registers `IsRealCalendarDayConstraint` via `registerDecorator`

### Exports

- `IsRealCalendarDayConstraint` — named
- `IsRealCalendarDay` — named

---

## calendar-date.validator.spec.ts

### Imports

- `class-transformer` — `plainToInstance` for DTO instantiation in tests
- `class-validator` — `validate`, `ValidationArguments` for running validation and constructing argument stubs
- `./calendar-date.validator` — `IsRealCalendarDayConstraint` (class under test)
- `./date-of-birth.dto` — `DateOfBirthDto` (integration fixture)

### Definitions

- `validateDob` (function) — Test helper that instantiates `DateOfBirthDto` and returns flattened constraint error messages
- `makeArgs` (function) — Test helper that builds a minimal `ValidationArguments` stub for unit-testing the constraint directly

### Exports

- _(none — test file)_

---

## date-of-birth.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-validator` — `IsBoolean`, `IsInt`, `Max`, `Min` for field-level validation decorators
- `@chamuco/shared-types` — `DateOfBirth` interface that this DTO implements
- `./calendar-date.validator` — `IsRealCalendarDay` custom validator applied to `day`

### Definitions

- `DateOfBirthDto` (class) — Validated DTO for a date of birth split into `day`, `month`, `year`, and `yearVisible` fields; `day` is additionally constrained by the calendar validator

### Exports

- `DateOfBirthDto` — named

---

## minimum-age.validator.spec.ts

### Imports

- `class-transformer` — `plainToInstance`, `Type` for DTO instantiation and nested type resolution
- `class-validator` — `IsObject`, `validate`, `ValidateNested` for building the `TestDto` fixture and running validation
- `./minimum-age.validator` — `computeAge`, `IsMinimumAge` (functions under test)
- `./date-of-birth.dto` — `DateOfBirthDto` as nested property type in `TestDto`

### Definitions

- `TestDto` (class) — Local fixture class that applies `@IsMinimumAge(16)` to a nested `DateOfBirthDto` field
- `dobOf` (function) — Test helper that builds a `DateOfBirth`-shaped object offset by the given number of years (and optional day offset) relative to today

### Exports

- _(none — test file)_

---

## minimum-age.validator.ts

### Imports

- `class-validator` — `registerDecorator`, `ValidationArguments`, `ValidationOptions` for building the inline validator and decorator factory

### Definitions

- `DateLike` (interface) — Internal shape describing `{ day, month, year }` used for age computation
- `computeAge` (function) — Computes integer age from a `DateLike`-shaped value; returns `-1` for null, non-object, or non-finite fields
- `IsMinimumAge` (function) — Property decorator factory that registers an inline validator enforcing a configurable minimum age against a nested `DateOfBirthDto`-shaped value

### Exports

- `IsMinimumAge` — named
- `computeAge` — named

---

## update-user-profile.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-transformer` — `Transform`, `Type` for sanitizing and transforming field values
- `class-validator` — `IsEmail`, `IsOptional`, `IsString`, `Matches`, `MaxLength`, `MinLength`, `ValidateNested` for field validation
- `./date-of-birth.dto` — `DateOfBirthDto` for the nested `dateOfBirth` field
- `@/common/transforms/name.transform` — `sanitizeProperNoun` transform (trim, collapse spaces, uppercase)

### Definitions

- `UpdateUserProfileDto` (class) — Partial-update DTO for user profile; all fields optional; covers `firstName`, `lastName`, `dateOfBirth`, `birthCountry`, `birthCity`, `homeCountry`, `homeCity`, `email`, `phoneCountryCode`, `phoneLocalNumber`, and `bio`

### Exports

- `UpdateUserProfileDto` — named

---

## update-user-profile.dto.spec.ts

### Imports

- `reflect-metadata` — side-effect import required for decorator metadata
- `class-transformer` — `plainToInstance` for DTO instantiation
- `class-validator` — `validate` for running validation
- `./update-user-profile.dto` — `UpdateUserProfileDto` (class under test)

### Definitions

- _(no standalone declarations — all logic is inside `describe`/`it` blocks)_

### Exports

- _(none — test file)_

---

## user-profile-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `./date-of-birth.dto` — `DateOfBirthDto` for the nested `dateOfBirth` field

### Definitions

- `UserProfileResponseDto` (class) — Response DTO for the user profile endpoint; exposes `firstName`, `lastName`, `dateOfBirth`, `birthCountry`, `birthCity`, `homeCountry`, `homeCity`, `email`, `emailVerified`, `phoneCountryCode`, `phoneLocalNumber`, `phoneVerified`, and `bio`

### Exports

- `UserProfileResponseDto` — named
