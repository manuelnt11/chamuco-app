# Feature: Trips

**Status:** Design Phase — MVP Scope
**Last Updated:** 2026-03-25

---

## Overview

The **Trip** is the central entity of Chamuco App. Everything else — participants, expenses, communication, and gamification — is organized around a trip. A trip can range from a simple weekend outing to a multi-leg international journey.

This document reflects the **MVP scope** of the trips module. The full itinerary builder, expense tracking, reservations, and pre-trip planning are post-MVP. The sections at the end of this document preserve those designs for reference.

---

## Trip Record (`trips`) — Core Fields

| Field                  | Type                  | Description                                                                                                                                                                             |
| ---------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | UUID                  |                                                                                                                                                                                         |
| `name`                 | String                | Trip name (e.g., "Cartagena Long Weekend").                                                                                                                                             |
| `description`          | Text (nullable)       | Optional public description shown on the trip page.                                                                                                                                     |
| `cover_type`           | Enum `CoverType`      | `IMAGE` or `EMOJI`. Determines the visual identity of the trip.                                                                                                                         |
| `cover_image_url`      | String (nullable)     | URL in Cloud Storage. Required when `cover_type = IMAGE`.                                                                                                                               |
| `cover_emoji`          | String (nullable)     | A single Unicode emoji character. Required when `cover_type = EMOJI`.                                                                                                                   |
| `status`               | Enum `TripStatus`     | Current lifecycle state.                                                                                                                                                                |
| `visibility`           | Enum `TripVisibility` | Discoverability setting.                                                                                                                                                                |
| `start_date`           | Date                  | Trip start date (trip begins at 00:00).                                                                                                                                                 |
| `end_date`             | Date                  | Trip end date (trip ends at 24:00).                                                                                                                                                     |
| `primary_timezone`     | String (IANA)         | Timezone used for date/time display.                                                                                                                                                    |
| `base_currency`        | char(3) (ISO 4217)    | The reference currency for budget items.                                                                                                                                                |
| `participant_capacity` | Integer               | **Required.** Maximum number of confirmed traveling participants. Must be ≥ 1. May be updated while `DRAFT` or `OPEN`; cannot be reduced below the current confirmed participant count. |
| `departure_country`    | char(2)               | ISO 3166-1 alpha-2. The country the group departs from.                                                                                                                                 |
| `departure_city`       | Text                  | The city the group departs from.                                                                                                                                                        |
| `return_country`       | char(2) (nullable)    | ISO 3166-1 alpha-2. The country the group returns to. `null` means the group returns to the departure country.                                                                          |
| `return_city`          | Text (nullable)       | The city the group returns to. `null` means the group returns to the departure city.                                                                                                    |
| `itinerary_notes`      | Text (nullable)       | Free-text itinerary field. Supports multi-line content. Not structured — intended for quick notes, agenda outlines, or day-by-day plans in plain text.                                  |
| `feedback_open_until`  | Timestamp (nullable)  | Set at `COMPLETED` transition. Feedback and recognition submissions accepted until this time.                                                                                           |
| `points_distributed`   | Boolean               | Set to `true` after Chamuco Points have been distributed. Prevents duplicate distribution on retry.                                                                                     |
| `agency_id`            | UUID (nullable)       | FK → `agencies.id`. Set if the trip is managed by a travel agency.                                                                                                                      |
| `created_by`           | UUID                  | FK → `users.id`. The user who created the trip (first ORGANIZER).                                                                                                                       |
| `created_at`           | Timestamp             |                                                                                                                                                                                         |
| `updated_at`           | Timestamp             |                                                                                                                                                                                         |

The `CoverType` enum and the mutual exclusivity rule between `cover_image_url` and `cover_emoji` are shared with the `groups` table. See [`features/community.md`](./community.md).

---

## Trip Creation

When a user creates a trip, they become its first `ORGANIZER`. As part of the creation flow, they must:

1. Provide the trip name, dates, departure location, and at least one destination.
2. Declare whether they will be traveling with the group (`is_traveling_participant`).

**Traveling** (`is_traveling_participant = true`) — the organizer is counted in the participant capacity and the per-person budget estimate. **Not traveling** (`is_traveling_participant = false`) — the organizer administers the trip but does not occupy a spot, and is excluded from capacity counts.

This decision can be changed later by the organizer, but declaring it upfront ensures the capacity is accurate from the start.

---

## Trip Lifecycle

A trip progresses through the following statuses (enum: `TripStatus`):

| Value         | Description                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------- |
| `DRAFT`       | Trip is being planned. Not yet shared or open for invitations.                                |
| `OPEN`        | Trip is open for invitations and participant confirmations.                                   |
| `CONFIRMED`   | Trip is confirmed and edit-restricted. All strict pre-trip tasks must be resolved (post-MVP). |
| `IN_PROGRESS` | Trip is currently happening (departure date has passed).                                      |
| `COMPLETED`   | Trip has ended.                                                                               |
| `CANCELLED`   | Trip was cancelled. Participants are notified.                                                |

---

## Trip Date & Time Boundaries

- A trip **starts at 00:00 (midnight) on `start_date`** in the trip's primary timezone.
- A trip **ends at 24:00 (midnight end) on `end_date`** — equivalent to 00:00 of the following day. The trip covers the full last day.
- `end_date` must be **greater than or equal to** `start_date`. A same-day trip (day trip) is valid.

These boundaries determine when the trip transitions to `IN_PROGRESS` (start boundary crossed) and `COMPLETED` (end boundary crossed), unless overridden manually by an organizer.

---

## Changes While IN_PROGRESS

Once a trip enters `IN_PROGRESS` status, any modification (destinations, dates, participant list, settings) **requires explicit organizer confirmation** before it is saved. After a change is confirmed and applied, **all confirmed participants are notified** of what changed.

---

## Trip Roles

Within a trip, each member holds a role (enum: `TripRole`). See [`features/participants.md`](./participants.md) for the full role model and co-organizer permission system.

| Value          | Description                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ORGANIZER`    | Full administrative control. All permissions always granted. May or may not travel. Multiple organizers allowed. |
| `CO_ORGANIZER` | Delegated helper with a configurable set of permissions. May or may not travel.                                  |
| `PARTICIPANT`  | Confirmed traveler. Standard access. Always counts as a traveling participant.                                   |

`INVITED`, `DECLINED`, and `WAITLISTED` are **participant statuses** (`ParticipantStatus`), not roles. See [`features/participants.md`](./participants.md).

---

## Trip Visibility

Enum: `TripVisibility`. **Visibility controls discoverability only** — it does not determine who can be invited. Organizers can always invite any user regardless of visibility setting.

| Value     | Description                                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC`  | Listed publicly in the community feed. Any registered user can discover and view the trip.                                                                                                                                   |
| `PRIVATE` | Not searchable and not publicly listed. Visible only to members of groups explicitly listed in `trip_visible_to_groups`. If no groups are defined, the trip is invisible to everyone except its members and direct invitees. |

**Visibility is required at creation** — no default is applied. It may be changed by the organizer at any time; changing visibility does not affect pending requests or invitations already in flight.

### Private Trip — Visible Groups

A `PRIVATE` trip may define a set of groups whose members can see it, stored in a `trip_visible_to_groups` join table (`trip_id`, `group_id`). Any member of a listed group can see the trip and submit a join request.

---

## Invite Links

Invite links are a separate mechanism from visibility — they allow organizers to bring in participants who are not yet registered on the platform.

An organizer generates a **shareable invite link** for the trip. The link encodes a unique token stored in a `trip_invite_links` table.

### Schema (`trip_invite_links`)

| Field        | Type                 | Description                                                       |
| ------------ | -------------------- | ----------------------------------------------------------------- |
| `id`         | UUID                 |                                                                   |
| `trip_id`    | UUID                 | FK → `trips.id`                                                   |
| `token`      | Text                 | Unique random token. Included in the shareable URL.               |
| `created_by` | UUID                 | FK → `users.id`. The organizer who generated the link.            |
| `expires_at` | Timestamp (nullable) | If set, the link is rejected after this time.                     |
| `max_uses`   | Integer (nullable)   | If set, the link is rejected once `use_count` reaches this value. |
| `use_count`  | Integer              | Number of times the link has been successfully used. Default 0.   |
| `revoked_at` | Timestamp (nullable) | Set when the organizer explicitly revokes the link.               |
| `created_at` | Timestamp            |                                                                   |

### Behavior

**Non-registered user clicks the link** — The app detects there is no active session. The user is directed to the registration flow. The invite token is preserved through registration (e.g., passed as a query parameter). After completing registration, an `INVITED` participant record is automatically created for the new user on the trip. The `use_count` on the link is incremented.

**Registered user clicks the link** — The user is directed to the trip page. If they are not already a member or invitee, an `INVITED` participant record is automatically created for them. This bypasses the discoverability restriction of a `PRIVATE` trip — the link grants access regardless of visibility setting. The `use_count` is incremented.

**Expired, revoked, or exhausted link** — The link is rejected. The user sees an informative error. If the user is not registered, they are still offered the option to register (without the trip invitation).

### Rules

- An organizer may generate multiple active invite links for the same trip (e.g., one per distribution channel).
- An organizer may revoke any link at any time by setting `revoked_at`. Revocation does not affect participants who already accepted via that link.
- A user who already holds an active invitation, pending request, or confirmed participation on the trip is not duplicated when following an invite link — the link is a no-op for them.
- Invite link usage is subject to trip capacity. If the trip is full, the auto-invitation is created but the participant enters the normal waitlist flow.

---

## Departure & Return Locations

Every trip has a **departure location** and an **optional return location**. These define the endpoints of the trip route.

- `departure_country` + `departure_city`: **required**. Where the group starts from.
- `return_country` + `return_city`: **optional**. Where the group ends up. When null, the return point is the same as the departure location (round trip).

### Trip Route

The trip route is defined as:

```
departure_location → destinations[position=1] → destinations[position=2] → … → return_location
```

Where `return_location` falls back to `departure_location` when `return_country` and `return_city` are null.

This route is used to compute **total distance traveled**, which feeds into the Level Points (LP) distance tier in the gamification module. Distance is calculated as the sum of great-circle distances between consecutive points along the route. If `home_city` is not set on the user profile, `departure_city` is used as the proxy for distance-from-home calculations.

---

## Destinations (`trip_destinations`)

Every trip must have at least one destination. Destinations are ordered — the sequence matters for route computation and display.

### Schema

| Field          | Type            | Description                                                                      |
| -------------- | --------------- | -------------------------------------------------------------------------------- |
| `id`           | UUID            |                                                                                  |
| `trip_id`      | UUID            | FK → `trips.id`                                                                  |
| `position`     | Integer         | 1-based ordering. Determines the route sequence. Min 1 record required per trip. |
| `country_code` | char(2)         | ISO 3166-1 alpha-2.                                                              |
| `city`         | Text            | City name.                                                                       |
| `label`        | Text (nullable) | Optional display name for this stop (e.g., "Overnight in Granada").              |
| `created_at`   | Timestamp       |                                                                                  |

### Rules

- At least one destination is required. A trip without destinations cannot be published (`OPEN`).
- Positions must be contiguous and start at 1. Reordering destinations updates all affected `position` values atomically.
- Destinations can be added, removed, or reordered while the trip is `DRAFT` or `OPEN`. Changes while `IN_PROGRESS` require organizer confirmation.

---

## Itinerary Notes (`trips.itinerary_notes`)

For MVP, the structured itinerary builder is replaced with a **free-text field** on the `trips` record.

`itinerary_notes` is a nullable `text` column. It supports multi-line content and is intended for day-by-day outlines, agenda summaries, timing notes, or any informal planning content the organizer wants to share with participants.

There is no formatting enforcement — the field is plain text. The frontend may render it with preserved line breaks.

---

## Budget Items (`trip_budget_items`)

The budget is a **simple named list of cost items**. It is not linked to participants, expenses, or settlements — it is a planning tool for the organizer to communicate expected costs.

### Schema

| Field         | Type            | Description                                                          |
| ------------- | --------------- | -------------------------------------------------------------------- |
| `id`          | UUID            |                                                                      |
| `trip_id`     | UUID            | FK → `trips.id`                                                      |
| `name`        | Text            | Item name (e.g., "Flights", "Hotel — 3 nights", "Bus to Cartagena"). |
| `description` | Text (nullable) | Optional detail or note about this cost item.                        |
| `amount`      | Numeric(12,2)   | Cost amount.                                                         |
| `currency`    | char(3)         | ISO 4217. Defaults to the trip's `base_currency` if not specified.   |
| `created_by`  | UUID            | FK → `users.id`.                                                     |
| `created_at`  | Timestamp       |                                                                      |
| `updated_at`  | Timestamp       |                                                                      |

### Rules

- Any organizer or co-organizer with `EDIT_TRIP_DETAILS` permission may add, edit, or delete budget items.
- Items are displayed in creation order (no explicit ordering column — `created_at` ascending).
- There is no per-participant split in MVP. Budget items are cost estimates, not expense records.

---

## Trip Notes (`trip_notes`)

A collaborative list of notes attached to the trip. Notes are for shared information, reminders, packing lists, tips, or anything the group needs to remember.

### Schema

| Field        | Type      | Description                                 |
| ------------ | --------- | ------------------------------------------- |
| `id`         | UUID      |                                             |
| `trip_id`    | UUID      | FK → `trips.id`                             |
| `content`    | Text      | The note content. Supports multi-line text. |
| `created_by` | UUID      | FK → `users.id`.                            |
| `created_at` | Timestamp |                                             |
| `updated_at` | Timestamp |                                             |

### Rules

- Any confirmed participant or organizer may add a note.
- The creator (`created_by`) may edit or delete their own note. Organizers and co-organizers with `EDIT_TRIP_DETAILS` may edit or delete any note.
- Notes are displayed in creation order (`created_at` ascending).

---

## Key Dates (`trip_key_dates`)

A list of important dates associated with the trip — deadlines, payment dates, document submission windows, pre-departure milestones, etc.

### Schema

| Field              | Type      | Description                                                                                                       |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------- |
| `id`               | UUID      |                                                                                                                   |
| `trip_id`          | UUID      | FK → `trips.id`                                                                                                   |
| `date`             | Date      | The date of the event or deadline.                                                                                |
| `description`      | Text      | What the date represents (e.g., "Passport submission deadline", "Flight check-in opens").                         |
| `reminder_enabled` | Boolean   | Default `false`. When `true`, a push notification is sent to all confirmed participants 24 hours before the date. |
| `created_at`       | Timestamp |                                                                                                                   |

### Rules

- Any organizer or co-organizer with `EDIT_TRIP_DETAILS` may add, edit, or delete key dates.
- Key dates with `reminder_enabled = true` trigger a FCM push notification to all confirmed participants 24 hours before the date. The notification cites the description field.
- Key dates are sorted by `date` ascending for display.

---

## Trip Announcements

Organizers can send a **one-way broadcast announcement** to all confirmed participants. Announcements are delivered as push notifications via FCM. There is no reply mechanism and no persistent chat thread — the notification is the message.

Announcements are stored in a `trip_announcements` table and displayed in a read-only feed on the trip detail screen. See [`infrastructure/cloud.md`](../infrastructure/cloud.md) for the notification delivery spec.

---

## Trip Completion & Gamification

When a trip transitions to `COMPLETED` status, the platform triggers a structured post-trip sequence. Full details are in [`features/gamification.md`](./gamification.md) — Trip Completion Flow section.

In summary:

- **Statistics** are updated for all confirmed participants (`user_stats`, `group_member_stats`).
- **Achievements** are evaluated and newly unlocked ones are recorded (`user_achievements`).
- **Chamuco Points** are distributed to all confirmed participants (`chamuco_point_transactions`).
- **Feedback window** opens for 7 days — participants may leave trip feedback (scored, directed at organizers) and optional peer-to-peer notes.
- **Recognition window** opens for organizers — they may award named recognitions to any participant within the same 7-day window.

### Distance for Gamification

The LP distance tier uses the total distance of the trip route (see [Departure & Return Locations](#departure--return-locations)):

```
departure → destinations (by position) → return
```

Distance is the sum of great-circle distances between consecutive points. For the distance-from-home metric, `home_city` on the user's profile is used; if not set, `departure_city` is used as a fallback.

---

---

## Post-MVP: Full Itinerary Builder

> **Not included in MVP.** The following section preserves the full itinerary design for post-MVP implementation. The MVP uses `itinerary_notes` (free text) in its place.

### Itinerary Structure

The itinerary is a continuous chronological timeline covering the full duration of the trip, from pre-departure through return. It is hierarchically grouped for navigation but stored as a flat ordered sequence of items.

**Navigation Hierarchy:**

```
Trip
 └── Country
      └── City
           └── Day
                └── Itinerary Items
```

Each `Day` is a named block (e.g., `"Day 2 — Kensington and Walking Tour"`). The hierarchy is derived from item data — no separate records for Country/City/Day are stored.

### Day 0 — Pre-departure

A special day that appears before the trip's official departure date. It holds logistical items and costs that belong to the trip but happen in advance: currency exchange, group merchandise, advance payments, printing the itinerary, etc. This day is auto-created when the first pre-departure item is added.

### Itinerary Item — Base Fields

| Field                      | Type                         | Description                                        |
| -------------------------- | ---------------------------- | -------------------------------------------------- |
| `id`                       | UUID                         |                                                    |
| `trip_id`                  | UUID                         | Parent trip                                        |
| `category`                 | Enum `ItineraryItemCategory` | Top-level type                                     |
| `subtype`                  | Enum (per category)          | Specific type within the category                  |
| `name`                     | String                       | Name or description of the item                    |
| `duration_minutes`         | Integer                      | Duration in minutes                                |
| `start_time`               | DateTime (with timezone)     | When the item begins                               |
| `end_time`                 | DateTime (with timezone)     | Computed or manually set end time                  |
| `notes`                    | Text (rich)                  | Freeform notes                                     |
| `distance_km`              | Decimal                      | Physical distance covered                          |
| `is_paid`                  | Boolean                      | Whether the associated cost has been paid          |
| `participant_ids`          | UUID[]                       | Which specific participants (null = all confirmed) |
| `currency`                 | char(3)                      | Currency of the item's cost                        |
| `amount`                   | Decimal                      | Total cost                                         |
| `amount_per_participant`   | Decimal                      | Auto-computed                                      |
| `base_currency_equivalent` | Decimal                      | Equivalent in trip base currency                   |
| `exchange_rate_snapshot`   | Decimal                      | Snapshotted exchange rate                          |
| `status`                   | Enum `ItineraryItemStatus`   | `PLANNED`, `CONFIRMED`, `COMPLETED`, `SKIPPED`     |
| `position`                 | Integer                      | Ordering within the day                            |
| `created_by`               | UUID                         |                                                    |
| `created_at`               | Timestamp                    |                                                    |
| `updated_at`               | Timestamp                    |                                                    |

### Item Category & Subtype Taxonomy

**`TRANSPORT`** — A movement from one point to another. Additional fields: `origin`, `destination`, `carrier`, `flight_number`, `booking_reference`, `departure_terminal`, `arrival_terminal`, `baggage_allowance` (JSONB).

Subtypes (`TransportSubtype`): `WALKING`, `FLIGHT`, `BUS`, `METRO`, `TRAIN`, `TRAM`, `FERRY`, `BOAT`, `SPEEDBOAT`, `PRIVATE_TRANSFER`, `TAXI`, `RIDESHARE`, `VAN`, `CAR`, `MOTORCYCLE`, `BICYCLE`, `CABLE_CAR`, `TUK_TUK`, `KAYAK`, `CAMEL`.

**`AIRPORT`** — Time spent at an airport for processing. Additional fields: `airport_name`, `terminal`, `lounge_name`.

Subtypes (`AirportSubtype`): `CHECK_IN_AND_WAIT`, `CHECK_IN_MIGRATION_AND_WAIT`, `IMMIGRATION`, `IMMIGRATION_AND_BAGGAGE`, `BAGGAGE_CLAIM`, `WAITING`.

**`PLACE`** — A physical location visited. Additional fields: `address`, `coordinates`, `opening_hours`, `entrance_fee`, `dress_code_required`, `dress_code_notes`, `photography_allowed`, `booking_required`, `booking_order_id`, `audio_guide_available`.

Subtypes (`PlaceSubtype`): `HOTEL`, `MUSEUM`, `HISTORIC_BUILDING`, `BUILDING`, `RELIGIOUS_SITE`, `MONUMENT`, `VIEWPOINT`, `PARK`, `BEACH`, `SQUARE`, `STREET`, `MARKET`, `SHOPPING_AREA`, `CITY_CENTER`, `VALLEY`, `DESERT`, `DOCK`, `CURRENCY_EXCHANGE`, `CASINO`.

**`FOOD`** — A meal or dining event. Additional fields: `restaurant_name`, `reservation_required`, `reservation_confirmed`.

Subtypes (`FoodSubtype`): `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`.

**`OTHER`** — Logistical or miscellaneous items.

Subtypes (`OtherSubtype`): `REST`, `NOTE`, `GUIDED_TOUR`, `CITY_PASS`, `CURRENCY_EXCHANGE`, `CASH_WITHDRAWAL`, `SHOPPING`, `LAUNDRY`, `INSURANCE`, `VISA`, `REGISTRATION`, `VEHICLE_RENTAL`, `ADVANCE_PAYMENT`, `WAITING`, `NAVIGATION`, `FREE_ACTIVITY`.

### Guided Tours

`OTHER / GUIDED_TOUR` items are pre-booked, priced as a group total, may contain child sub-items (specific sites visited), and may include a tip component. Additional fields: `booking_reference`, `booking_url`, `language`, `tip_amount`, `operator_name`.

### City Passes

`CITY_PASS` items represent tourist cards granting free or discounted entry to multiple attractions. Individual `PLACE` items covered by a pass reference it and have `amount = 0`. Additional fields: `pass_name`, `covered_item_ids[]`, `valid_from`, `valid_until`.

---

## Post-MVP: Trip Views

> **Not included in MVP.** The following view modes depend on the full itinerary builder.

**Timeline View (default)** — Chronological day-by-day breakdown, grouped by country → city → day. Primary working view for organizers and confirmed participants.

**Activity Sequence View** — Condensed, visual card sequence showing trip highlights. Auto-generated from the itinerary. Each card shows: category icon, item name, day/time, one key detail, and per-person cost estimate (subject to `budget_visibility`). Items marked `SKIPPED` are omitted from post-trip views.

---

## Post-MVP: Budget Estimate & Visibility

> **Not included in MVP.** The MVP budget is a simple named list (`trip_budget_items`). The computed budget estimate below depends on the full itinerary builder.

The computed budget estimate aggregates `amount` from all itinerary items, groups by category, and computes a per-person estimate. It carries a confidence indicator (% of items with `status = CONFIRMED` vs `PLANNED`).

`budget_visibility` (enum) controls who sees the estimate: `PUBLIC`, `PARTICIPANTS_ONLY`, or `ORGANIZER_ONLY`. Default: `PARTICIPANTS_ONLY` for public trips, `ORGANIZER_ONLY` for private trips.

---

## Post-MVP: Trip Resources

> **Not included in MVP.** Trip resources (notes, documents, links) are a post-MVP feature. In MVP, `trip_notes` covers the lightweight notes use case.

The `trip_resources` table supports `NOTE` (markdown), `DOCUMENT` (Cloud Storage file), and `LINK` (external URL) resource types. Any confirmed participant or organizer may add resources; the creator and authorized organizers may manage them.

---

## Open Questions

- Should non-traveling organizers have access to all budget item details by default?
- Can a trip be cloned or saved as a template for repeat travel (e.g., annual trips)?
- How should past trips be registered? Options: (a) full retroactive trip creation with `status = COMPLETED` from the start, bypassing the normal lifecycle — participants are added directly without invitations; (b) a lightweight "travel history entry" with minimal required fields (destination, dates, who traveled) that contributes to stats and the discovery map but doesn't support the full trip ecosystem; (c) a "past trip" creation flow — same entity as a regular trip but with a streamlined UI, no invitations/approvals, and no pre-trip phase.
- Should the 7-day feedback window be configurable per trip by the organizer, or fixed platform-wide?
- Can the organizer extend the feedback window if it expires before they've awarded all recognitions?
