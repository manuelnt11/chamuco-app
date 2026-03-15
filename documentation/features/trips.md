# Feature: Trips

**Status:** Design Phase
**Last Updated:** 2026-03-15

---

## Overview

The **Trip** is the central entity of Chamuco App. Everything else — participants, itinerary, expenses, reservations, communications — is organized around a trip. A trip can range from a simple weekend outing to a multi-leg international journey.

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

Within a trip, each participant holds a role (enum: `TripRole`):

| Value | Description |
|---|---|
| `ORGANIZER` | Creates and manages the trip. Sets rules, controls invitations, manages the itinerary. Does not have to be a participant. |
| `CO_ORGANIZER` | Shares organizational permissions with the organizer. |
| `PARTICIPANT` | A confirmed attendee of the trip. |
| `INVITED` | Has received an invitation but has not yet confirmed. |
| `DECLINED` | Declined the invitation. |
| `WAITLISTED` | Accepted but on a waitlist pending capacity. |

---

## Trip Visibility

Configurable visibility (enum: `TripVisibility`):

| Value | Description |
|---|---|
| `PRIVATE` | Only invited users can see the trip. |
| `LINK_ONLY` | Anyone with the link can view (read-only). |
| `PUBLIC` | Listed publicly in the community feed. |

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

## Open Questions / To Be Defined

- Can a trip have multiple organizers, or only one with co-organizers?
- Should organizers who are not participants be able to see all expense details?
- Can a trip be cloned or saved as a template for repeat travel (e.g., annual trips)?
- How are time zones handled for display across multi-destination trips — show destination local time or user's local time?
- Should `PLACE / HOTEL` items be the same entity as stays in the reservations module, or a separate reference?
- Should child items of a `GUIDED_TOUR` be full itinerary items or a lightweight sub-list?
