# Feature: Expenses

**Status:** Design Phase
**Last Updated:** 2026-03-14

---

## Overview

The expenses module allows trip participants to record shared and individual costs, track payment status, split amounts among the applicable participants, and compute a settlement plan at the end of the trip. All monetary values are stored in their original currency with a base-currency equivalent for cross-currency comparison.

---

## Financial Model

This model is derived from real-world trip planning data. The key insight is that **expenses are scoped to a subset of participants**, not necessarily the full group.

### Core Concepts

**`amount`** — The total cost of the expense in its original currency, covering all applicable participants.

**`participant_scope`** — Which specific participants this expense applies to (a subset of the trip's confirmed participants). This can be 1 person, a subgroup, or everyone.

**`participant_count`** — The number of participants in `participant_scope`. Auto-derived from the list.

**`amount_per_participant`** — Auto-computed: `amount / participant_count`. The share each person in scope owes or has paid.

**`base_currency_equivalent`** — The `amount_per_participant` expressed in the trip's base currency (e.g., COP), computed using the trip's stored exchange rate at time of recording.

**`exchange_rate_snapshot`** — The specific rate used to compute `base_currency_equivalent`, stored immutably on the record so future rate updates do not alter historical amounts.

**`is_paid`** — Whether the total amount has already been paid (e.g., a pre-booked flight). `true` = paid; `false` = pending payment or estimation only.

**`paid_amount`** — How much has actually been paid so far (supports partial/advance payments). May differ from `amount` when a deposit was made but the full amount is outstanding.

---

## Expense Record (`expenses`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | Parent trip |
| `itinerary_item_id` | UUID (nullable) | Optional link to the itinerary item this cost belongs to |
| `title` | String | Short description (e.g., "Dinner at La Puerta Falsa") |
| `category` | Enum `ExpenseCategory` | See categories below |
| `expense_type` | Enum `ExpenseType` | See types below |
| `currency` | String (ISO 4217) | Currency in which the expense is denominated |
| `amount` | Decimal | Total group cost in `currency` |
| `participant_scope` | UUID[] | Which participant IDs this expense covers |
| `participant_count` | Integer | Auto-derived from `participant_scope` length |
| `amount_per_participant` | Decimal | Auto-computed: `amount / participant_count` |
| `base_currency_equivalent` | Decimal | `amount_per_participant` in trip base currency |
| `exchange_rate_snapshot` | Decimal | Exchange rate at time of recording |
| `is_paid` | Boolean | Whether payment has been made |
| `paid_amount` | Decimal | Amount actually paid so far (for partial/advance payments) |
| `payment_method` | Enum `PaymentMethod` | How it was or will be paid |
| `paid_by` | UUID (nullable) | The participant who paid on behalf of the group (for group expenses) |
| `date` | Date | When the expense occurred or is expected to occur |
| `notes` | Text | Optional free-text notes |
| `receipt_url` | String (nullable) | URL to receipt image / PDF stored in Cloud Storage |
| `created_by` | UUID | Who recorded this expense |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |

---

## Expense Categories (enum: `ExpenseCategory`)

| Value | Description | Examples |
|---|---|---|
| `TRANSPORT` | Any transport cost | Flight, bus, metro, ferry, transfer |
| `ACCOMMODATION` | Lodging costs | Hotel, hostel, Airbnb |
| `FOOD` | Meals and drinks | Restaurant, groceries, snacks |
| `ACTIVITY` | Entrance fees, tours, excursions | Museum ticket, guided tour, catamaran excursion |
| `CITY_PASS` | Tourist pass covering multiple attractions | London Explorer Pass |
| `VISA` | Visa fees | Egypt e-visa |
| `INSURANCE` | Travel or medical insurance | |
| `CURRENCY_EXCHANGE` | Currency exchange cost or commission | Exchange office fee |
| `GEAR` | Group merchandise or supplies | Matching t-shirts, printed itinerary |
| `ADMINISTRATIVE` | Bank fees, card commissions | Credit card foreign transaction fee |
| `OTHER` | Anything else | |

---

## Expense Types (enum: `ExpenseType`)

| Value | Description |
|---|---|
| `STANDARD` | A regular expense incurred during the trip. |
| `ADVANCE_PAYMENT` | A deposit or partial payment made before the trip or before the service is rendered. The remaining balance is tracked separately. |
| `COMMISSION` | A fee charged by a service provider (e.g., card payment commission). |
| `REIMBURSEMENT` | A refund or reimbursement to be tracked. |

---

## Payment Methods (enum: `PaymentMethod`)

| Value | Description |
|---|---|
| `CREDIT_CARD` | Paid with credit card |
| `DEBIT_CARD` | Paid with debit card |
| `CASH` | Paid in cash |
| `BANK_TRANSFER` | Bank transfer |
| `NEQUI` | Nequi (Colombian mobile payment) |
| `DAVIPLATA` | Daviplata (Colombian mobile payment) |
| `MILES` | Paid using loyalty miles (e.g., LifeMiles) |
| `OTHER` | Any other method |

---

## Advance Payments (`ADVANCE_PAYMENT`)

Some group expenses are paid as a deposit before the trip departs (e.g., a cruise or tour down payment). These are modeled as `ExpenseType.ADVANCE_PAYMENT` and linked to the eventual full expense record.

The outstanding balance is visible on the trip's financial dashboard until the full amount is paid and marked as `is_paid = true`.

Example from real data: A river cruise required a group deposit of COP 5,238,861 before departure. The full cruise cost was COP 2,357,100 per person. The advance payment item tracked the group total and the per-person share separately.

---

## Expense Splits

For group expenses, the split defines what each participant in `participant_scope` owes. The default is equal split but can be overridden.

### Split Strategies (enum: `SplitStrategy`)

| Value | Description |
|---|---|
| `EQUAL` | Divided equally among all participants in scope. Default. |
| `EXACT` | Each participant is assigned a specific amount. Amounts must sum to `amount`. |
| `PERCENTAGE` | Each participant is assigned a percentage. Must sum to 100%. |
| `SHARES` | Participants are assigned integer share units (e.g., 1 share vs. 2 shares). |

### `expense_splits` table

| Field | Type | Description |
|---|---|---|
| `expense_id` | UUID | |
| `participant_id` | UUID | |
| `owed_amount` | Decimal | What this participant owes (in expense's original currency) |
| `owed_amount_base` | Decimal | `owed_amount` in trip base currency |
| `is_settled` | Boolean | Whether this participant's share has been settled |

---

## Settlement

At any point, the system computes each participant's net balance across all expenses. A settlement plan proposes the minimum number of transfers to zero out all balances.

### Balance Calculation

For each participant:
```
net_balance = sum(expenses where they are paid_by) - sum(owed_amounts across all expense_splits)
```

A positive balance means the participant is owed money. A negative balance means they owe money.

### `expense_settlements` table

Records actual payments made between participants to reduce debts:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | |
| `from_participant_id` | UUID | Who paid |
| `to_participant_id` | UUID | Who received |
| `amount` | Decimal | Amount transferred |
| `currency` | String | Currency of the transfer |
| `payment_method` | Enum `PaymentMethod` | |
| `settled_at` | Date | |
| `notes` | Text | Optional |
| `created_at` | Timestamp | |

---

## Multi-Currency Handling

Expenses are recorded in the currency they were actually incurred. The system handles multiple currencies within one trip (real-world example: COP, USD, GBP, EUR, EGP, MAD in a single trip).

Every trip has a **base currency** defined at creation. All totals, balances, and settlement amounts are consolidated in that base currency.

### Two-level exchange rate model

Exchange rates work in two levels. The full model is defined in `pre-trip-planning.md` (section 5). Summary as it applies to expenses:

**Level 1 — Trip-level reference rate:** The organizer defines a reference rate for each currency pair at planning time (e.g., 1 EGP = 215 COP). This rate is suggested by ExchangeRate-API and confirmed manually. It serves as the default when recording expenses.

**Level 2 — Expense-level effective rate (`exchange_rate_snapshot`):** Each expense records its own rate — the actual rate obtained at the moment of the transaction (ATM rate, bank rate, physical exchange office rate, credit card rate). The app pre-fills this from the trip-level rate as a convenience, but the user confirms or overrides it before saving.

This reflects the reality that every transaction happens at a different time, through a different payment method, at a rate that cannot be predicted at planning time. The trip-level rate is a reference; the expense-level rate is the financial truth.

### Rules

1. `currency` and `amount` always store the original denomination — never converted or overwritten.
2. `exchange_rate_snapshot` is the user-confirmed effective rate for that specific transaction. It is set at creation time and **never modified afterwards**.
3. `base_currency_equivalent` is computed once at creation (`amount_per_participant × exchange_rate_snapshot`) and stored — it does not change if trip-level rates are updated later.
4. Balances and settlement suggestions are always displayed in the trip's base currency but can be toggled to any other currency in the trip.

---

## Expense Visibility

- All confirmed participants can view the trip's expense list by default.
- The organizer can restrict visibility (e.g., hide individual amounts).
- Each participant can always see their own balance and their own expense splits.

---

## Open Questions / To Be Defined

- Who can add expenses — only the payer, or any participant?
- Who can edit or delete an expense — only the creator, or organizers too?
- Should expense settlement be enforced within the app (tracked and closed), or is it advisory only?
- Is there a payment integration planned (Nequi, PSE, Stripe)? This changes settlement from advisory to transactional.
- Should there be a "trip budget" feature where the organizer sets an expected total cost per person, and the app tracks variance vs. actual?
- How are expenses handled for guest participants (non-registered travelers sponsored by a confirmed participant)?
