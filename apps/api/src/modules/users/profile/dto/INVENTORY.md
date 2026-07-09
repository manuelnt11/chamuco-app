# Inventory: dto

---

## `calendar-date.validator.ts`

### Imports

- `class-validator` — `registerDecorator`, `ValidationArguments`, `ValidationOptions`, `ValidatorConstraint`, `ValidatorConstraintInterface`

### Definitions

- `DateFields` (interface) — local shape describing optional `month` and `year` fields read from the validation object
- `IsRealCalendarDayConstraint` (class) — `ValidatorConstraint` implementation; validates that a day value actually exists in the given month/year (e.g. rejects Feb 31)
- `IsRealCalendarDay` (function) — property decorator factory that registers `IsRealCalendarDayConstraint` on the target field

### Exports

- `IsRealCalendarDayConstraint` — named
- `IsRealCalendarDay` — named

---

## `calendar-date.validator.spec.ts`

### Imports

- `class-transformer` — `plainToInstance`
- `class-validator` — `validate`, `ValidationArguments`
- `./calendar-date.validator` — `IsRealCalendarDayConstraint`
- `./date-of-birth.dto` — `DateOfBirthDto`

### Definitions

- `validateDob` (function) — helper that constructs a `DateOfBirthDto` and returns flattened constraint error messages
- `makeArgs` (function) — helper that builds a minimal `ValidationArguments` stub for unit-testing the constraint directly

### Exports

- None

---

## `date-of-birth.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty`
- `class-validator` — `IsBoolean`, `IsInt`, `Max`, `Min`
- `@chamuco/shared-types` — `DateOfBirth` (type)
- `./calendar-date.validator` — `IsRealCalendarDay`

### Definitions

- `DateOfBirthDto` (class) — validated DTO for a structured date of birth with `day`, `month`, `year`, and `yearVisible`; implements `DateOfBirth`; `day` is additionally constrained by the calendar validator

### Exports

- `DateOfBirthDto` — named

---

## `minimum-age.validator.spec.ts`

### Imports

- `class-transformer` — `plainToInstance`, `Type`
- `class-validator` — `IsObject`, `validate`, `ValidateNested`
- `./minimum-age.validator` — `computeAge`, `IsMinimumAge`
- `./date-of-birth.dto` — `DateOfBirthDto`

### Definitions

- `TestDto` (class) — local fixture DTO applying `@IsMinimumAge(16)` to a nested `DateOfBirthDto` field
- `dobOf` (function) — helper that builds a `DateOfBirth`-shaped object offset by a given number of years (plus optional day offset) relative to today

### Exports

- None

---

## `minimum-age.validator.ts`

### Imports

- `class-validator` — `registerDecorator`, `ValidationArguments`, `ValidationOptions`
- `@chamuco/shared-utils` — `computeAge` (aliased as `computeAgeFromDob`)

### Definitions

- `DateLike` (interface) — local shape with `day`, `month`, `year` number fields
- `computeAge` (function) — wraps `computeAgeFromDob`; returns `-1` for null, non-object, or non-finite input; otherwise returns age in whole years
- `IsMinimumAge` (function) — property decorator factory that registers an inline validator enforcing a configurable minimum age against a nested date-of-birth value

### Exports

- `IsMinimumAge` — named
- `computeAge` — named

---

## `update-user-profile.dto.spec.ts`

### Imports

- `reflect-metadata` — side-effect import for decorator metadata
- `class-transformer` — `plainToInstance`
- `class-validator` — `validate`
- `./update-user-profile.dto` — `UpdateUserProfileDto`

### Definitions

- None (all logic is inside `describe`/`it` blocks)

### Exports

- None

---

## `update-user-profile.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty`
- `class-transformer` — `Transform`, `Type`
- `class-validator` — `IsEmail`, `IsOptional`, `IsString`, `Matches`, `MaxLength`, `MinLength`, `ValidateNested`
- `./date-of-birth.dto` — `DateOfBirthDto`
- `@/common/transforms/name.transform` — `sanitizeProperNoun`

### Definitions

- `UpdateUserProfileDto` (class) — PATCH request body for updating a user's profile; all fields optional; covers `firstName`, `lastName`, `dateOfBirth`, `birthCountry`, `birthCity`, `homeCountry`, `homeCity`, `email`, `phoneCountryCode`, `phoneLocalNumber`, and `bio`; name and city fields are uppercased via `sanitizeProperNoun`

### Exports

- `UpdateUserProfileDto` — named

---

## `user-profile-response.dto.ts`

### Imports

- `@nestjs/swagger` — `ApiProperty`
- `./date-of-birth.dto` — `DateOfBirthDto`

### Definitions

- `UserProfileResponseDto` (class) — response DTO for the user profile endpoint; exposes `firstName`, `lastName`, `dateOfBirth`, `birthCountry`, `birthCity`, `homeCountry`, `homeCity`, `email`, `emailVerified`, `phoneCountryCode`, `phoneLocalNumber`, `phoneVerified`, and `bio`

### Exports

- `UserProfileResponseDto` — named
