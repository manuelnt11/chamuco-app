# Inventory: dto

---

## loyalty-program.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` (OpenAPI field annotation), `OmitType` (exclude fields from base DTO), `PartialType` (make all fields optional)
- `class-transformer` — `Transform` (trim string values before validation)
- `class-validator` — `IsOptional`, `IsString`, `IsUUID`, `MaxLength`, `MinLength` (field validation decorators)

### Definitions

- `LoyaltyProgramDto` (class) — Base DTO for a loyalty program record; validates `id` (UUID), `programName` (1–100 chars, trimmed), `memberId` (1–100 chars, trimmed), and optional nullable `notes`
- `UpdateLoyaltyProgramDto` (class) — Partial update DTO derived from `LoyaltyProgramDto` with `id` omitted; all remaining fields are optional

### Exports

- `LoyaltyProgramDto` — named
- `UpdateLoyaltyProgramDto` — named

---

## loyalty-program.dto.spec.ts

### Imports

- `reflect-metadata` — required for class-transformer/class-validator decorator metadata
- `class-transformer` — `plainToInstance` (convert plain objects to DTO instances for testing)
- `class-validator` — `validate` (run validation decorators against DTO instances)
- `./loyalty-program.dto` — `LoyaltyProgramDto`, `UpdateLoyaltyProgramDto` (subjects under test)

### Definitions

- `VALID_ID` (const) — Fixture UUID used across test cases
- `validProgram` (const) — Fixture object with all valid `LoyaltyProgramDto` fields

### Exports

- _(none — test file only)_
