# Inventory: dto

---

## health-description.validator.ts

### Imports

- `class-validator` — `registerDecorator`, `ValidationArguments`, `ValidationOptions` for building custom class-validator decorators

### Definitions

- `IsHealthDescription` (function) — Custom property decorator factory that conditionally requires a non-empty description when an associated enum field equals a specified "other" value, and otherwise allows null/undefined up to a max length

### Exports

- `IsHealthDescription` — named

---

## health-items.dto.spec.ts

### Imports

- `class-validator` — `validate` for running validation on DTO instances
- `class-transformer` — `plainToInstance` for transforming plain objects into DTO class instances
- `@chamuco/shared-types` — `FoodAllergen`, `MedicalConditionType`, `PhobiaType`, `PhysicalLimitationType` enums used as test fixtures
- `./health-items.dto` — `FoodAllergyItemDto`, `MedicalConditionItemDto`, `PhobiaItemDto`, `PhysicalLimitationItemDto` DTOs under test
- `./update-user-health.dto` — `UpdateUserHealthDto` for testing nested transformation

### Definitions

- `describe('FoodAllergyItemDto', ...)` — 7 test cases covering valid enum values, OTHER+description requirement, length limits, and unknown enum rejection
- `describe('PhobiaItemDto', ...)` — 5 test cases covering valid/invalid phobia+description combinations
- `describe('PhysicalLimitationItemDto', ...)` — 5 test cases covering valid/invalid limitation+description combinations
- `describe('MedicalConditionItemDto', ...)` — 5 test cases covering valid/invalid condition+description combinations
- `describe('UpdateUserHealthDto — @Type factories', ...)` — 2 test cases verifying nested array transformation and all-optional behavior

### Exports

- (none — test file)

---

## health-items.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation on DTO fields
- `@chamuco/shared-types` — `FoodAllergen`, `MedicalConditionType`, `PhobiaType`, `PhysicalLimitationType` enums for field typing and validation
- `class-validator` — `IsEnum` for enum membership validation
- `./health-description.validator` — `IsHealthDescription` custom validator for conditional description requirement

### Definitions

- `FoodAllergyItemDto` (class) — DTO representing a single food allergy entry with an allergen enum and optional/required description
- `PhobiaItemDto` (class) — DTO representing a single phobia entry with a phobia enum and optional/required description
- `PhysicalLimitationItemDto` (class) — DTO representing a single physical limitation entry with a limitation enum and optional/required description
- `MedicalConditionItemDto` (class) — DTO representing a single medical condition entry with a condition enum and optional/required description

### Exports

- `FoodAllergyItemDto` — named
- `PhobiaItemDto` — named
- `PhysicalLimitationItemDto` — named
- `MedicalConditionItemDto` — named

---

## update-user-health.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation
- `@chamuco/shared-types` — `BloodType`, `DietaryPreference` enums for blood type and diet fields
- `class-transformer` — `Type` for enabling nested object transformation on array fields
- `class-validator` — `IsArray`, `IsEnum`, `IsOptional`, `IsString`, `MaxLength`, `ValidateNested` for input validation
- `./health-items.dto` — `FoodAllergyItemDto`, `MedicalConditionItemDto`, `PhobiaItemDto`, `PhysicalLimitationItemDto` for nested array DTOs

### Definitions

- `UpdateUserHealthDto` (class) — Request DTO for updating a user's health profile; all fields are optional and cover blood type, dietary preference, dietary notes, general medical notes, and arrays of allergen/phobia/limitation/condition items

### Exports

- `UpdateUserHealthDto` — named

---

## user-health-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI documentation
- `@chamuco/shared-types` — `BloodType`, `DietaryPreference` enums for response field typing
- `./health-items.dto` — `FoodAllergyItemDto`, `MedicalConditionItemDto`, `PhobiaItemDto`, `PhysicalLimitationItemDto` for nested response arrays

### Definitions

- `UserHealthResponseDto` (class) — Response DTO representing a user's full health profile, including blood type, dietary preference, notes, and arrays of allergen/phobia/limitation/condition items

### Exports

- `UserHealthResponseDto` — named
