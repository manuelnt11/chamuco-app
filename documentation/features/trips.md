# Feature: Trips

**Status:** Design Phase
**Last Updated:** 2026-03-23

---

## Overview

The **Trip** is the central entity of Chamuco App. Everything else — participants, itinerary, expenses, reservations, communications — is organized around a trip. A trip can range from a simple weekend outing to a multi-leg international journey.

---

## Trip Record (`trips`) — Core Fields

The primary fields of a trip that apply regardless of lifecycle state.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `name` | String | Trip name (e.g., "Cartagena Long Weekend"). |
| `description` | Text (nullable) | Optional public description shown on the trip page. |
| `cover_type` | Enum `CoverType` | `IMAGE` or `EMOJI`. Determines the visual identity of the trip. |
| `cover_image_url` | String (nullable) | URL in Cloud Storage. Required when `cover_type = IMAGE`. |
| `cover_emoji` | String (nullable) | A single Unicode emoji character. Required when `cover_type = EMOJI`. |
| `status` | Enum `TripStatus` | Current lifecycle state. |
| `visibility` | Enum `TripVisibility` | Discoverability setting. |
| `start_date` | Date | Trip start date (trip begins at 00:00). |
| `end_date` | Date | Trip end date (trip ends at 24:00). |
| `primary_timezone` | String (IANA) | Timezone used for date/time display. |
| `base_currency` | String (ISO 4217) | The reference currency for budget estimates and expense aggregation. |
| `participant_capacity` | Integer | **Required.** Maximum number of confirmed traveling participants. Must be ≥ 1. May be updated by the organizer while the trip is in `DRAFT` or `OPEN` status. Reducing below the current confirmed participant count is not allowed. |
| `agency_id` | UUID (nullable) | FK → `agencies.id`. Set if the trip is managed by a travel agency. |
| `created_by` | UUID | FK → `users.id`. The user who created the trip (first ORGANIZER). |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |

The `CoverType` enum and the mutual exclusivity rule between `cover_image_url` and `cover_emoji` are shared with the `groups` table. See the [Groups section in `community.md`](./community.md) for the full definition.

---

## Trip Creation

When a user creates a trip, they become its first `ORGANIZER`. As part of the creation flow, they must explicitly declare whether they will be traveling with the group:

- **Traveling** (`is_traveling_participant = true`) — the organizer is counted in the participant capacity and the per-person budget estimate.
- **Not traveling** (`is_traveling_participant = false`) — the organizer administers the trip but does not occupy a spot, and is excluded from expense splits and capacity counts.

This decision can be changed later by the organizer, but declaring it upfront ensures the budget estimate and capacity are accurate from the start.

---

## Trip Lifecycle

A trip progresses through the following statuses (enum: `TripStatus`):

| Value | Description |
|---|---|
| `DRAFT` | Trip is being planned. Not yet shared or open for invitations. |
| `OPEN` | Trip is open for invitations and participant confirmations. |
| `CONFIRMED` | Trip is confirmed. Itinerary is locked or edit-restricted. All strict pre-trip tasks must be resolved. |
| `IN_PROGRESS` | Trip is currently happening (departure date has passed). |
| `COMPLETED` | Trip has ended. Expense settlement may still be pending. |
| `CANCELLED` | Trip was cancelled. Participants are notified. |

---

## Trip Date & Time Boundaries

A trip spans a continuous range of calendar days with precise start and end times:

- A trip **starts at 00:00 (midnight) on `start_date`** in the trip's primary timezone.
- A trip **ends at 24:00 (midnight end) on `end_date`** — equivalent to 00:00 of the following day. The trip covers the full last day.
- `end_date` must be **greater than or equal to** `start_date`. A same-day trip (day trip) is valid.
- `end_date` may not precede `start_date` under any condition.

These boundaries determine when the trip transitions to `IN_PROGRESS` (start boundary crossed) and `COMPLETED` (end boundary crossed), unless overridden manually by an organizer.

---

## Changes While IN_PROGRESS

Once a trip enters `IN_PROGRESS` status, the trip is live. To protect participants from unexpected changes during travel:

- **Any modification** to the trip (itinerary items, participant list, dates, settings) **requires explicit confirmation** by the organizer before it is saved.
- After a change is confirmed and applied, **all confirmed participants are notified** of what changed.
- Notifications reference the specific field or item that was modified (e.g., "The departure time for Day 3 — Cairo Airport was updated") using i18n keys with interpolated values.
- This confirmation requirement does not apply to purely additive, non-disruptive actions such as adding a new expense record or posting a message in the trip channel.

---

## Trip Roles

Within a trip, each member holds a role (enum: `TripRole`) and an independent traveling flag. See [`features/participants.md`](./participants.md) for the full role model and co-organizer permission system.

| Value | Description |
|---|---|
| `ORGANIZER` | Full administrative control. All permissions always granted. May or may not travel — decided independently by `is_traveling_participant`. Multiple organizers allowed. |
| `CO_ORGANIZER` | Delegated helper with a configurable set of permissions defined by an assigning organizer (`co_organizer_permissions`). May or may not travel — independent of the role. |
| `PARTICIPANT` | Confirmed traveler. Standard access. Always counts as a traveling participant. |

`INVITED`, `DECLINED`, and `WAITLISTED` are **participant statuses** (`ParticipantStatus`), not roles. See [`features/participants.md`](./participants.md) for the full state machine.

---

## Trip Visibility

Configurable visibility (enum: `TripVisibility`). **Visibility controls discoverability only** — it does not determine who can be invited. Organizers can always invite any user regardless of visibility setting.

| Value | Description |
|---|---|
| `PUBLIC` | Listed publicly in the community feed. Any registered user can discover and view the trip. |
| `LINK_ONLY` | Not listed publicly. Anyone who has the direct link can view the trip. |
| `PRIVATE` | Not searchable and not publicly listed. Visible only to members of groups the organizer has explicitly shared it with (see `trip_visible_to_groups` below). If no groups are defined, the trip is invisible to everyone except direct invitees. |

### Private Trip — Visible Groups

A `PRIVATE` trip may define a set of groups whose members can see it. This is stored in a `trip_visible_to_groups` join table (`trip_id`, `group_id`). Any member of a listed group can:

- See the trip in the group's context.
- Submit a join request.

The organizer may add or remove groups from this list at any time. Changing visibility settings does not affect pending requests or invitations already in flight.

See [`features/participants.md`](./participants.md) for the full membership flow that follows from trip visibility.

---

## Itinerary Structure

The itinerary is a **continuous chronological timeline** covering the full duration of the trip, from pre-departure through return. It is hierarchically grouped for navigation but stored as a flat ordered sequence of items.

### Navigation Hierarchy

```
Trip
 └── Country
      └── City
           └── Day
                └── Itinerary Items
```

Each `Day` is a named block (e.g., `"Day 2 — Kensington and Walking Tour"`). The hierarchy is derived from the item data and does not require separate records for Country/City/Day — they are structural groupings computed from the items' dates and location metadata.

### Day 0 — Pre-departure

A special day that appears before the trip's official departure date. It holds logistical items and costs that belong to the trip but happen in advance: currency exchange, group merchandise, advance payments, printing the itinerary, etc. This day is auto-created when the first pre-departure item is added.

---

## Itinerary Item

The base unit of the itinerary. Every event, movement, meal, rest period, or note on the timeline is an itinerary item.

### Base Fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | Parent trip |
| `category` | Enum `ItineraryItemCategory` | Top-level type |
| `subtype` | Enum (per category) | Specific type within the category |
| `name` | String | Name or description of the item |
| `duration_minutes` | Integer | Duration in minutes. Enables auto-computing `end_time` from `start_time`. |
| `start_time` | DateTime (with timezone) | When the item begins |
| `end_time` | DateTime (with timezone) | Computed or manually set end time |
| `notes` | Text (rich) | Freeform notes. Supports multi-line, bullet points. Used for directions, tips, booking refs, instructions. |
| `distance_km` | Decimal | Physical distance covered (relevant for transport and walking items) |
| `is_paid` | Boolean | Whether the associated cost has been paid |
| `participant_count` | Integer | How many participants this item applies to |
| `participant_ids` | UUID[] | Which specific participants (null = all confirmed participants) |
| `currency` | String (ISO 4217) | Currency of the item's cost |
| `amount` | Decimal | Total cost in `currency` for all `participant_count` participants |
| `amount_per_participant` | Decimal | Auto-computed: `amount / participant_count` |
| `base_currency_equivalent` | Decimal | Equivalent in the trip's base currency, using the trip's stored exchange rate |
| `exchange_rate_snapshot` | Decimal | The exchange rate used to compute `base_currency_equivalent`, snapshotted at time of recording |
| `status` | Enum `ItineraryItemStatus` | See below |
| `position` | Integer | Ordering within the day |
| `created_by` | UUID | |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |

### Item Status (enum: `ItineraryItemStatus`)

| Value | Description |
|---|---|
| `PLANNED` | Item is in the itinerary but not yet confirmed or booked. |
| `CONFIRMED` | Item is confirmed (reservation made, tour booked, etc.). |
| `COMPLETED` | Item has been completed during the trip. |
| `SKIPPED` | Item was skipped or cancelled during the trip. |

---

## Item Category & Subtype Taxonomy

All possible values for `category` and their corresponding `subtype` enums. Category and subtype are the primary classification axes for every itinerary item.

> **Note on naming:** All enum values are in English for code use. Display labels are translated via i18n.

---

### Category: `TRANSPORT`
A movement from one point to another.

Additional fields: `origin`, `destination`, `carrier`, `flight_number`, `booking_reference`, `departure_terminal`, `arrival_terminal`, `baggage_allowance` (JSONB).

**Subtypes (enum: `TransportSubtype`):**

| Value | Description |
|---|---|
| `WALKING` | On foot |
| `FLIGHT` | Commercial flight |
| `BUS` | Public or intercity bus |
| `METRO` | Subway / metro |
| `TRAIN` | Train |
| `TRAM` | Tram / streetcar |
| `FERRY` | Ferry |
| `BOAT` | Boat (scenic or river cruise) |
| `SPEEDBOAT` | Small motorboat / lancha |
| `PRIVATE_TRANSFER` | Booked private shuttle or transfer |
| `TAXI` | Taxi |
| `RIDESHARE` | Uber or equivalent rideshare |
| `VAN` | Group van / minibus |
| `CAR` | Private car |
| `MOTORCYCLE` | Motorcycle |
| `BICYCLE` | Bicycle |
| `CABLE_CAR` | Teleférico / cable car |
| `TUK_TUK` | Tuk-tuk |
| `KAYAK` | Kayak |
| `CAMEL` | Camel (or equivalent animal transport) |

---

### Category: `AIRPORT`
Time spent at an airport for processing — not a transport segment itself.

Additional fields: `airport_name`, `terminal`, `lounge_name`.

**Subtypes (enum: `AirportSubtype`):**

| Value | Description |
|---|---|
| `CHECK_IN_AND_WAIT` | Check-in + lounge / waiting |
| `CHECK_IN_MIGRATION_AND_WAIT` | Check-in + immigration + waiting (departure) |
| `IMMIGRATION` | Immigration (arrival) |
| `IMMIGRATION_AND_BAGGAGE` | Immigration + baggage claim (arrival) |
| `BAGGAGE_CLAIM` | Baggage claim only |
| `WAITING` | General airport waiting time |

---

### Category: `PLACE`
A physical location visited during the trip.

Additional fields: `address`, `coordinates`, `opening_hours`, `entrance_fee`, `dress_code_required`, `dress_code_notes`, `photography_allowed`, `booking_required`, `booking_order_id`, `audio_guide_available`.

**Subtypes (enum: `PlaceSubtype`):**

| Value | Description |
|---|---|
| `HOTEL` | Accommodation (check-in / check-out event) |
| `MUSEUM` | Museum |
| `HISTORIC_BUILDING` | Historic building, ruins, ancient site |
| `BUILDING` | General landmark or building |
| `RELIGIOUS_SITE` | Church, mosque, synagogue, temple, monastery |
| `MONUMENT` | Monument or statue |
| `VIEWPOINT` | Mirador / lookout point |
| `PARK` | Park or garden |
| `BEACH` | Beach |
| `SQUARE` | Public square or plaza |
| `STREET` | Street, neighborhood, or district |
| `MARKET` | Market or bazaar |
| `SHOPPING_AREA` | Shopping mall, commercial street |
| `CITY_CENTER` | City center or downtown area |
| `VALLEY` | Valley or natural landscape |
| `DESERT` | Desert |
| `DOCK` | Dock, pier, harbor, or embarcadero |
| `CURRENCY_EXCHANGE` | Currency exchange office |
| `CASINO` | Casino |

---

### Category: `FOOD`
A meal or dining event.

Additional fields: `restaurant_name`, `reservation_required`, `reservation_confirmed`.

**Subtypes (enum: `FoodSubtype`):**

| Value | Description |
|---|---|
| `BREAKFAST` | Breakfast |
| `LUNCH` | Lunch |
| `DINNER` | Dinner |
| `SNACK` | Snack or drinks |

---

### Category: `OTHER`
Logistical, administrative, or miscellaneous items.

**Subtypes (enum: `OtherSubtype`):**

| Value | Description |
|---|---|
| `REST` | Rest or sleep block |
| `NOTE` | Informational reminder — no physical event, no duration |
| `GUIDED_TOUR` | Booked guided tour or excursion. Has booking ref, language, group pricing. |
| `CITY_PASS` | Tourist pass granting access to multiple attractions |
| `CURRENCY_EXCHANGE` | Currency exchange transaction (a task, not a place) |
| `CASH_WITHDRAWAL` | ATM or cash withdrawal |
| `SHOPPING` | Errand or shopping run |
| `LAUNDRY` | Laundry |
| `INSURANCE` | Travel or medical insurance acquisition |
| `VISA` | Visa acquisition |
| `REGISTRATION` | Event or service check-in / registration |
| `VEHICLE_RENTAL` | Car or vehicle rental (pick-up or drop-off) |
| `ADVANCE_PAYMENT` | Deposit or advance payment made before the service |
| `WAITING` | General waiting time (not at airport) |
| `NAVIGATION` | In-transit time with no specific transport mode |
| `FREE_ACTIVITY` | Unstructured social or leisure time |

---

## Guided Tours as a Special Case

Tours (`OTHER / GUIDED_TOUR`) deserve extra attention because they differ from other items:

- They are **pre-booked** and have a reservation reference, booking URL, and sometimes a language preference.
- They are priced as a **group total** with a per-person breakdown.
- They may contain **child items** — the specific sites visited during the tour appear as sub-items in the itinerary linked back to the parent tour.
- They may include a **tip / gratuity** component separate from the base price.

Additional fields for `GUIDED_TOUR`: `booking_reference`, `booking_url`, `language`, `tip_amount`, `operator_name`.

---

## City Passes

A `CITY_PASS` item represents a tourist card that grants free or discounted entry to multiple attractions. When a pass is active for a destination, individual `PLACE` items covered by it reference the pass and their `amount` is set to `0` (covered).

Additional fields for `CITY_PASS`: `pass_name`, `covered_item_ids[]`, `valid_from`, `valid_until`.

---

---

## Trip Views

A trip can be presented in two frontend view modes. Both are read-only projections of the same underlying data — no separate model is required.

### Timeline View (default)

The standard itinerary view: a chronological day-by-day breakdown of all items, grouped by country → city → day. This is the primary working view for organizers and confirmed participants. Shows all fields, allows inline editing (for authorized roles), and exposes full detail per item.

### Activity Sequence View

A condensed, visual card sequence showing the trip's highlights. Intended for quick preview — useful for potential participants evaluating whether to join, for sharing the plan externally, or for a post-trip recap.

Each card in the sequence shows:
- Category icon (from the chosen icon pack)
- Item name
- Day and time
- One key detail (city/destination for transport, venue for places, restaurant for food)
- Per-person cost estimate (if `budget_visibility` allows — see below)

The sequence is auto-generated from the itinerary; no additional authoring is required. Items marked `SKIPPED` are omitted from post-trip sequence views.

---

## Trip Budget Estimate

Every trip has a **budget estimate** derived automatically from its itinerary items. This estimate helps potential participants decide whether to join before committing.

### Computation

| Component | Source |
|---|---|
| Total estimated cost | Sum of `amount` across all itinerary items with a non-null `amount` |
| Per-person estimate | Total / count of `CONFIRMED` participants (excluding non-traveling organizers) |
| Base currency | The trip's declared base currency |
| Category breakdown | Grouped by `category`: `TRANSPORT`, `PLACE` (accommodation), `FOOD`, `OTHER` |
| Confidence indicator | Percentage of items with `status = CONFIRMED` vs `PLANNED` — signals how firm the estimate is |

The per-person estimate updates automatically whenever:
- An itinerary item is added, edited, or removed
- A new participant is confirmed or removed

### Budget Visibility (`budget_visibility`)

The organizer controls who can see the budget estimate:

| Value | Description |
|---|---|
| `PUBLIC` | Visible on the trip's public description — accessible to anyone who can see the trip |
| `PARTICIPANTS_ONLY` | Visible only to confirmed participants and organizers |
| `ORGANIZER_ONLY` | Visible only to organizers (default for private trips) |

`budget_visibility` is stored as a field on the `trips` table. Default: `PARTICIPANTS_ONLY` for public trips, `ORGANIZER_ONLY` for private trips.

### Display on Trip Description

When `budget_visibility` permits, the trip detail page shows a **budget summary card**:

```
Estimated cost per person: ~$320 USD
  Transport:      $180  (56%)
  Accommodation:  $90   (28%)
  Food:           $30   (9%)
  Other:          $20   (6%)
Confidence: 70% of items confirmed
Based on 12 confirmed participants
```

This is an estimate for planning purposes — it is not the final expense settlement. Final costs are tracked separately in the Expenses module.

---

## Trip Completion & Gamification

When a trip transitions to `COMPLETED` status, the platform triggers a structured post-trip sequence. This is defined in full in [`features/gamification.md`](./gamification.md) — Trip Completion Flow section. In summary:

- **Statistics** are updated for all confirmed participants (`user_stats`, `group_member_stats`).
- **Achievements** are evaluated and newly unlocked ones are recorded (`user_achievements`).
- **Chamuco Points** are distributed to all confirmed participants (`chamuco_point_transactions`).
- **Feedback window** opens for 7 days — participants may leave trip feedback (scored, directed at organizers) and optional peer-to-peer notes.
- **Recognition window** opens for organizers — they may award named recognitions to any participant within the same 7-day window.

The `trips` table carries two additional fields to track these windows:

| Field | Type | Description |
|---|---|---|
| `feedback_open_until` | Timestamp (nullable) | Set at `COMPLETED` transition. Feedback and recognition submissions accepted until this time. |
| `points_distributed` | Boolean | Set to `true` after Chamuco Points have been distributed. Prevents duplicate distribution on retry. |

---

## Trip Resources

Every trip has a shared **Resources** section where participants and organizers can attach notes, documents, and links of interest that are relevant to the trip. This is a collaborative space — a lightweight wiki for the group.

### Resource Types (enum: `ResourceType`)

| Value | Description |
|---|---|
| `NOTE` | Free-form markdown text. Useful for reminders, shared checklists, packing lists, local tips, or anything that doesn't fit the structured itinerary. |
| `DOCUMENT` | A file uploaded to Cloud Storage (PDF, image, spreadsheet, etc.). Useful for insurance documents, visas, booking confirmations, maps. |
| `LINK` | An external URL with an optional title and description. Useful for hotel websites, tourist information, recommendations, booking pages. |

### Schema (`trip_resources`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | FK → `trips.id` |
| `type` | Enum `ResourceType` | `NOTE`, `DOCUMENT`, or `LINK` |
| `title` | String (nullable) | Optional for notes; required for documents and links |
| `body` | Text (nullable) | Markdown content for `NOTE`; optional description for `LINK` |
| `url` | String (nullable) | External URL (`LINK`) or Cloud Storage URL (`DOCUMENT`) |
| `file_name` | String (nullable) | Original filename for `DOCUMENT` type |
| `file_size` | Integer (nullable) | Size in bytes for `DOCUMENT` type |
| `mime_type` | String (nullable) | MIME type for `DOCUMENT` type |
| `added_by` | UUID | FK → `users.id` — the user who created this resource |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |

### Access Rules

Any confirmed participant or organizer on the trip may **add** resources. Editing and deleting follow ownership: the creator (`added_by`) may always manage their own resources; organizers and co-organizers with `EDIT_TRIP_DETAILS` may edit or delete any resource.

---

## Open Questions / To Be Defined

- Should non-traveling organizers (`is_traveling_participant = false`) have access to all expense details by default?
- Can a trip be cloned or saved as a template for repeat travel (e.g., annual trips)?
- How are time zones handled for display across multi-destination trips — show destination local time or user's local time?
- Should `PLACE / HOTEL` items be the same entity as stays in the reservations module, or a separate reference?
- Should child items of a `GUIDED_TOUR` be full itinerary items or a lightweight sub-list?
- Should the 7-day feedback window be configurable per trip by the organizer, or fixed platform-wide?
- Can the organizer extend the feedback window if it expires before they've awarded all recognitions?
- Should `budget_visibility` be configurable post-publication, or locked once the trip is `OPEN`?
- Should the activity sequence view be available publicly (for trip discovery) or only to invited/confirmed participants?
- Should the budget estimate exclude items that are not part of the group cost (e.g., items where `participant_ids` is a subset)?
- **How should past trips be registered?** Users will have travel history that predates Chamuco. Options to consider: (a) full retroactive trip creation with `status = COMPLETED` from the start, bypassing the normal lifecycle — participants are added directly without invitations; (b) a lightweight "travel history entry" with minimal required fields (destination, dates, who traveled) that contributes to stats and the discovery map but doesn't support the full trip ecosystem; (c) a "past trip" creation flow — same entity as a regular trip but with a streamlined UI, no invitations/approvals, and no pre-trip phase. The chosen approach must ensure retroactive contributions to `user_stats`, `group_member_stats`, achievements, and the discovery map.
