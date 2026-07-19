# Inventory: schema

---

## support-admin-audit-log.schema.ts

### Imports

- `drizzle-orm/pg-core` — `index, jsonb, pgTable, text, timestamp, uuid` for column and table builders
- `@/modules/users/schema/users.schema` — `users` for FK reference on `admin_user_id`

### Definitions

- `supportAdminAuditLog` (const) — Drizzle `pgTable` for `support_admin_audit_log`; append-only immutable audit log recording all write actions performed by SUPPORT_ADMIN users; no UPDATE/DELETE permitted; indexed on `admin_user_id` and `performed_at`

### Exports

- `supportAdminAuditLog` — named

---

## support-admin-audit-log.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for introspecting table metadata in tests
- `./support-admin-audit-log.schema` — `supportAdminAuditLog` under test

### Definitions

- Test suite (`describe`) — verifies absence of `updated_at` (append-only), nullable `before_state`/`after_state` JSONB, `admin_user_id` as not-null, FK with `RESTRICT` on delete, and indexes on `admin_user_id` and `performed_at`

### Exports

- none (test file)

---

## user-etas.schema.ts

### Imports

- `@chamuco/shared-types` — `DocumentStatus, EtaType` for enum values
- `drizzle-orm/pg-core` — `char, date, index, pgEnum, pgTable, text, timestamp, uuid` for column and table builders
- `./user-nationalities.schema` — `userNationalities` for FK reference on `user_nationality_id`
- `./user-visas.schema` — `visaEntriesEnum` reused for the `entries` column

### Definitions

- `etaTypeEnum` (const) — pgEnum `eta_type` with values from `EtaType` (TOURIST, TRANSIT)
- `etaStatusEnum` (const) — pgEnum `eta_status` with active/expiring/expired values from `DocumentStatus`
- `userEtas` (const) — Drizzle `pgTable` for `user_etas`; stores Electronic Travel Authorizations linked to a nationality record; indexed on `user_nationality_id`, `eta_status`, and `passport_number`

### Exports

- `etaTypeEnum` — named
- `etaStatusEnum` — named
- `userEtas` — named

---

## user-etas.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for table introspection
- `./user-etas.schema` — `userEtas` under test

### Definitions

- Test suite (`describe`) — verifies required not-null columns, nullable `notes`, FK to `user_nationalities.id` with CASCADE on delete, and indexes on `user_nationality_id`, `eta_status`, and `passport_number`

### Exports

- none (test file)

---

## user-nationalities.schema.ts

### Imports

- `@chamuco/shared-types` — `PassportStatus` for enum values
- `drizzle-orm` — `sql` for raw SQL expressions in constraints
- `drizzle-orm/pg-core` — `boolean, char, check, date, index, pgEnum, pgTable, text, timestamp, unique, uniqueIndex, uuid` for column, constraint, and table builders
- `./users.schema` — `users` for FK reference on `user_id`

### Definitions

- `passportStatusEnum` (const) — pgEnum `passport_status` with values OMITTED, ACTIVE, EXPIRING_SOON, EXPIRED
- `userNationalities` (const) — Drizzle `pgTable` for `user_nationalities`; composite unique on `(user_id, country_code)`; partial unique index enforcing at most one primary nationality per user; check constraints for passport data consistency and alphanumeric format on `national_id_number` and `passport_number`

### Exports

- `passportStatusEnum` — named
- `userNationalities` — named

---

## user-preferences.schema.ts

### Imports

- `@chamuco/shared-types` — `AppCurrency, AppLanguage, AppTheme, DisabledNotificationChannels` for enum values and JSONB typing
- `drizzle-orm/pg-core` — `jsonb, pgEnum, pgTable, timestamp, uuid` for column and table builders
- `./users.schema` — `users` for FK reference on `user_id`

### Definitions

- `appLanguageEnum` (const) — pgEnum `app_language` with values from `AppLanguage` (ES, EN)
- `appCurrencyEnum` (const) — pgEnum `app_currency` with values from `AppCurrency` (COP, USD)
- `appThemeEnum` (const) — pgEnum `app_theme` with values from `AppTheme` (LIGHT, DARK, SYSTEM)
- `userPreferences` (const) — Drizzle `pgTable` for `user_preferences`; `user_id` is the PK (one-to-one with users); stores language, currency, theme defaults and notification opt-out JSONB

### Exports

- `appLanguageEnum` — named
- `appCurrencyEnum` — named
- `appThemeEnum` — named
- `userPreferences` — named

---

## user-preferences.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for table introspection
- `@chamuco/shared-types` — `AppCurrency, AppLanguage, AppTheme` for expected enum values
- `./user-preferences.schema` — `appCurrencyEnum, appLanguageEnum, appThemeEnum, userPreferences` under test

### Definitions

- Test suite (`describe`) — verifies FK to `users.id` with CASCADE on delete, and that each pgEnum contains all corresponding shared-types values

### Exports

- none (test file)

---

## user-profiles.schema.ts

### Imports

- `@chamuco/shared-types` — `BloodType, DietaryPreference, FoodAllergen, MedicalConditionType, PhobiaType, PhysicalLimitationType` for enum values
- `drizzle-orm/pg-core` — `boolean, char, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar` for column and table builders
- `./users.schema` — `users` for FK reference on `user_id`

### Definitions

- `dietaryPreferenceEnum` (const) — pgEnum `dietary_preference` (OMNIVORE, VEGETARIAN, VEGAN, PESCATARIAN, GLUTEN_FREE, OTHER)
- `foodAllergenEnum` (const) — pgEnum `food_allergen` with 15 allergen values from `FoodAllergen`
- `phobiaTypeEnum` (const) — pgEnum `phobia_type` with 13 phobia values from `PhobiaType`
- `physicalLimitationTypeEnum` (const) — pgEnum `physical_limitation_type` with 13 limitation values from `PhysicalLimitationType`
- `medicalConditionTypeEnum` (const) — pgEnum `medical_condition_type` with 9 condition values from `MedicalConditionType`
- `bloodTypeEnum` (const) — pgEnum `blood_type` with 8 ABO/Rh values from `BloodType`
- `userProfiles` (const) — Drizzle `pgTable` for `user_profiles`; `user_id` is the PK; stores personal details, health data (blood type, diet, allergies, phobias, limitations, medical conditions), emergency contacts, and loyalty programs as JSONB arrays

### Exports

- `dietaryPreferenceEnum` — named
- `foodAllergenEnum` — named
- `phobiaTypeEnum` — named
- `physicalLimitationTypeEnum` — named
- `medicalConditionTypeEnum` — named
- `bloodTypeEnum` — named
- `userProfiles` — named

---

## user-visas.schema.ts

### Imports

- `@chamuco/shared-types` — `DocumentStatus, VisaCoverageType, VisaEntries, VisaType, VisaZone` for enum values
- `drizzle-orm` — `sql` for raw SQL in check constraint
- `drizzle-orm/pg-core` — `char, check, date, index, pgEnum, pgTable, text, timestamp, uuid` for column, constraint, and table builders
- `./user-nationalities.schema` — `userNationalities` for FK reference on `nationality_id`

### Definitions

- `visaCoverageTypeEnum` (const) — pgEnum `visa_coverage_type` (COUNTRY, ZONE)
- `visaZoneEnum` (const) — pgEnum `visa_zone` (SCHENGEN, GCC, CARICOM, EAC, CAN, MERCOSUR, ECOWAS)
- `visaTypeEnum` (const) — pgEnum `visa_type` (TOURIST, BUSINESS, TRANSIT, WORK, STUDENT, DIGITAL_NOMAD, OTHER)
- `visaEntriesEnum` (const) — pgEnum `visa_entries` (SINGLE, DOUBLE, MULTIPLE); also reused by `user-etas.schema.ts`
- `visaStatusEnum` (const) — pgEnum `visa_status` with active/expiring/expired values from `DocumentStatus`
- `userVisas` (const) — Drizzle `pgTable` for `user_visas`; check constraint `visa_coverage_consistency` enforces that COUNTRY coverage has `country_code` and no `visa_zone`, and ZONE coverage has `visa_zone` and no `country_code`; indexed on `nationality_id` and `visa_status`

### Exports

- `visaCoverageTypeEnum` — named
- `visaZoneEnum` — named
- `visaTypeEnum` — named
- `visaEntriesEnum` — named
- `visaStatusEnum` — named
- `userVisas` — named

---

## user-visas.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for table introspection
- `./user-visas.schema` — `userVisas` under test

### Definitions

- Test suite (`describe`) — verifies not-null/nullable constraints, FK to `user_nationalities.id` with CASCADE on delete, indexes on `nationality_id` and `visa_status`, and `visa_coverage_consistency` check constraint

### Exports

- none (test file)

---

## users.schema.ts

### Imports

- `drizzle-orm` — `relations, sql` for Drizzle relations DSL and raw SQL in check constraint
- `drizzle-orm/pg-core` — `check, pgEnum, pgTable, text, timestamp, uuid, varchar` for column, constraint, and table builders
- `@chamuco/shared-types` — `AuthProvider, PlatformRole, ProfileVisibility` for enum values
- `@/modules/assets/schema/assets.schema` — `assets` for FK reference on `avatar`

### Definitions

- `authProviderEnum` (const) — pgEnum `auth_provider` (GOOGLE, FACEBOOK)
- `platformRoleEnum` (const) — pgEnum `platform_role` (USER, SUPPORT_ADMIN)
- `profileVisibilityEnum` (const) — pgEnum `profile_visibility` (PRIVATE, CONNECTIONS_ONLY, MEMBERS_ONLY, PUBLIC)
- `users` (const) — root Drizzle `pgTable` for `users`; unique on `username` and `firebase_uid`; check constraint `users_username_format` enforces `^[a-z0-9_-]{3,30}$`; soft-delete via `deleted_at` is handled at service layer (no `deleted_at` column here — see domain rules)
- `usersRelations` (const) — Drizzle `relations` definition linking `users.avatar` FK to `assets.id`

### Exports

- `authProviderEnum` — named
- `platformRoleEnum` — named
- `profileVisibilityEnum` — named
- `users` — named
- `usersRelations` — named

---

## users.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for table introspection
- `@chamuco/shared-types` — `AuthProvider, PlatformRole` for expected enum values
- `./users.schema` — `authProviderEnum, platformRoleEnum, users` under test

### Definitions

- Test suite (`describe`) — verifies unique constraints on `username` and `firebase_uid`, username CHECK constraint, and enum values for `authProviderEnum` and `platformRoleEnum`

### Exports

- none (test file)
