# Inventory: validators

---

## cover-target.validator.ts

### Imports

- `class-validator` — `registerDecorator`, `ValidationArguments`, `ValidationOptions` for building a custom class-validator decorator

### Definitions

- `MAX_EMOJI_LENGTH` (const) — Internal constant (8) capping the maximum character length for emoji cover targets
- `IsValidCoverTarget` (decorator) — Custom property decorator that validates the `target` field on cover DTOs; enforces non-empty string, and when `source === 'emoji'` enforces a max length of 8 characters; replaces the combination of `@IsString`, `@IsNotEmpty`, `@ValidateIf`, and `@MaxLength(8)` which would conflict due to `@ValidateIf` skipping all validators when the condition is false

### Exports

- `IsValidCoverTarget` — named

---

## cover-target.validator.spec.ts

### Imports

- `class-validator` — `validate` for running class-validator on a DTO instance
- `./cover-target.validator` — `IsValidCoverTarget` decorator under test

### Definitions

- `TestDto` (class) — Local test fixture DTO with `source` and `target` fields; `target` is decorated with `@IsValidCoverTarget()`
- `runValidation` (function) — Helper that assigns `source` and `target` onto a `TestDto` instance and runs `validate()`, returning the errors array

### Exports

- _(none — test file only)_
