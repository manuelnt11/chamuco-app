# Feature: Users & Personal Profile

**Status:** Design Phase
**Last Updated:** 2026-03-15

---

## Overview

A **User** is the system account of a registered person. It covers authentication identity and the **personal profile** — data that belongs to the person themselves, independent of any specific trip or group.

This distinction matters: most information traditionally associated with "travel profiles" (passport, emergency contact, dietary needs, allergies) is intrinsic to the individual and should not be duplicated or scoped per trip. The user profile is the single source of truth for this data. Trip and group records reference the user rather than replicate it.

---

## User Record (`users`)

The core identity and authentication record.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `email` | String | Primary identifier. Used for login and notifications. |
| `username` | String | Unique handle chosen by the user. Lowercase, no spaces, no special characters except underscores and hyphens (e.g., `ana_gomez`, `juantravel`). Used for search and `@mentions` across the app. Immutable after a grace period post-registration (TBD). Unique across the entire system. |
| `display_name` | String | The name shown across the app in non-legal contexts (chat, itinerary, group lists). Does not need to be unique. |
| `avatar_url` | String | Profile picture URL (stored in Cloud Storage). |
| `auth_provider` | Enum `AuthProvider` | `GOOGLE`, `PASSKEY` |
| `auth_provider_id` | String | External ID from the auth provider. |
| `timezone` | String (IANA) | User's home timezone. Used for date/time display defaults. |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |
| `last_active_at` | Timestamp | |

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

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | PK + FK → `users.id` |
| `language` | Enum `AppLanguage` | `ES` or `EN`. Default: `ES`. |
| `currency` | Enum `AppCurrency` | `COP` or `USD`. Default: `COP`. |
| `theme` | Enum `AppTheme` | `LIGHT`, `DARK`, or `SYSTEM`. Default: `SYSTEM`. |
| `updated_at` | Timestamp | |

---

## Personal Profile (`user_profiles`)

Extended personal data for the person behind the account. This is a 1:1 extension of the `users` table, kept separate to avoid bloating the core auth record.

### Identity & Contact

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | FK → `users.id` |
| `first_name` | String | Legal first name (as on travel document). |
| `last_name` | String | Legal last name. |
| `date_of_birth` | Date | |
| `nationality` | String | ISO 3166-1 alpha-2 country code (e.g., `CO`, `US`). |
| `phone_number` | String | Mobile number in international format (e.g., `+573001234567`). |

### Identity Documents

| Field | Type | Description |
|---|---|---|
| `national_id_number` | String | National ID / Cédula / DNI. |
| `passport_number` | String | |
| `passport_expiry_date` | Date | Used to auto-trigger a `DOCUMENTS` pre-trip task when a trip approaches and the passport expires within 6 months of departure. |
| `passport_issuing_country` | String | ISO 3166-1 alpha-2 country code. |

### Emergency Contact

| Field | Type | Description |
|---|---|---|
| `emergency_contact_name` | String | Full name. |
| `emergency_contact_phone` | String | International format. |
| `emergency_contact_relationship` | String | Free text (e.g., "mother", "spouse"). |

---

## Loyalty Programs (`user_loyalty_programs`)

A user may hold membership in multiple loyalty programs (airlines, hotels, etc.). Each program is a separate record.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `user_id` | UUID | FK → `users.id` |
| `program_name` | String | Name of the program (e.g., "LifeMiles", "Delta SkyMiles", "Marriott Bonvoy"). |
| `member_id` | String | The membership / account number in that program. |
| `notes` | String | Optional. Tier level, expiry, or other notes. |

---

## Dietary & Health Profile (`user_health_profiles`)

Personal health and dietary data used by organizers to plan meals, activities, and emergency situations. Visible to confirmed trip organizers.

### Dietary Preference (enum: `DietaryPreference`)

| Value | Description |
|---|---|
| `OMNIVORE` | No dietary restrictions. |
| `VEGETARIAN` | No meat or fish. May consume eggs and dairy. |
| `VEGAN` | No animal products of any kind. |
| `PESCATARIAN` | No meat, but eats fish and seafood. |
| `OTHER` | Non-standard restriction. Described in `dietary_notes`. |

### `user_health_profiles` Table

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | FK → `users.id` |
| `dietary_preference` | Enum `DietaryPreference` | Declared baseline diet. |
| `dietary_notes` | Text | Free text for additional context (e.g., "no pork for religious reasons", "keto"). |
| `food_allergies` | `FoodAllergen`[] | Structured list of known allergens. See enum below. |
| `food_allergy_notes` | Text | Free text for detail not captured by the enum (e.g., "severe anaphylactic reaction to tree nuts — carries EpiPen"). |
| `phobias` | Text[] | Free text list. Each entry is a phobia or strong aversion (e.g., "heights", "enclosed spaces", "snakes"). |
| `physical_limitations` | Text[] | Free text list. Mobility, accessibility, or endurance constraints (e.g., "cannot walk more than 3 km", "wheelchair user", "cannot climb stairs"). |
| `medical_notes` | Text | Sensitive free text for any other relevant medical context the user chooses to share. |

### Food Allergens (enum: `FoodAllergen`)

Covers the most common internationally recognized allergens. The `food_allergy_notes` field handles anything outside this list.

| Value |
|---|
| `GLUTEN` |
| `CRUSTACEANS` |
| `EGGS` |
| `FISH` |
| `PEANUTS` |
| `SOYBEANS` |
| `MILK` |
| `TREE_NUTS` |
| `CELERY` |
| `MUSTARD` |
| `SESAME` |
| `SULPHITES` |
| `LUPIN` |
| `MOLLUSCS` |

---

## Profile Visibility & Access

User profile data has tiered visibility:

| Data | Who can see it |
|---|---|
| `display_name`, `avatar_url` | Any user in the same trip or group |
| `first_name`, `last_name`, `phone_number`, `nationality` | Confirmed trip organizers and co-organizers |
| Identity documents (`passport_number`, etc.) | Confirmed trip organizers and co-organizers |
| `emergency_contact_*` | Confirmed trip organizers and co-organizers |
| Loyalty programs | User only (used for auto-fill in reservations, not exposed to organizers) |
| `dietary_preference`, `food_allergies`, `phobias`, `physical_limitations` | Confirmed trip organizers and co-organizers |
| `medical_notes` | User only (opt-in sharing per trip — see below) |

### Opt-in Medical Sharing

`medical_notes` is private by default. A user may choose to share it with the organizer of a specific trip via a per-trip flag (`share_medical_notes: boolean`) on the trip participant record. The organizer cannot request access — only the user can grant it.

---

## Profile Completeness for Trips

When a user is a confirmed participant on a trip, the app surfaces a **profile checklist** indicating which fields are filled and which are missing. This is informational — it does not block participation. The pre-trip task system handles hard blockers (see `pre-trip-planning.md`).

The checklist is scoped to what the organizer needs for that specific trip type (domestic vs. international, activities with physical requirements, etc.).

---

---

## Traveler Statistics (`user_stats`)

A 1:1 extension of the `users` table that stores the user's computed travel statistics. Populated and updated automatically as part of the trip completion flow — never edited directly. See [`features/gamification.md`](./gamification.md) for the full definition of each metric.

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | PK + FK → `users.id` |
| `trips_completed` | Integer | Total completed trips as a confirmed participant |
| `countries_visited` | Integer | Unique countries covered in completed trips |
| `regions_visited` | Integer | Unique region/state subdivisions visited |
| `km_traveled` | Decimal | Sum of transport distances across completed trips |
| `km2_explored` | Decimal | Approximate area covered by visited places |
| `unique_travel_companions` | Integer | Distinct users traveled with across all trips |
| `trips_as_organizer` | Integer | Trips completed in the `ORGANIZER` role |
| `longest_trip_days` | Integer | Duration in days of the longest completed trip |
| `traveler_score` | Integer | Composite score for global ranking (auto-computed) |
| `updated_at` | Timestamp | |

---

## Achievements (`user_achievements`)

Records which achievements the user has unlocked and when. Created by the system during the trip completion flow. Never created manually.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `user_id` | UUID | FK → `users.id` |
| `achievement` | Enum `Achievement` | Identifier of the unlocked achievement (e.g., `FIRST_TRIP`, `EXPLORER_10_COUNTRIES`) |
| `unlocked_at` | Timestamp | |
| `trip_id` | UUID (nullable) | The trip that triggered the unlock |

See [`features/gamification.md`](./gamification.md) for the full `Achievement` enum with all values and trigger conditions.

---

## Chamuco Points

The user's point balance is never stored as a single column — it is derived by summing all `chamuco_point_transactions` records for the user. See [`features/gamification.md`](./gamification.md) for the transaction schema, earn events, spending catalog, and rules.

---

## Recognitions Received

Recognitions received by the user are stored in the `recognitions` table, keyed by `recipient_user_id`. They appear on the user's public profile, grouped by context (trip / group / event). See [`features/gamification.md`](./gamification.md) for the full `recognitions` schema.

---

## Discovery Map

The discovery map is a personal geographic visualization derived from `itinerary_items` of type `PLACE` in completed trips where the user was a confirmed participant. No separate table is needed — it is computed on demand from existing trip data. See [`features/gamification.md`](./gamification.md) for map behavior, granularity, and visibility rules.

---

## Public Profile Additions (Gamification)

The following gamification fields are added to the user's public-facing profile:

| Data | Visibility |
|---|---|
| Traveler Score | Per `ProfileVisibility` setting |
| Global ranking position | Per `ProfileVisibility` setting |
| Achievements (badge collection) | Per `ProfileVisibility` setting |
| Recognitions received | Per `ProfileVisibility` setting |
| Key stats (trips, countries, km) | Per `ProfileVisibility` setting |
| Discovery map | Per `ProfileVisibility` setting (independent toggle TBD) |

---

## Open Questions / To Be Defined

- Should multiple passport records be supported (e.g., dual nationality)?
- Can the user define more than one emergency contact?
- Should loyalty programs be linked to specific reservations, or just stored on the profile for manual reference?
- Is `medical_notes` the right granularity, or should it be further split (conditions, medications, blood type)?
- Should phobias and physical limitations use a structured tag system for better organizer filtering, or remain free text?
- Should the discovery map have its own visibility toggle independent of the main `ProfileVisibility` setting?
