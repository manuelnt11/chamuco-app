# Chamuco App — Database Design

**Status:** Proposed
**Last Updated:** 2026-03-19

---

## Database Engine

**PostgreSQL** with JSONB support.

The design philosophy balances relational integrity for core entities with document-style flexibility for sub-entities that naturally belong to a single parent. This avoids over-normalization without sacrificing the queryability and consistency of relational data.

---

## Design Principles

1. **Relational tables for entities with independent existence** — If an entity can exist independently, be referenced by multiple parents, or needs to be queried/filtered across trips, it gets its own table.

2. **JSONB for sub-entities scoped to a single parent** — If data only exists in the context of its parent and rarely needs to be queried independently, it can be stored as a JSONB column on the parent row. Examples: custom fields on an activity, contact info embedded in a stay.

3. **No unnecessary join tables** — Avoid creating association tables unless the relationship itself carries data or needs to be queried independently.

4. **Soft deletes** — Core entities (trips, users, participants) should use soft deletes (`deleted_at` timestamp) rather than hard deletes to preserve audit trails.

5. **Audit fields** — All tables include `created_at`, `updated_at`, and `deleted_at`.

---

## Core Entity Overview

> Detailed schemas will be defined per-module as design matures. This section captures the high-level entity relationships.

### Users & Identity
- `users` — Account records. Linked to Google SSO identity.
- `user_profiles` — Extended profile data (bio, avatar, privacy settings). Could be a JSONB column on `users` or a separate table depending on query needs.
- `user_preferences` — Display and UX preferences (language, currency, theme). 1:1 with `users`. See `design/preferences.md`.
- `user_stats` — Computed travel statistics (trips completed, countries visited, km traveled, etc.). 1:1 with `users`. Updated during trip completion flow. See `features/gamification.md`.
- `user_achievements` — Records of unlocked achievements per user. See `features/gamification.md`.
- `chamuco_point_transactions` — Immutable ledger of point earn/spend events. Balance is computed from this log, never stored directly. See `features/gamification.md`.
- `recognitions` — Peer-awarded badges tied to a trip, group, or event. See `features/gamification.md`.
- `support_admin_audit_log` — Immutable log of every write performed by a `SUPPORT_ADMIN` user. Carries `admin_user_id`, `action`, `target_table`, `target_id`, `before_state` (JSONB), `after_state` (JSONB), `performed_at`. Records are never updated or deleted. See `features/users.md` and `infrastructure/auth.md`.

### Social / Community
- `groups` — Named collections of users.
- `group_members` — Users belonging to groups (junction table, carries role/permissions).
- `group_member_stats` — Per-member gamification stats within a specific group: tier, completed trips, seniority, streak. See `features/gamification.md` and `features/community.md`.
- `group_resources` — Notes, documents, and links attached to a group by its members. Shares the `ResourceType` enum with `trip_resources`. See `features/community.md`.
- `conversations` — Chat threads (direct messages, group chats, trip chats).
- `messages` — Individual messages within a conversation.
- `channels` — Broadcast channels for one-to-many announcements.

### Trips
- `trips` — The central entity. Holds metadata, status, settings.
- `trip_participants` — Users invited/confirmed on a trip. Carries attendance status, role, co-organizer permissions, and traveling flag.
- `trip_visible_to_groups` — Join table (`trip_id`, `group_id`). Defines which groups can discover a `PRIVATE` trip and whose members may submit join requests. See `features/participants.md` and `features/trips.md`.
- `trip_role_invitations` — Pending invitations to assign a user the `ORGANIZER` or `CO_ORGANIZER` role. Distinct from participant invitations. Carries `invited_role`, `co_organizer_permissions`, `will_travel`, and `invited_by`. Deleted on acceptance, decline, or revocation. See `features/participants.md`.
- `trip_resources` — Notes, documents, and links attached to a trip by participants or organizers. Uses `ResourceType` enum (`NOTE`, `DOCUMENT`, `LINK`). See `features/trips.md`.
- `trip_guests` — Non-registered travelers sponsored by a confirmed participant (e.g., children, relatives). Linked to the sponsor's `trip_participant` record. See `features/participants.md`.
- `trip_confirmation_rules` — Rules defined by the trip organizer for attendance confirmation (can be JSONB on `trips`).

### Pre-Trip Planning
- `pre_trip_tasks` — Checklist tasks for a trip. Type-discriminated: `ORGANIZER` (single-status, organizer-owned), `GROUP` (per-participant completion tracking), `PERSONAL` (self-managed by each traveler). See `features/pre-trip-planning.md`.
- `pre_trip_task_completions` — Per-participant completion records for `GROUP`-type tasks. See `features/pre-trip-planning.md`.
- `pre_trip_task_templates` — Reusable task set definitions. Source is either `PLATFORM` (Chamuco-curated) or `USER` (organizer-saved). Tasks stored as JSONB with relative deadline offsets. See `features/pre-trip-planning.md`.
- `trip_exchange_rates` — Organizer-defined reference exchange rates per currency pair for a trip. See `features/pre-trip-planning.md`.

### Itinerary
- `itinerary_items` — Ordered sequence of events on a trip. Each item references a `movement`, `stay`, or `activity`.

### Movements (Transport)
- `movements` — A transport segment. Includes type (flight, bus, car, ferry, etc.), origin, destination, schedule.
- `movement_reservations` — Booking/reservation status for a movement.

### Stays (Accommodation)
- `stays` — An accommodation covering one or more consecutive nights (`check_in_date` → `check_out_date`). A trip may have many stays; one stay covers all its nights without per-night repetition. Carries a `use_trip_room_groups` flag to select the distribution source. See `features/reservations.md`.
- `trip_room_groups` — Default room/cabin/unit groupings at the trip level. Applies to all stays that have `use_trip_room_groups = true`. Stores participant assignments as JSONB. See `features/reservations.md`.
- `stay_room_groups` — Per-stay override room groupings for stays that deviate from the trip default. See `features/reservations.md`.
- `reservations` — Booking/reservation status for a stay or transport segment. Supports multiple booking references per item (one per participant group or booking reference). See `features/reservations.md`.

### Activities
- `activities` — A planned activity or experience within a trip.

### Expenses
- `trip_budget_items` — Planned costs defined by the organizer (required or optional). Feed into the budget estimate. Linked to actual expense records when paid. See `features/expenses.md`.
- `trip_budget_item_optins` — Per-participant opt-in records for optional budget items. Carries the sharing group composition, paid status, and link to the resulting expense. See `features/expenses.md`.
- `expenses` — Actual ledger entries. Ownership is `SHARED` (split among participants, generates debt) or `INDIVIDUAL` (personal spend, no debt — recorded for group reference). See `features/expenses.md`.
- `expense_payers` — Who paid and how much for each expense. Supports multiple payers per expense. See `features/expenses.md`.
- `expense_splits` — Per-participant debt share for `SHARED` expenses. Supports `EQUAL`, `EXACT`, `PERCENTAGE`, and `SHARES` split types. See `features/expenses.md`.
- `expense_settlements` — Minimal debt transfers proposed at trip completion (Splitwise-style). Confirmed manually by payees. See `features/expenses.md`.

### Gamification & Feedback
- `trip_feedback` — Post-trip structured feedback from participants directed at organizers (scores + optional comment). See `features/gamification.md`.
- `peer_feedback` — Short optional note from one trip participant to another after trip completion. See `features/gamification.md`.

### Events
- `events` — Standalone, group-linked, or trip-linked gatherings. See `features/events.md`.
- `event_attendees` — RSVP records per event per user. See `features/events.md`.

---

## JSONB Usage Examples

| Table | JSONB Column | Contents |
|---|---|---|
| `trips` | `confirmation_rules` | Custom rules the organizer sets for confirming attendance |
| `trips` | `settings` | Trip-level preferences (visibility, notification preferences, etc.) |
| `movements` | `metadata` | Carrier, flight number, seat info, booking reference |
| `stays` | `metadata` | Check-in instructions, contact info, amenities |
| `activities` | `details` | Custom fields specific to the activity type |
| `users` | `preferences` | App-level user preferences (language, currency, notification settings) |

---

## Naming Conventions

- Table names: `snake_case`, plural (e.g., `trip_participants`, `expense_splits`).
- Column names: `snake_case` (e.g., `created_at`, `trip_id`).
- Primary keys: `id` of type UUID (v4).
- Foreign keys: `{referenced_table_singular}_id` (e.g., `trip_id`, `user_id`).
- Enum columns: stored as `VARCHAR` with application-level validation via TypeScript enums.

---

## Indexes

To be defined per table as schemas are detailed. General rules:

- All foreign key columns get an index.
- Columns used in frequent `WHERE` or `ORDER BY` clauses get indexes.
- JSONB columns that are queried frequently use GIN indexes.
