# Feature: Pre-Trip Planning Phase

**Status:** Design Phase
**Last Updated:** 2026-03-14
**Source insights:** `trip-planning-insights-v2.md` (derived from History Tour 2023 workbook)

---

## Overview

Before a trip's itinerary begins, there is a substantial planning phase that involves research, decisions, logistics, and preparation tasks distributed across all participants. This phase is distinct from the itinerary itself — it happens weeks or months before departure and produces the inputs (documents, bookings, cash, decisions) that the itinerary depends on.

Chamuco App models this as a dedicated **Pre-Trip Phase** associated with every trip, composed of four sub-modules:

1. **Route Planning** — Compare destination alternatives before committing to an itinerary.
2. **Pre-Trip Tasks** — Checklist of required preparations per participant, with deadlines and tracking.
3. **Budget Planning** — Per-destination cash and expense envelopes.
4. **Exchange Rates** — Reference currency rates for the trip, set and updated by the organizer.

---

## 1. Route Planning

Before the itinerary is finalized, organizers often evaluate multiple route alternatives. Each alternative is a sequence of destinations with associated transport cost estimates.

### Route Option Record

| Field | Description |
|---|---|
| `name` | Label for the option (e.g., "Option A", "Via Athens first") |
| `legs` | Ordered list of destination segments |
| `estimated_cost` | Total estimated cost in base currency |
| `notes` | Free text for observations or trade-offs |
| `is_selected` | Whether this option was chosen as the final route |

### Leg Record (within a route option)

| Field | Description |
|---|---|
| `origin` | Departure city/country |
| `destination` | Arrival city/country |
| `estimated_date` | Approximate travel date |
| `estimated_cost` | Cost in base or local currency |
| `currency` | Currency for the cost |
| `payment_method` | `CASH` or `MILES` — supports loyalty program comparison |
| `miles_value` | Estimated value of miles redemption if applicable |

### Behavior

- Multiple route options can coexist while the trip is in `DRAFT` status.
- Once the organizer selects an option, the corresponding structure seeds the initial itinerary.
- Unselected options are archived and remain visible for reference.

---

## 2. Pre-Trip Tasks

A structured checklist of preparations that must be completed before departure. Tasks are visible to all participants and each person tracks their own completion status.

### Task Record

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | Parent trip |
| `title` | String | Short description of the task |
| `description` | Text (rich) | Detailed notes, sub-items, instructions |
| `category` | Enum | See task categories below |
| `assigned_to` | `ALL` \| `[]userId` | All participants, or a specific subset |
| `start_date` | Date | When the task becomes relevant / actionable |
| `deadline` | Date | Latest date by which the task should be completed |
| `deadline_strict` | Boolean | Whether missing the deadline blocks trip confirmation |
| `created_by` | UUID | The user who created the task (typically organizer) |
| `created_at` | Timestamp | |

### Per-Participant Completion Record

Each `trip_participant` has an independent completion status per task:

| Field | Type | Description |
|---|---|---|
| `task_id` | UUID | |
| `participant_id` | UUID | |
| `status` | Enum | `PENDING`, `IN_PROGRESS`, `DONE`, `NOT_APPLICABLE` |
| `completed_at` | Timestamp | |
| `notes` | Text | Optional personal note on how they completed it |

### Task Categories (Enum: `PreTripTaskCategory`)

Derived from real-world usage:

| Value | Label | Examples |
|---|---|---|
| `DOCUMENTS` | Documents | Passport renewal, visa application, ID copy |
| `HEALTH` | Health & Vaccines | Yellow fever vaccine, travel insurance, medical kit |
| `FINANCIAL` | Financial | Enable international card use, buy foreign currency |
| `GEAR` | Gear & Packing | Power adapter, luggage scale, day backpack |
| `BOOKINGS` | Bookings | Confirm accommodation, pre-book attraction tickets |
| `LOGISTICS` | Logistics | Print itinerary, download offline maps, buy SIM |
| `COMMUNICATION` | Communication | Share emergency contacts, set up group chat |
| `OTHER` | Other | Anything that doesn't fit the above |

### Organizer View

The organizer sees an aggregate matrix:

```
Task                          | P1  | P2  | P3   | P4  | P5  | P6   | Progress
------------------------------|-----|-----|------|-----|-----|------|----------
Medical insurance             |  ✓  |  ✓  |  -   |  ✓  |  ✗  |  ✗   |  3/6
Yellow fever vaccine          |  ✓  |  ✗  |  ✓   |  ✗  |  ✗  |  ✗   |  2/6
Enable international cards    |  ✓  |  ✓  |  ✓   |  ✓  |  ✓  |  ✓   |  6/6  ✓
```

*(Columns use participant `display_name` values. See `participants.md`.)*

### Participant View

Each participant sees only their own tasks, their completion status, and deadlines — not other participants' statuses (unless the organizer configures visibility).

---

## 3. Deadline Tracking & Reminders

Pre-trip tasks are time-sensitive. The system must actively support deadline awareness through notifications and status signals.

### Deadline States (derived automatically)

| State | Condition | Display |
|---|---|---|
| `ON_TRACK` | Deadline is in the future and task is pending or in progress | Normal |
| `DUE_SOON` | Deadline is within N days (configurable, default 7) and not done | Yellow warning |
| `OVERDUE` | Deadline has passed and status is not `DONE` | Red alert |
| `COMPLETED` | Status is `DONE` | Green check |
| `NOT_APPLICABLE` | Participant marked as not applicable | Grey |

### Reminder Notifications

Automatic notifications are sent to participants at the following trigger points:

| Trigger | Recipient | Message example |
|---|---|---|
| Task created (assigned to them) | Assignees | "New pre-trip task: Get your medical insurance before Oct 1" |
| `start_date` reached | Assignees with `PENDING` status | "You can now start: Enable your international card" |
| 7 days before deadline | Assignees not yet `DONE` | "⚠ Due in 7 days: Yellow fever vaccine" |
| 3 days before deadline | Assignees not yet `DONE` | "⚠ Due in 3 days: Yellow fever vaccine" |
| 1 day before deadline | Assignees not yet `DONE` | "🚨 Due tomorrow: Yellow fever vaccine" |
| Deadline passed | Assignees still `PENDING` / `IN_PROGRESS` | "⏰ Overdue: Yellow fever vaccine — please update your status" |
| All participants complete a task | Organizer | "✓ All participants completed: Medical insurance" |
| Participant completes a task | Organizer (if `notify_organizer = true`) | "Javi marked 'Medical insurance' as done" |

### Strict Deadline Behavior

If a task is marked `deadline_strict = true`, the following applies:

- The trip cannot transition from `OPEN` to `CONFIRMED` status while any participant has an overdue strict task.
- The organizer is warned prominently when attempting to confirm the trip.
- The organizer can manually override with a justification note.

---

## 4. Budget Planning

Per-destination cash and spending envelopes. Helps participants know how much cash (and in what currency) to prepare for each leg of the trip.

### Budget Envelope Record

| Field | Description |
|---|---|
| `trip_id` | Parent trip |
| `country` | Country name |
| `city` | City or "All" for country-wide |
| `currency` | Local currency for this destination |
| `card_budget` | Planned card spending amount |
| `cash_budget` | Planned cash spending amount |
| `total_budget` | Sum of card + cash |
| `usd_equivalent` | Informational USD equivalent |
| `eur_equivalent` | Informational EUR equivalent |
| `notes` | Free text (e.g., "Excludes €110 catamaran excursion") |

This data is set by the organizer as a **recommendation** for participants, not a hard limit. It answers the practical question: "How much cash should I bring to Egypt?"

---

## 5. Exchange Rates

A set of reference exchange rates stored at the trip level. Used to compute COP (or any base currency) equivalents throughout the trip's financial tracking.

### Exchange Rate Record (`trip_exchange_rates`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | Parent trip |
| `currency` | String (ISO 4217) | Foreign currency (e.g., `GBP`, `EUR`, `EGP`, `MAD`) |
| `rate_to_base` | Decimal | Units of base currency per 1 unit of `currency` (e.g., 1 GBP = 4,847 COP → `rate_to_base = 4847`) |
| `set_at` | Timestamp | When the rate was recorded |
| `set_by` | UUID | User who set the rate |
| `source` | Enum `ExchangeRateSource` | `MANUAL` or `API` |

**Enum `ExchangeRateSource`:** `MANUAL` \| `API`

> When an expense is created in a foreign currency, it reads `rate_to_base` from this table and stores it as `exchange_rate_snapshot` on the expense record. Subsequent rate updates do not alter existing expenses. See `expenses.md` for the full expense model.

### Behavior

- Rates are set once by the organizer at planning time and apply throughout the trip.
- The organizer can update rates if they change significantly before or during the trip.
- When an expense is recorded in a foreign currency, the system looks up the stored trip rate to compute the base currency equivalent.
- The original rate is stored on the expense record itself (snapshot), so future rate changes don't alter historical expense totals.

---

## 6. Pre-Trip Phase Status

The pre-trip phase has its own progress indicators, separate from the trip's overall status:

| Indicator | Description |
|---|---|
| **Tasks completion** | X of Y tasks completed across all participants |
| **Documents readiness** | All `DOCUMENTS` category tasks done for all participants |
| **Financial readiness** | All `FINANCIAL` category tasks done |
| **Overdue tasks** | Count of tasks past their deadline |
| **Budget set** | Whether the organizer has filled in destination budgets |
| **Rates set** | Whether exchange rates have been configured |

A **Pre-Trip Readiness Score** (simple percentage or traffic-light indicator) gives the organizer a quick health check of how prepared the group is before departure.

---

## 7. Pre-Trip Items in the Itinerary (Day 0)

Even with the pre-trip module, some preparatory items belong **on the itinerary timeline** because they represent real activities with a time and a cost:

- Currency exchange (buying dollars before departure)
- Printing the itinerary
- Group merchandise (e.g., matching t-shirts)
- Advance payments / deposits already made

These are logged as itinerary items under a **"Day 0 — Pre-departure"** block that appears before the trip's official departure date. This day is automatically created when the first pre-departure itinerary item is added. See `trips.md` for the full itinerary item model.

---

## 8. Open Questions / To Be Defined

- Can participants add their own pre-trip tasks, or is it organizer-only?
- Should there be a template library of common pre-trip tasks (e.g., "Standard international trip checklist") that organizers can import?
- At what point does the pre-trip phase "end" — is it on departure date, or when the organizer manually closes it?
- Should overdue strict tasks send escalation notifications to the organizer as well as the participant?
- Is the budget planner visible to all participants, or only to the organizer? (Participants likely benefit from knowing the recommended cash amounts.)
- Should reminder notification frequency be configurable per task, or is the global schedule (7d / 3d / 1d) sufficient?
- Does the pre-trip checklist survive if the trip is cancelled — should it be archived or deleted?
