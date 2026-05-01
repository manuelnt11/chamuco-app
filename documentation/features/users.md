# Feature: Users & Personal Profile

**Status:** Design Phase
**Last Updated:** 2026-05-01 (ETAs added)

---

## Overview

A **User** is the system account of a registered person. It covers authentication identity and the **personal profile** — data that belongs to the person themselves, independent of any specific trip or group.

This distinction matters: most information traditionally associated with "travel profiles" (passports, emergency contacts, dietary needs, health data) is intrinsic to the individual and should not be duplicated or scoped per trip. The user profile is the single source of truth for this data. Trip and group records reference the user rather than replicate it.

---

## User Record (`users`)

The core identity and authentication record.

| Field            | Type                | Description                                                                                                                                                         |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | UUID                |                                                                                                                                                                     |
| `email`          | String              | Primary identifier. Used for login and notifications.                                                                                                               |
| `username`       | String              | Unique handle chosen by the user. See Username Rules below.                                                                                                         |
| `display_name`   | String              | The name shown across the app in non-legal contexts (chat, itinerary, group lists). Pre-filled from the OAuth provider at registration. Does not need to be unique. |
| `avatar_url`     | String              | Profile picture URL (stored in Cloud Storage).                                                                                                                      |
| `auth_provider`  | Enum `AuthProvider` | `GOOGLE`, `FACEBOOK`                                                                                                                                                |
| `firebase_uid`   | String              | Firebase UID from the verified ID token. Unique.                                                                                                                    |
| `timezone`       | String (IANA)       | User's home timezone. Used for date/time display defaults.                                                                                                          |
| `platform_role`  | Enum `PlatformRole` | `USER` (default) or `SUPPORT_ADMIN`. See Platform Roles below.                                                                                                      |
| `agency_id`      | UUID (nullable)     | FK → `agencies.id`. Set if the user belongs to a travel agency. See [`features/agencies.md`](./agencies.md).                                                        |
| `created_at`     | Timestamp           |                                                                                                                                                                     |
| `updated_at`     | Timestamp           |                                                                                                                                                                     |
| `last_active_at` | Timestamp           |                                                                                                                                                                     |

### Username Rules

- Allowed characters: `a–z`, `0–9`, `_`, `-`
- Minimum length: 3 characters. Maximum: 30 characters.
- Must be **globally unique** across all users. Enforced at DB level with a unique index.
- Stored and validated as **lowercase only**. Input is normalized to lowercase before saving.
- Required at registration — the user must choose one before completing onboarding.
- Displayed prefixed with `@` throughout the UI (e.g., `@ana_gomez`), but stored without the prefix.
- Used for: user search, `@mention` in messages, invitation by handle (alternative to email).

---

## User Preferences (`user_preferences`)

A 1:1 extension of the `users` table that holds display and UX preferences. Created automatically when the user is first provisioned. See [`design/preferences.md`](../design/preferences.md) for the full preference system — including guest (cookie-based) preferences on public paths, resolution priority, and login sync behavior.

| Field        | Type               | Description                                      |
| ------------ | ------------------ | ------------------------------------------------ |
| `user_id`    | UUID               | PK + FK → `users.id`                             |
| `language`   | Enum `AppLanguage` | `ES` or `EN`. Default: `ES`.                     |
| `currency`   | Enum `AppCurrency` | `COP` or `USD`. Default: `COP`.                  |
| `theme`      | Enum `AppTheme`    | `LIGHT`, `DARK`, or `SYSTEM`. Default: `SYSTEM`. |
| `updated_at` | Timestamp          |                                                  |

---

## Personal Profile (`user_profiles`)

Extended personal data for the person behind the account. This is a 1:1 extension of the `users` table, kept separate to avoid bloating the core auth record.

In addition to personal fields, `user_profiles` consolidates all data that is always fetched per-user, never queried cross-user, and has no external FK dependencies: health data, emergency contacts, and loyalty programs. These are stored as JSONB columns instead of separate tables. See each section below for the JSONB structure and enum definitions.

| Field                   | Type                     | Description                                                                                                                                                                                      |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `user_id`               | UUID                     | PK + FK → `users.id`                                                                                                                                                                             |
| `first_name`            | String                   | Legal first name (as on travel document).                                                                                                                                                        |
| `last_name`             | String                   | Legal last name.                                                                                                                                                                                 |
| `date_of_birth`         | JSONB                    | `{ day, month, year, year_visible }`. See format below.                                                                                                                                          |
| `birth_country`         | char(2) (nullable)       | ISO 3166-1 alpha-2. Country of birth.                                                                                                                                                            |
| `birth_city`            | String (nullable)        | City of birth.                                                                                                                                                                                   |
| `home_country`          | char(2)                  | ISO 3166-1 alpha-2. Country of current residence. May differ from any declared nationality.                                                                                                      |
| `home_city`             | String (nullable)        | City of current residence. Used as the origin point for LP distance calculations (see [`features/gamification.md`](./gamification.md)). Falls back to the centroid of `home_country` if not set. |
| `phone_number`          | String                   | Mobile number in international format (e.g., `+573001234567`).                                                                                                                                   |
| `bio`                   | Text (nullable)          | Short public bio shown on the user's public profile.                                                                                                                                             |
| `dietary_preference`    | Enum `DietaryPreference` | Declared baseline diet. Default: `OMNIVORE`.                                                                                                                                                     |
| `dietary_notes`         | Text (nullable)          | Additional dietary context (e.g., "no pork for religious reasons", "keto").                                                                                                                      |
| `general_medical_notes` | Text (nullable)          | Free text for any other medical context the user chooses to share that does not fit the structured categories. Opt-in sharing per trip — see Visibility below.                                   |
| `food_allergies`        | JSONB                    | Array of `{ allergen: FoodAllergen, description: string \| null }`. Default: `[]`.                                                                                                               |
| `phobias`               | JSONB                    | Array of `{ phobia: PhobiaType, description: string \| null }`. Default: `[]`.                                                                                                                   |
| `physical_limitations`  | JSONB                    | Array of `{ limitation: PhysicalLimitationType, description: string \| null }`. Default: `[]`.                                                                                                   |
| `medical_conditions`    | JSONB                    | Array of `{ condition: MedicalConditionType, description: string \| null }`. Default: `[]`.                                                                                                      |
| `emergency_contacts`    | JSONB                    | Array of emergency contact objects. See [Emergency Contacts](#emergency-contacts) below. Default: `[]`.                                                                                          |
| `loyalty_programs`      | JSONB                    | Array of loyalty program objects. See [Loyalty Programs](#loyalty-programs) below. Default: `[]`.                                                                                                |
| `updated_at`            | Timestamp                |                                                                                                                                                                                                  |

### Date of Birth Format

`date_of_birth` is stored as JSONB with the following shape:

```json
{ "day": 14, "month": 5, "year": 1990, "year_visible": false }
```

When `year_visible = false`, the birth year is hidden on the public profile. Day and month are always visible to confirmed organizers with `VIEW_TRAVEL_PROFILES`. Age calculation at the application layer extracts the three numeric fields from the JSONB object.

---

## Nationalities & Travel Documents (`user_nationalities`)

A user must have **at least one nationality**. Multiple nationalities (dual, triple citizenship) are supported. Each record captures both the nationality itself and the travel document — national ID and passport — associated with that citizenship.

**Constraints:**

- **Unique nationality per user:** no two records for the same user may share the same `country_code`. Enforced by a unique index on `(user_id, country_code)`.
- **Passport data consistency:** if `passport_status ≠ OMITTED`, all three passport fields are required. Enforced at two levels:
  - **Application layer (NestJS):** the DTO rejects the request with a descriptive error before the DB is reached.
  - **DB CHECK constraint:** guarantees integrity regardless of write origin (migrations, SUPPORT_ADMIN, direct DB access).

```sql
CONSTRAINT passport_data_consistency CHECK (
  (passport_status = 'OMITTED'
    AND passport_number     IS NULL
    AND passport_issue_date IS NULL
    AND passport_expiry_date IS NULL)
  OR
  (passport_status <> 'OMITTED'
    AND passport_number     IS NOT NULL
    AND passport_issue_date IS NOT NULL
    AND passport_expiry_date IS NOT NULL)
)
```

| Field                  | Type                  | Description                                                                                              |
| ---------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| `id`                   | UUID                  |                                                                                                          |
| `user_id`              | UUID                  | FK → `users.id`                                                                                          |
| `country_code`         | char(2)               | ISO 3166-1 alpha-2 (e.g., `CO`, `ES`). Unique per user.                                                  |
| `is_primary`           | Boolean               | The nationality/passport to use as default for international trips. Exactly one per user must be `true`. |
| `national_id_number`   | String (nullable)     | National ID / Cédula / DNI / SSN for this citizenship.                                                   |
| `passport_number`      | String (nullable)     | Passport document number.                                                                                |
| `passport_issue_date`  | Date (nullable)       | Date the passport was issued.                                                                            |
| `passport_expiry_date` | Date (nullable)       | Expiry date. Used for alerts and trip validation.                                                        |
| `passport_status`      | Enum `PassportStatus` | Pre-computed status. See lifecycle below.                                                                |
| `updated_at`           | Timestamp             |                                                                                                          |

### PassportStatus Enum

| Value           | Meaning                                                      |
| --------------- | ------------------------------------------------------------ |
| `OMITTED`       | No passport data has been provided for this nationality yet. |
| `ACTIVE`        | Passport is valid and not expiring within 6 months.          |
| `EXPIRING_SOON` | Passport expires within the next 6 months.                   |
| `EXPIRED`       | Passport expiry date is in the past.                         |

### Status Lifecycle

The status flag is a **pre-computed cache** — it exists so that trip validation reads a single column instead of recomputing dates at query time. The 6-month `EXPIRING_SOON` threshold comfortably covers the 1-month post-trip-end safety margin required for international travel.

| Transition                             | Trigger                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------- |
| → `OMITTED`                            | Record created without passport data                                      |
| `OMITTED` → `ACTIVE` / `EXPIRING_SOON` | User saves passport data for the first time. App sets status immediately. |
| `ACTIVE` → `EXPIRING_SOON`             | Daily job                                                                 |
| `EXPIRING_SOON` → `EXPIRED`            | Daily job                                                                 |
| Any → `ACTIVE`                         | User updates passport with a new future expiry date                       |

**Daily job behavior:** the job filters on `passport_status <> 'OMITTED'`. The CHECK constraint guarantees that any non-`OMITTED` record has a non-null `passport_expiry_date`, so no additional null check is needed. Only rows whose status actually changes are returned, so every row in the result set warrants a notification.

Status transitions to `EXPIRING_SOON` or `EXPIRED` **trigger a push notification to the user**:

```sql
UPDATE user_nationalities
SET passport_status = CASE
  WHEN passport_expiry_date < CURRENT_DATE                        THEN 'EXPIRED'
  WHEN passport_expiry_date < CURRENT_DATE + INTERVAL '180 days' THEN 'EXPIRING_SOON'
  ELSE                                                                 'ACTIVE'
END
WHERE passport_status <> 'OMITTED'
  AND passport_status <> CASE
    WHEN passport_expiry_date < CURRENT_DATE                        THEN 'EXPIRED'
    WHEN passport_expiry_date < CURRENT_DATE + INTERVAL '180 days' THEN 'EXPIRING_SOON'
    ELSE                                                                 'ACTIVE'
  END
RETURNING user_id, country_code, passport_status;
```

The NestJS job iterates the returned rows and queues an FCM notification for each affected user.

---

## Visas (`user_visas`)

A user may register the visas they currently hold. Each visa belongs to a specific nationality record — a visa is tied to a citizenship, not to a specific passport document (renewing a passport does not invalidate visas issued under it).

### Schema

| Field            | Type                       | Description                                                                                                                 |
| ---------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `id`             | UUID                       |                                                                                                                             |
| `nationality_id` | UUID                       | FK → `user_nationalities.id` ON DELETE CASCADE                                                                              |
| `coverage_type`  | Enum `VisaCoverageType`    | `COUNTRY` or `ZONE`. Determines which of the two coverage fields is populated.                                              |
| `country_code`   | char(2) (nullable)         | ISO 3166-1 alpha-2. Present only when `coverage_type = COUNTRY`.                                                            |
| `visa_zone`      | Enum `VisaZone` (nullable) | Present only when `coverage_type = ZONE`.                                                                                   |
| `visa_type`      | Enum `VisaType`            | Classification of the visa.                                                                                                 |
| `entries`        | Enum `VisaEntries`         | How many entries the visa permits.                                                                                          |
| `expiry_date`    | Date                       | Expiry date of the visa. Required — even visas tied to a specific passport use the passport expiry date as the visa expiry. |
| `visa_status`    | Enum `VisaStatus`          | Pre-computed status. Updated by the daily job.                                                                              |
| `notes`          | Text (nullable)            | Free text (e.g., visa number, consulate, restrictions).                                                                     |
| `created_at`     | Timestamp                  |                                                                                                                             |
| `updated_at`     | Timestamp                  |                                                                                                                             |

### Coverage consistency constraint

Exactly one of `country_code` / `visa_zone` must be non-null, determined by `coverage_type`:

```sql
CONSTRAINT visa_coverage_consistency CHECK (
  (coverage_type = 'COUNTRY' AND country_code IS NOT NULL AND visa_zone IS NULL)
  OR
  (coverage_type = 'ZONE'    AND visa_zone IS NOT NULL    AND country_code IS NULL)
)
```

### VisaZone enum

Multi-country zones where a single visa grants access to all member states.

| Value      | Coverage                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------- |
| `SCHENGEN` | 27 EU member states + Norway, Iceland, Liechtenstein, Switzerland                            |
| `GCC`      | Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman                                              |
| `CARICOM`  | 15 Caribbean Community member states                                                         |
| `EAC`      | East African Community (Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, DRC, Somalia) |
| `CAN`      | Comunidad Andina (Colombia, Ecuador, Peru, Bolivia)                                          |
| `MERCOSUR` | Brazil, Argentina, Uruguay, Paraguay (+ associate members)                                   |
| `ECOWAS`   | 15 West African community member states                                                      |

### VisaType enum

| Value           | Description                                             |
| --------------- | ------------------------------------------------------- |
| `TOURIST`       | Tourism / visitor visa                                  |
| `BUSINESS`      | Business travel visa                                    |
| `TRANSIT`       | Airport or transit visa — no entry into the country     |
| `WORK`          | Work or residence visa                                  |
| `STUDENT`       | Student visa                                            |
| `DIGITAL_NOMAD` | Remote work visa                                        |
| `OTHER`         | Not covered by the above types. Use `notes` for detail. |

### VisaEntries enum

| Value      | Description                                              |
| ---------- | -------------------------------------------------------- |
| `SINGLE`   | One entry only. The visa is consumed after a single use. |
| `DOUBLE`   | Two entries permitted.                                   |
| `MULTIPLE` | Unlimited entries within the validity period.            |

### VisaStatus enum and lifecycle

Pre-computed status cache, same pattern as `PassportStatus`. The EXPIRING_SOON window is **30 days** (shorter than passports because visa validity periods are typically much shorter).

| Value           | Meaning                                        |
| --------------- | ---------------------------------------------- |
| `ACTIVE`        | Visa is valid and not expiring within 30 days. |
| `EXPIRING_SOON` | Visa expires within the next 30 days.          |
| `EXPIRED`       | Visa expiry date is in the past.               |

| Transition                  | Trigger                                                     |
| --------------------------- | ----------------------------------------------------------- |
| → `ACTIVE`                  | Visa saved for the first time. App sets status immediately. |
| `ACTIVE` → `EXPIRING_SOON`  | Daily job                                                   |
| `EXPIRING_SOON` → `EXPIRED` | Daily job                                                   |
| Any → `ACTIVE`              | User updates expiry date to a future date beyond 30 days    |

Status transitions to `EXPIRING_SOON` or `EXPIRED` trigger a push notification to the user.

### Daily job

The visa expiry check runs as part of the same scheduled job pipeline as passport expiry (`POST /api/v1/jobs/passport-expiry` or a dedicated `POST /api/v1/jobs/visa-expiry`):

```sql
UPDATE user_visas
SET visa_status = CASE
  WHEN expiry_date < CURRENT_DATE                       THEN 'EXPIRED'
  WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
  ELSE                                                       'ACTIVE'
END
WHERE visa_status <> CASE
  WHEN expiry_date < CURRENT_DATE                       THEN 'EXPIRED'
  WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
  ELSE                                                       'ACTIVE'
END
RETURNING nationality_id, visa_status;
```

---

## Visa Entry Logs (`user_visa_entry_logs`) — Post-MVP

> **Not included in MVP.** The schema is designed now so it can be added without changes to `user_visas`.

Tracks individual uses of a visa — both trips completed through Chamuco and independent trips registered manually. This data powers the "entries used" indicator on the visa card and feeds the trip planning check ("this participant's single-entry visa has already been used").

| Field        | Type               | Description                                                            |
| ------------ | ------------------ | ---------------------------------------------------------------------- |
| `id`         | UUID               |                                                                        |
| `visa_id`    | UUID               | FK → `user_visas.id` ON DELETE CASCADE                                 |
| `entry_date` | Date               | Date of entry.                                                         |
| `exit_date`  | Date (nullable)    | Date of exit. Null if still in the destination.                        |
| `source`     | Enum `EntrySource` | `CHAMUCO_TRIP` or `MANUAL`.                                            |
| `trip_id`    | UUID (nullable)    | FK → `trips.id`. Populated automatically when `source = CHAMUCO_TRIP`. |
| `notes`      | Text (nullable)    |                                                                        |
| `created_at` | Timestamp          |                                                                        |

**Entries used** is computed as `COUNT(*)` on this table per visa — never stored as a column.

**Auto-population from trips:** when a trip transitions to `COMPLETED`, the post-trip flow creates a `CHAMUCO_TRIP` entry log for each confirmed participant whose visa covers any destination in `trip_destinations` or the return location.

**Query for trip planning:** "does participant X have a remaining entry for destination Y?"

```sql
SELECT
  v.*,
  COUNT(el.id) AS entries_used
FROM user_visas v
LEFT JOIN user_visa_entry_logs el ON el.visa_id = v.id
WHERE v.nationality_id IN (
  SELECT id FROM user_nationalities WHERE user_id = $userId
)
AND v.visa_status != 'EXPIRED'
AND (v.country_code = $destinationCode OR v.visa_zone IN ($zonesForDestination))
GROUP BY v.id
HAVING v.entries = 'MULTIPLE'
    OR COUNT(el.id) < CASE v.entries WHEN 'SINGLE' THEN 1 WHEN 'DOUBLE' THEN 2 END
```

---

## Electronic Travel Authorizations (`user_etas`)

An ETA (Electronic Travel Authorization) is a digital pre-travel permission. Unlike a visa, an ETA is tied to a **specific passport**, not just a citizenship: if the user renews their passport, all ETAs issued for the previous passport become invalid. ETAs are always country-specific — there are no zone-based ETAs.

Examples: US ESTA, Canada eTA, UK ETA, Australia ETA, New Zealand NZeTA.

### Schema

| Field                  | Type               | Description                                                                         |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `id`                   | UUID               |                                                                                     |
| `user_nationality_id`  | UUID               | FK → `user_nationalities.id` ON DELETE CASCADE. Provides citizenship context.       |
| `passport_number`      | Text               | The specific passport this ETA was issued for. Snapshot — not a live FK.            |
| `destination_country`  | char(2)            | ISO 3166-1 alpha-2. ETAs are always country-specific.                               |
| `authorization_number` | Text               | Official reference number issued by the destination country.                        |
| `eta_type`             | Enum `EtaType`     | `TOURIST` or `TRANSIT`.                                                             |
| `entries`              | Enum `VisaEntries` | `SINGLE`, `DOUBLE`, or `MULTIPLE`. Reuses the same enum as visas.                   |
| `expiry_date`          | Date               | Expiry date as stated on the ETA.                                                   |
| `eta_status`           | Enum `EtaStatus`   | Pre-computed status. Updated by the daily job and synchronously on passport update. |
| `notes`                | Text (nullable)    | Free text (e.g., approved stay duration per visit, restrictions).                   |
| `created_at`           | Timestamp          |                                                                                     |
| `updated_at`           | Timestamp          |                                                                                     |

### EtaType enum

ETAs cover only entry and transit purposes. Work, student, and digital nomad stays are always handled through formal visas.

| Value     | Description                                                             |
| --------- | ----------------------------------------------------------------------- |
| `TOURIST` | Tourism / visitor ETA — allows entry into the country.                  |
| `TRANSIT` | Transit ETA — permits transit through the destination without entering. |

### EtaStatus enum and lifecycle

Same pattern as `VisaStatus`. The EXPIRING_SOON window is **30 days**.

An ETA can expire in two independent ways: by date (standard) or by passport invalidation (the passport it was issued for has been renewed or has expired). Both are treated as terminal — the ETA cannot be reactivated.

| Value           | Meaning                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `ACTIVE`        | ETA is valid, not expiring within 30 days, and the associated passport is current.             |
| `EXPIRING_SOON` | ETA expires within the next 30 days, and the passport is still current.                        |
| `EXPIRED`       | ETA has passed its expiry date, or the passport it was issued for has expired or been renewed. |

| Transition                  | Trigger                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| → `ACTIVE`                  | ETA saved for the first time. App sets status immediately.                   |
| `ACTIVE` → `EXPIRING_SOON`  | Daily job (30-day window)                                                    |
| `EXPIRING_SOON` → `EXPIRED` | Daily job                                                                    |
| Any non-EXPIRED → `EXPIRED` | Daily job detects passport renewal or expiry (see below)                     |
| Any → `ACTIVE`              | User updates expiry date to a valid future date and current passport matches |

Status transitions to `EXPIRING_SOON` or `EXPIRED` trigger a push notification to the user.

### Synchronous invalidation on passport update

When a user updates their passport in `user_nationalities` (new `passport_number`, `passport_issue_date`, or `passport_expiry_date`), the NestJS handler must **immediately and synchronously** mark all ETAs registered under the old `passport_number` as `EXPIRED`:

```ts
// In NationalitiesService.updatePassport()
if (oldPassportNumber !== newPassportNumber) {
  await db
    .update(userEtas)
    .set({ etaStatus: EtaStatus.EXPIRED, updatedAt: new Date() })
    .where(
      and(
        eq(userEtas.userNationalityId, nationalityId),
        eq(userEtas.passportNumber, oldPassportNumber),
        ne(userEtas.etaStatus, EtaStatus.EXPIRED),
      ),
    );
}
```

This ensures the user immediately sees their ETAs as invalid rather than waiting for the overnight job.

### Daily job

The ETA expiry check extends the same scheduled job pipeline (`POST /api/v1/jobs/eta-expiry`):

```sql
-- Mark EXPIRED by date or by passport invalidation
UPDATE user_etas eta
SET eta_status = 'EXPIRED', updated_at = NOW()
WHERE eta.eta_status <> 'EXPIRED'
  AND (
    -- Expired by date
    eta.expiry_date < CURRENT_DATE
    -- Expired because passport was renewed or expired
    OR NOT EXISTS (
      SELECT 1 FROM user_nationalities un
      WHERE un.id = eta.user_nationality_id
        AND un.passport_number = eta.passport_number
        AND un.passport_expiry_date > CURRENT_DATE
    )
  );

-- Mark EXPIRING_SOON (only if passport is still current)
UPDATE user_etas eta
SET eta_status = 'EXPIRING_SOON', updated_at = NOW()
WHERE eta.eta_status = 'ACTIVE'
  AND eta.expiry_date > CURRENT_DATE
  AND eta.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND EXISTS (
    SELECT 1 FROM user_nationalities un
    WHERE un.id = eta.user_nationality_id
      AND un.passport_number = eta.passport_number
      AND un.passport_expiry_date > CURRENT_DATE
  );
```

### ETA Entry Logs — Post-MVP

> **Not included in MVP.**

ETAs that restrict the maximum continuous stay per visit (e.g., ESTA allows up to 90 days per entry, Canada eTA up to 6 months) can be tracked with an `user_eta_entry_logs` table following the same pattern as `user_visa_entry_logs`. This data also powers trip planning warnings (e.g., "this participant's ESTA has already been used on a single-entry authorization"). Schema design is deferred until `user_visa_entry_logs` is implemented.

---

## Visa Requirement Lookup — Future Reference

Post-MVP, Chamuco can warn participants that they may need a visa for a trip destination based on their nationality. This is independent of `user_visas` (which stores visas the user already has) and would use a reference dataset:

- **Passport Index** (`ilyankou/passport-index-dataset` on GitHub) — open-source dataset mapping nationality × destination → visa requirement. Updated regularly.
- **Sherpa API** — commercial API for real-time entry requirements including COVID restrictions, health declarations, etc.

The warning flow: trip organizer sees on the participant panel that participant X (Colombian) is joining a trip to the US, and Chamuco flags "may require a visa" if no active US visa or matching zone visa is registered on their profile.

---

## Emergency Contacts

A user must have **at least one emergency contact**. Multiple contacts are supported.

Emergency contacts are stored as a JSONB array in `user_profiles.emergency_contacts`. This data is always fetched per-user, is never queried cross-user, and has no FK dependencies — a JSONB column avoids the overhead of a separate table.

**JSONB element shape:**

```typescript
{
  id: string; // client-generated UUID, used to target individual items in PATCH operations
  full_name: string;
  phone_number: string; // international format (e.g., +573001234567)
  relationship: string; // free text (e.g., "mother", "spouse", "best friend")
  is_primary: boolean; // exactly one element must be true
}
```

**Rule:** A user with zero emergency contacts cannot be marked as a confirmed participant on international trips (enforced by the pre-trip checklist, not as a hard DB constraint).

---

## Loyalty Programs

Reference data only — loyalty program IDs are stored on the user profile as a convenience for manual entry when making reservations. They are **not linked to reservation records** in the system.

Stored as a JSONB array in `user_profiles.loyalty_programs`. Visible only to the user themselves — never exposed to organizers or other participants.

**JSONB element shape:**

```typescript
{
  id: string; // client-generated UUID, used to target individual items in PATCH operations
  program_name: string; // e.g., "LifeMiles", "Delta SkyMiles", "Marriott Bonvoy"
  member_id: string; // membership / account number
  notes: string | null; // tier level, expiry, or other notes
}
```

---

## Health Profile

Health and dietary data used by organizers to plan meals, activities, and manage emergency situations. Each category uses a **structured selection list** so organizers can filter and search effectively. Every category includes an `OTHER` option with a required `description` field for cases not covered by the standard list.

All health data is stored directly on `user_profiles` (see table above). Scalar fields (`dietary_preference`, `dietary_notes`, `general_medical_notes`) are typed columns. The four multi-value categories (food allergies, phobias, physical limitations, medical conditions) are JSONB arrays — each element has the shape `{ <field>: <enum>, description: string | null }`, where `description` is required when the enum value is `OTHER`.

### Dietary Preference (enum: `DietaryPreference`)

| Value         | Description                                             |
| ------------- | ------------------------------------------------------- |
| `OMNIVORE`    | No dietary restrictions.                                |
| `VEGETARIAN`  | No meat or fish. May consume eggs and dairy.            |
| `VEGAN`       | No animal products of any kind.                         |
| `PESCATARIAN` | No meat, but eats fish and seafood.                     |
| `GLUTEN_FREE` | Requires gluten-free options.                           |
| `OTHER`       | Non-standard restriction. Described in `dietary_notes`. |

---

### Food Allergies (enum: `FoodAllergen`)

Stored in `user_profiles.food_allergies` as `{ allergen: FoodAllergen, description: string | null }[]`. `description` is required when `allergen = OTHER`.

Covers the most common internationally recognized allergens.

| Value         |
| ------------- |
| `GLUTEN`      |
| `CRUSTACEANS` |
| `EGGS`        |
| `FISH`        |
| `PEANUTS`     |
| `SOYBEANS`    |
| `MILK`        |
| `TREE_NUTS`   |
| `CELERY`      |
| `MUSTARD`     |
| `SESAME`      |
| `SULPHITES`   |
| `LUPIN`       |
| `MOLLUSCS`    |
| `OTHER`       |

---

### Phobias (enum: `PhobiaType`)

Stored in `user_profiles.phobias` as `{ phobia: PhobiaType, description: string | null }[]`. `description` is required when `phobia = OTHER`.

Travel-relevant phobias and strong aversions.

| Value             | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `HEIGHTS`         | Acrophobia — heights, high viewpoints, mountain trails     |
| `ENCLOSED_SPACES` | Claustrophobia — caves, tunnels, small rooms               |
| `FLYING`          | Aviophobia — aircraft, helicopters                         |
| `DEEP_WATER`      | Fear of deep or dark water bodies                          |
| `OPEN_WATER`      | Fear of large open bodies of water                         |
| `ANIMALS`         | General zoophobia                                          |
| `INSECTS`         | Entomophobia                                               |
| `SNAKES`          | Ophidiophobia                                              |
| `SPIDERS`         | Arachnophobia                                              |
| `DARKNESS`        | Nyctophobia                                                |
| `CROWDS`          | Ochlophobia — crowded markets, festivals, public transport |
| `MOTION_SICKNESS` | Severe motion sickness (cars, boats, planes)               |
| `OTHER`           | Not on the list. Described in `description`.               |

---

### Physical Limitations (enum: `PhysicalLimitationType`)

Stored in `user_profiles.physical_limitations` as `{ limitation: PhysicalLimitationType, description: string | null }[]`. `description` is required when `limitation = OTHER`.

| Value                   | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `WHEELCHAIR_USER`       | Full-time wheelchair user. Requires accessible infrastructure. |
| `REDUCED_MOBILITY`      | Can walk but with limited range or pace.                       |
| `CANNOT_USE_STAIRS`     | Requires ramps, lifts, or ground-floor accommodation.          |
| `HEARING_IMPAIRMENT`    | Partial or complete hearing loss.                              |
| `VISUAL_IMPAIRMENT`     | Partial or complete vision loss.                               |
| `REQUIRES_OXYGEN`       | Requires supplemental oxygen.                                  |
| `REQUIRES_CPAP`         | Requires CPAP machine for sleep apnea.                         |
| `CHRONIC_PAIN`          | Chronic pain condition affecting mobility or endurance.        |
| `JOINT_CONDITION`       | Arthritis, joint replacement, or similar.                      |
| `CARDIAC_CONDITION`     | Heart condition with physical activity restrictions.           |
| `RESPIRATORY_CONDITION` | Asthma, COPD, or similar.                                      |
| `PREGNANCY`             | Current pregnancy.                                             |
| `OTHER`                 | Not on the list. Described in `description`.                   |

---

### Medical Conditions (enum: `MedicalConditionType`)

Conditions relevant to emergency response or trip planning. Stored in `user_profiles.medical_conditions` as `{ condition: MedicalConditionType, description: string | null }[]`. `description` is required when `condition = OTHER`.

| Value                     | Description                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| `DIABETES`                | Type 1 or Type 2 diabetes.                                             |
| `EPILEPSY`                | Seizure disorder.                                                      |
| `SEVERE_ALLERGY_EPIPEN`   | Severe allergy requiring an EpiPen (anaphylaxis risk).                 |
| `ASTHMA`                  | Asthma requiring medication.                                           |
| `HEART_CONDITION`         | Cardiac condition beyond general fitness level.                        |
| `HYPERTENSION`            | High blood pressure under treatment.                                   |
| `BLOOD_CLOTTING_DISORDER` | Conditions affecting clotting (relevant for long flights).             |
| `IMMUNODEFICIENCY`        | Weakened immune system (autoimmune, transplant, etc.).                 |
| `MENTAL_HEALTH_CONDITION` | Anxiety disorder, depression, PTSD, or similar that may affect travel. |
| `OTHER`                   | Not on the list. Described in `description`.                           |

---

## Profile Visibility & Access

| Data                                                                                                    | Who can see it                                                                |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `display_name`, `avatar_url`, `bio`                                                                     | Any user in the same trip or group                                            |
| `first_name`, `last_name`, `phone_number`, `date_of_birth` (day + month), `birth_country`, `birth_city` | Confirmed trip organizers and co-organizers with `VIEW_TRAVEL_PROFILES`       |
| Nationality records (`user_nationalities`) — country, document numbers, passport status                 | Confirmed trip organizers and co-organizers with `VIEW_TRAVEL_PROFILES`       |
| Visa records (`user_visas`) — coverage, type, entries, expiry, status                                   | User only — visa data is never exposed to organizers or other participants    |
| ETA records (`user_etas`) — destination, type, entries, expiry, status                                  | User only — ETA data is never exposed to organizers or other participants     |
| Emergency contacts                                                                                      | Confirmed trip organizers and co-organizers with `VIEW_TRAVEL_PROFILES`       |
| Loyalty programs                                                                                        | User only (reference data, not exposed to organizers)                         |
| Dietary preference, food allergies                                                                      | Confirmed trip organizers and co-organizers                                   |
| Phobias, physical limitations                                                                           | Confirmed trip organizers and co-organizers                                   |
| Medical conditions                                                                                      | Confirmed trip organizers and co-organizers                                   |
| `general_medical_notes`                                                                                 | User only by default — opt-in sharing per trip (see below)                    |
| Traveler stats, achievements, recognitions, discovery map                                               | Per `ProfileVisibility` setting (same as the profile — no independent toggle) |

### Opt-in General Medical Notes Sharing

`general_medical_notes` is private by default. A user may choose to share it with the organizer of a specific trip via a per-trip flag (`share_general_medical_notes: boolean`) on the trip participant record. The organizer cannot request access — only the user can grant it.

---

## Profile Completeness for Trips

When a user is a confirmed participant on a trip, the app surfaces a **profile checklist** indicating which fields are filled and which are missing. This is informational — it does not block participation. The pre-trip task system handles hard blockers (see `pre-trip-planning.md`).

The checklist is scoped to what the organizer needs for that specific trip type (domestic vs. international, activities with physical requirements, etc.). Missing emergency contact is always flagged regardless of trip type.

---

## Traveler Statistics (`user_stats`)

A 1:1 extension of the `users` table that stores the user's computed travel statistics. Populated and updated automatically as part of the trip completion flow — never edited directly. See [`features/gamification.md`](./gamification.md) for the full definition of each metric.

| Field                      | Type      | Description                                        |
| -------------------------- | --------- | -------------------------------------------------- |
| `user_id`                  | UUID      | PK + FK → `users.id`                               |
| `trips_completed`          | Integer   | Total completed trips as a confirmed participant   |
| `countries_visited`        | Integer   | Unique countries covered in completed trips        |
| `cities_visited`           | Integer   | Unique cities/towns visited across completed trips |
| `km_traveled`              | Decimal   | Sum of transport distances across completed trips  |
| `km2_explored`             | Decimal   | Approximate area covered by visited places         |
| `unique_travel_companions` | Integer   | Distinct users traveled with across all trips      |
| `trips_as_organizer`       | Integer   | Trips completed in the `ORGANIZER` role            |
| `longest_trip_days`        | Integer   | Duration in days of the longest completed trip     |
| `traveler_score`           | Integer   | Composite score for global ranking (auto-computed) |
| `updated_at`               | Timestamp |                                                    |

**Visibility:** Traveler statistics are as public as the user's profile. They follow the same `ProfileVisibility` setting — no independent toggle. This includes the discovery map.

---

## Achievements (`user_achievements`)

Records which achievements the user has unlocked and when. Created by the system during the trip completion flow. Never created manually.

| Field         | Type               | Description                            |
| ------------- | ------------------ | -------------------------------------- |
| `id`          | UUID               |                                        |
| `user_id`     | UUID               | FK → `users.id`                        |
| `achievement` | Enum `Achievement` | Identifier of the unlocked achievement |
| `unlocked_at` | Timestamp          |                                        |
| `trip_id`     | UUID (nullable)    | The trip that triggered the unlock     |

See [`features/gamification.md`](./gamification.md) for the full `Achievement` enum with all values and trigger conditions.

---

## Chamuco Points

The user's point balance is derived by summing all `chamuco_point_transactions` records for the user — never stored as a single column. See [`features/gamification.md`](./gamification.md) for the transaction schema, earn events, spending catalog, and rules.

---

## Recognitions Received

Recognitions received by the user are stored in the `recognitions` table, keyed by `recipient_user_id`. They appear on the user's public profile, grouped by context (trip / group / event). See [`features/gamification.md`](./gamification.md) for the full schema.

---

## Discovery Map

A personal geographic visualization of visited places. In MVP, derived from `trip_destinations` (country + city) of completed trips where the user was a confirmed participant. Post-MVP, enriched from `PLACE` itinerary items. Computed on demand from existing trip data — no separate table needed. Visibility follows the main `ProfileVisibility` setting. See [`features/gamification.md`](./gamification.md).

---

## Public Profile (Gamification Data)

| Data                             | Visibility                      |
| -------------------------------- | ------------------------------- |
| Traveler Score                   | Per `ProfileVisibility` setting |
| Global ranking position          | Per `ProfileVisibility` setting |
| Achievements (badge collection)  | Per `ProfileVisibility` setting |
| Recognitions received            | Per `ProfileVisibility` setting |
| Key stats (trips, countries, km) | Per `ProfileVisibility` setting |
| Discovery map                    | Per `ProfileVisibility` setting |

All gamification-related data is bundled with the profile — one visibility setting controls all of it.

---

## Agencies

A **travel agency** is a higher-level entity that groups users who are professional trip organizers. Agency coordinators can create and manage trips on behalf of the agency. See [`features/agencies.md`](./agencies.md) for the full specification.

---

## Platform Roles (Enum: `PlatformRole`)

| Value           | Description                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `USER`          | A standard Chamuco Travel user. Subject to all trip, group, and permission rules. Default for all registered accounts.                                          |
| `SUPPORT_ADMIN` | A service account for platform support and troubleshooting. Bypasses all access restrictions. Not a traveler, has no group membership, and holds no trip roles. |

### Support Admin

The `SUPPORT_ADMIN` role is a **platform-level service account** used exclusively for troubleshooting and operational support. It is not a feature for end users.

**Capabilities:**

- Can access any trip or group regardless of visibility, membership, or invitation status.
- Can read and write any record, bypassing all role and permission checks.
- Can act on behalf of the platform to resolve data inconsistencies or assist users blocked by app failures.

**Restrictions:**

- Never counted as a participant on any trip or group. Does not occupy capacity, is not included in expense splits, does not trigger membership side effects.
- No travel profile, group memberships, or gamification records.
- Not assignable from within the app. Can only be granted by directly updating `platform_role` at the database level.

**Audit trail:** Every write action is recorded in `support_admin_audit_log` with: `id`, `admin_user_id`, `action`, `target_table`, `target_id`, `before_state` (JSONB), `after_state` (JSONB), `performed_at`. Immutable.

---

## Open Questions

- Should the username be changeable after the grace period? If so, what is the grace period duration?
- Should the profile completeness checklist score be visible to organizers (e.g., "7/10 profile complete")?
