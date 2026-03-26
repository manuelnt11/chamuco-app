# Feature: Expenses

**Status:** Design Phase
**Last Updated:** 2026-03-19

---

## Overview

The expenses module is a **collaborative trip ledger**. Participants record what was spent, who paid, and how to divide it. Since Chamuco does not process real money, the result is a settlement plan that participants execute outside the app. The model is inspired by Splitwise: one or more people pay for a cost, the app tracks who owes whom across the entire trip, and at the end it computes the minimum transfers needed to settle all debts.

Expenses are organized in two layers:

- **Planned costs** (`trip_budget_items`) — defined by the organizer before or during the trip; feed into the budget estimate.
- **Actual expenses** (`expenses`) — recorded when money is spent; the live ledger.

Planned costs and actual expenses can be linked: when a budget item is paid, an expense record is created and connected back to it.

---

## Expense Timing

| Value      | Description                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| `PRE_TRIP` | Recorded before departure (cruise reservation, advance payment, group insurance). Organizer marks as paid. |
| `IN_TRIP`  | Recorded during the trip (restaurant, taxi, excursion ticket).                                             |

---

## Expense Ownership

| Value        | Split behavior                                                                            | Ledger purpose                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `SHARED`     | Divided among a defined set of participants (all travelers or a subset). Generates debts. | Financial settlement                                                                           |
| `INDIVIDUAL` | One person paid for themselves. No split, no debt generated.                              | Reference — contributes to each person's total trip spend and the group's aggregate cost view. |

**Individual expenses appear in the group ledger.** This allows the full picture of what the trip cost to be visible to all participants at the end, even for things each person handled on their own (transport to the departure port, personal drinks). The individual payer owes nothing to anyone — their entry is informational.

---

## Planned Costs (`trip_budget_items`)

The organizer defines a cost schedule for the trip — anticipated expenses shown in the budget estimate. Each item is `REQUIRED` (everyone is expected to pay) or `OPTIONAL` (each participant opts in).

### Budget Item Record

| Field                    | Type                           | Description                                                                                                                              |
| ------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | UUID                           |                                                                                                                                          |
| `trip_id`                | UUID                           |                                                                                                                                          |
| `title`                  | String                         | e.g., "Cruise reservation", "Unlimited drinks package"                                                                                   |
| `description`            | Text (nullable)                |                                                                                                                                          |
| `category`               | Enum `ExpenseCategory`         |                                                                                                                                          |
| `participation`          | Enum `BudgetItemParticipation` | `REQUIRED` or `OPTIONAL`                                                                                                                 |
| `sharing`                | Enum `BudgetItemSharing`       | `INDIVIDUAL` (each person independently) or `SHARED` (participants form groups to share one unit). Only meaningful for `OPTIONAL` items. |
| `max_sharing_group_size` | Integer (nullable)             | For `OPTIONAL / SHARED`: maximum participants per sharing group. Enforced on opt-in.                                                     |
| `unit_cost`              | Decimal (nullable)             | Cost per person (for per-person items) or estimated group total                                                                          |
| `unit_cost_currency`     | String                         |                                                                                                                                          |
| `is_per_person`          | Boolean                        | Whether `unit_cost` is per person or for the whole group                                                                                 |
| `timing`                 | Enum `ExpenseTiming`           | `PRE_TRIP` or `IN_TRIP`                                                                                                                  |
| `linked_expense_id`      | UUID (nullable)                | FK → `expenses.id` once this planned cost is paid and recorded                                                                           |
| `created_by`             | UUID                           |                                                                                                                                          |
| `created_at`             | Timestamp                      |                                                                                                                                          |
| `updated_at`             | Timestamp                      |                                                                                                                                          |

### Optional Budget Items — Opt-in (`trip_budget_item_optins`)

For `OPTIONAL` items, each participant (or the organizer on their behalf) registers an opt-in:

| Field            | Type                 | Description                                                                                                             |
| ---------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`             | UUID                 |                                                                                                                         |
| `budget_item_id` | UUID                 |                                                                                                                         |
| `initiated_by`   | UUID                 | Participant who created the opt-in, or organizer who assigned it                                                        |
| `participants`   | UUID[] (JSONB)       | Who is in this opt-in. Single-element for `INDIVIDUAL` sharing; multiple for `SHARED` (max = `max_sharing_group_size`). |
| `marked_paid`    | Boolean              | Organizer marks this opt-in group as paid                                                                               |
| `marked_paid_by` | UUID (nullable)      |                                                                                                                         |
| `marked_paid_at` | Timestamp (nullable) |                                                                                                                         |
| `expense_id`     | UUID (nullable)      | Link to actual expense once paid                                                                                        |
| `created_at`     | Timestamp            |                                                                                                                         |

**Rules for `OPTIONAL / SHARED` items:**

- A participant opts in by declaring who they share with (up to `max_sharing_group_size`).
- An organizer can also create opt-in groups and assign participants to them.
- Once a group reaches `max_sharing_group_size`, it is closed. A new group can be started for additional participants.
- Multiple sharing groups per budget item are allowed (e.g., three cabins of four people each buying internet — three separate opt-in groups).

---

## Expense Record (`expenses`)

The actual ledger entry. One record per cost event.

| Field                    | Type                    | Description                                                                   |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------- |
| `id`                     | UUID                    |                                                                               |
| `trip_id`                | UUID                    |                                                                               |
| `title`                  | String                  | Short description (e.g., "Dinner at La Puerta Falsa")                         |
| `description`            | Text (nullable)         |                                                                               |
| `category`               | Enum `ExpenseCategory`  |                                                                               |
| `ownership`              | Enum `ExpenseOwnership` | `SHARED` or `INDIVIDUAL`                                                      |
| `currency`               | String (ISO 4217)       | Currency in which the expense is denominated                                  |
| `total_amount`           | Decimal                 | Total amount paid in `currency`                                               |
| `exchange_rate_snapshot` | Decimal                 | Confirmed rate at time of recording. **Immutable after save.**                |
| `total_amount_base`      | Decimal                 | Computed: `total_amount × exchange_rate_snapshot`. Stored, not recomputed.    |
| `split_type`             | Enum `SplitType`        | `EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`. Ignored for `INDIVIDUAL` ownership. |
| `timing`                 | Enum `ExpenseTiming`    | `PRE_TRIP` or `IN_TRIP`                                                       |
| `budget_item_id`         | UUID (nullable)         | FK → `trip_budget_items.id` if this expense fulfills a planned cost           |
| `itinerary_item_id`      | UUID (nullable)         | Optional link to the itinerary item this cost belongs to                      |
| `date`                   | Date                    | When the expense occurred or is expected to occur                             |
| `receipt_url`            | String (nullable)       | URL to receipt image / PDF in Cloud Storage                                   |
| `notes`                  | Text (nullable)         |                                                                               |
| `created_by`             | UUID                    | Expense creator — holds edit control over payers and splits                   |
| `created_at`             | Timestamp               |                                                                               |
| `updated_at`             | Timestamp               |                                                                               |

### `expense_payers`

Who paid, and how much. The sum of all payer amounts must equal `total_amount`.

| Field            | Type                 | Description                                     |
| ---------------- | -------------------- | ----------------------------------------------- |
| `expense_id`     | UUID                 |                                                 |
| `participant_id` | UUID                 |                                                 |
| `amount_paid`    | Decimal              | How much this participant paid toward the total |
| `payment_method` | Enum `PaymentMethod` |                                                 |

### `expense_splits`

How the expense is distributed among beneficiaries. Applies to `SHARED` expenses only.

| Field              | Type    | Description                                                 |
| ------------------ | ------- | ----------------------------------------------------------- |
| `expense_id`       | UUID    |                                                             |
| `participant_id`   | UUID    |                                                             |
| `owed_amount`      | Decimal | This participant's share in the expense's original currency |
| `owed_amount_base` | Decimal | `owed_amount` in trip base currency                         |

For `EQUAL` splits, `expense_splits` records are auto-generated and stored when the expense is saved. For `EXACT`, amounts are manually entered by the creator. For `PERCENTAGE` and `SHARES`, the app computes and stores the final amounts.

---

## Participant Scope & `did_travel`

A confirmed participant may not travel in the end. Expense splits must reflect who **actually traveled**.

The `trip_participants` record gains a `did_travel` field:

| Field        | Type               | Description                                                                                                                                                         |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `did_travel` | Boolean (nullable) | `null` while trip is active. Set at trip completion — defaults to `true` for all `CONFIRMED` participants unless the organizer explicitly marks someone as `false`. |

When recording a `SHARED` expense, only participants with `did_travel = true` (or `null`, while the trip is active) are eligible for the participant scope. An expense creator selects scope from this eligible list. The organizer can edit any expense to adjust scope if a participant's `did_travel` status changes.

---

## Split Types (Enum: `SplitType`)

| Value        | Description                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| `EQUAL`      | Divided equally among all participants in scope. Default.                                                      |
| `EXACT`      | Each participant in scope is manually assigned a specific amount. Amounts must sum to `total_amount`.          |
| `PERCENTAGE` | Each participant is assigned a percentage of the total. Must sum to 100%.                                      |
| `SHARES`     | Participants are assigned integer share units (e.g., one person takes 2 shares vs. 1 share for everyone else). |

The expense creator chooses the split type when recording the expense and can update it (along with the distribution) at any time. Organizers can override.

---

## Expense Categories (Enum: `ExpenseCategory`)

| Value               | Examples                                              |
| ------------------- | ----------------------------------------------------- |
| `TRANSPORT`         | Flight, bus, metro, ferry, transfer, taxi, car rental |
| `ACCOMMODATION`     | Hotel, hostel, Airbnb, cruise cabin                   |
| `FOOD`              | Restaurant, groceries, group meal                     |
| `ACTIVITY`          | Entrance fee, tour, excursion, guided experience      |
| `CITY_PASS`         | Tourist pass covering multiple attractions            |
| `VISA`              | Visa fees and processing                              |
| `INSURANCE`         | Travel or medical insurance                           |
| `ENTERTAINMENT`     | Shows, nightlife, drinks, personal leisure            |
| `COMMUNICATION`     | SIM card, Wi-Fi package, data plan                    |
| `CURRENCY_EXCHANGE` | Exchange office fee, card foreign transaction fee     |
| `GEAR`              | Group merchandise, printed itinerary, supplies        |
| `HEALTH`            | Medicine, medical expenses during trip                |
| `TIPS`              | Gratuities                                            |
| `OTHER`             | Anything else                                         |

---

## Payment Methods (Enum: `PaymentMethod`)

| Value           | Description                                |
| --------------- | ------------------------------------------ |
| `CREDIT_CARD`   | Paid with credit card                      |
| `DEBIT_CARD`    | Paid with debit card                       |
| `CASH`          | Paid in cash                               |
| `BANK_TRANSFER` | Bank transfer                              |
| `NEQUI`         | Nequi (Colombian mobile payment)           |
| `DAVIPLATA`     | Daviplata (Colombian mobile payment)       |
| `MILES`         | Paid using loyalty miles (e.g., LifeMiles) |
| `OTHER`         | Any other method                           |

---

## Multi-Currency Handling

Expenses are recorded in the currency they were incurred. Every trip has a **base currency** defined at creation. All balances and settlement amounts are expressed in that base currency.

The full exchange rate model (two-level: trip-level reference + expense-level snapshot) is defined in [`features/pre-trip-planning.md`](./pre-trip-planning.md) — Section 5. Rules as they apply to expenses:

1. `currency` and `total_amount` always store the original denomination — never converted or overwritten.
2. `exchange_rate_snapshot` is user-confirmed at the moment of recording. **It is never modified afterwards.** Future changes to trip-level rates do not affect historical expenses.
3. `total_amount_base` and `owed_amount_base` are computed once at creation and stored.

---

## Access & Edit Control

| Action                                    | Who can do it                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Record a new `SHARED` expense             | Any confirmed traveler or organizer                                    |
| Record a new `INDIVIDUAL` expense         | The traveler themselves (or organizer on their behalf)                 |
| Edit payers, split type, and distribution | Expense creator or any organizer (co-organizer with `MANAGE_EXPENSES`) |
| Mark a budget item opt-in as paid         | Any organizer                                                          |
| View all expenses                         | Confirmed travelers and organizers                                     |

---

## Settlement

At trip completion, the app computes net balances and produces the minimal debt graph.

### Balance Calculation

For each participant:

```
net_balance = SUM(expense_payers.amount_paid) − SUM(expense_splits.owed_amount)
```

Only `SHARED` expenses contribute to debts. `INDIVIDUAL` expenses appear in each person's personal total but do not generate any receivable or payable.

A positive net balance means the participant is **owed** money. A negative balance means they **owe** money.

### Debt Simplification

The app applies a debt-simplification algorithm (Splitwise-style) to produce the minimum number of `{from → to, amount}` transfers that zero out all balances.

### `expense_settlements`

| Field                 | Type                            | Description                                             |
| --------------------- | ------------------------------- | ------------------------------------------------------- |
| `id`                  | UUID                            |                                                         |
| `trip_id`             | UUID                            |                                                         |
| `from_participant_id` | UUID                            | Participant who owes                                    |
| `to_participant_id`   | UUID                            | Participant who is owed                                 |
| `amount`              | Decimal                         | Settlement amount in trip base currency                 |
| `currency`            | String                          | May differ from base currency if agreed between parties |
| `payment_method`      | Enum `PaymentMethod` (nullable) |                                                         |
| `status`              | Enum `SettlementStatus`         | `PENDING`, `CONFIRMED`                                  |
| `confirmed_at`        | Timestamp (nullable)            | When the payee confirmed receipt                        |
| `notes`               | Text (nullable)                 |                                                         |
| `created_at`          | Timestamp                       |                                                         |

Settlements are proposed automatically when the trip reaches `COMPLETED`. The payee confirms receipt manually. No real money moves through Chamuco — confirmation is on the honor system.

---

## Expense Visibility

Expense records are visible to **confirmed travelers and organizers** only. The pre-trip budget planner (budget items and estimates) follows trip visibility and is visible to anyone who can see the trip. See [`features/pre-trip-planning.md`](./pre-trip-planning.md) — Budget Visibility.

---

## Open Questions / To Be Defined

- Should expenses be editable after the trip is `COMPLETED` (e.g., to correct an amount after settlement is proposed)?
- Can guests (`trip_guests`) be included in expense splits? Their cost would roll up to their sponsor participant.
- Can non-traveling organizers (`is_traveling_participant = false`) be manually added to specific expense splits?
- Should the settlement algorithm run automatically at `COMPLETED` or require the organizer to trigger it?
- How are pre-trip shared expenses handled for a participant who was confirmed but `did_travel = false`? Their pre-paid portion needs to be resolved (refund or absorption) outside the app — should there be a way to annotate this in the ledger?
- Should the `PERCENTAGE` and `SHARES` split types be exposed in the UI, or are `EQUAL` and `EXACT` sufficient for most use cases?
