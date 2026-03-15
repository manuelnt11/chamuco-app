# Feature: Participants & Invitations

**Status:** Design Phase
**Last Updated:** 2026-03-14

---

## Overview

The participants system manages who is invited to a trip, how they confirm their attendance, and what role they hold. The organizer has full control over invitation rules and can invite individuals or entire groups.

---

## Invitation Sources

Invitations can be sent to:

1. **Individual users** — A registered Chamuco App user is invited directly.
2. **Groups** — A previously created user group is invited. All group members receive the invitation and confirm individually.
3. **External invites** — An invitation link or email is sent to someone not yet registered. They must create an account (or sign in via Google SSO) to accept. *(Feature availability TBD)*

---

## Attendance Confirmation Rules

The organizer defines the rules that determine when a participant's attendance is considered **confirmed**. These rules are stored as a JSONB object on the trip record.

Possible rule types (to be refined):

| Rule | Description |
|---|---|
| `MANUAL_APPROVAL` | The organizer manually approves each participant's confirmation. |
| `AUTO_ACCEPT` | Any invited user is automatically confirmed. |
| `DEADLINE` | Participants must confirm before a specific date/time. |
| `DEPOSIT_REQUIRED` | Attendance is only confirmed after the participant pays a deposit. *(Requires payment integration — future feature)* |
| `CAPACITY_LIMIT` | Only the first N confirmations are accepted; the rest are waitlisted. |

Multiple rules can be combined (e.g., auto-accept with a deadline and a capacity limit).

---

## Participant States

```
INVITED → CONFIRMED
        ↓
      DECLINED
        ↓
   WAITLISTED (if capacity limit reached)
```

| State | Description |
|---|---|
| `INVITED` | The invitation has been sent. Participant has not yet responded. |
| `CONFIRMED` | Attendance is confirmed according to the active rules. |
| `DECLINED` | The participant declined the invitation. |
| `WAITLISTED` | The participant accepted but is waiting due to capacity limits. |
| `REMOVED` | The organizer removed the participant from the trip. |

---

## Participant Record (`trip_participants`)

Core fields linking a user to a trip:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | Parent trip |
| `user_id` | UUID | The participant's account |
| `status` | Enum `ParticipantStatus` | Current state (see above) |
| `role` | Enum `TripRole` | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT` |
| `display_name` | String | Optional per-trip nickname (e.g., "Javi", "Vivi"). Defaults to account name. Used throughout the trip's UI for brevity. |
| `invited_at` | Timestamp | |
| `responded_at` | Timestamp | When they confirmed or declined |
| `confirmed_at` | Timestamp | When confirmation was finalized (may differ from `responded_at` if manual approval is involved) |
| `invited_by` | UUID | Which user sent the invitation |
| `organizer_notes` | Text | Internal organizer notes about the participant (not visible to the participant) |

---

## Travel Profile (per trip)

Each confirmed participant can optionally fill in travel document data in the context of a specific trip. This data is **trip-scoped** (not global to the account) to reflect that different trips may use different documents or require different information.

This data is sensitive and visibility is strictly controlled — only the participant themselves and organizers can access it.

### `trip_participant_travel_profile`

| Field | Type | Description |
|---|---|---|
| `participant_id` | UUID | |
| `trip_id` | UUID | |
| `first_name` | String | Legal first name (as on travel document) |
| `last_name` | String | Legal last name |
| `email` | String | Contact email for trip communications |
| `phone_number` | String | Mobile number (international format) |
| `date_of_birth` | Date | |
| `national_id_number` | String | National ID / Cédula / DNI |
| `passport_number` | String | |
| `passport_expiry_date` | Date | Alerts participant if passport expires before the trip end date |
| `nationality` | String | ISO 3166-1 alpha-2 country code |
| `loyalty_program_id` | String | Frequent flyer or loyalty program account number (e.g., LifeMiles, Avianca) |
| `loyalty_program_name` | String | Name of the program (e.g., "LifeMiles", "Miles & More") |
| `emergency_contact_name` | String | |
| `emergency_contact_phone` | String | |

### Passport Expiry Warning

If `passport_expiry_date` is set and is within 6 months of the trip's departure date (or before the trip end date), the participant receives a `DOCUMENTS` pre-trip task automatically flagging the issue.

---

## Guest Participants (Non-registered Travelers)

A confirmed participant may bring additional travelers who do not have a Chamuco account (e.g., children, elderly relatives, non-tech-savvy companions). These are modeled as **guest records** linked to the sponsoring participant.

### `trip_guests`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | |
| `sponsored_by` | UUID | The `trip_participant` responsible for this guest |
| `display_name` | String | Guest's name or alias |
| `relationship` | String | Optional (e.g., "daughter", "parent") |
| `travel_profile` | JSONB | Optional travel document data (same fields as `trip_participant_travel_profile`) |

Guests are counted in `participant_count` for expense splits but cannot log in or interact with the app independently.

---

## Group Invitations

When a group is invited:
- A single invitation event is created referencing the group.
- Individual `trip_participant` records are generated for each group member at the time of invitation.
- Members added to the group **after** the invitation is sent do **not** automatically receive it. *(Behavior to confirm.)*

---

## Notifications

Key notification triggers:

| Trigger | Recipient |
|---|---|
| Invitation sent | Invited user |
| Invitation reminder | Invited user (if deadline set and no response) |
| Confirmation approved / rejected | Participant (if manual approval) |
| Moved from waitlist to confirmed | Participant |
| Removed from trip | Participant |
| Passport expiry warning | Participant |

---

## Open Questions / To Be Defined

- Can a participant re-invite themselves after declining?
- Can the organizer reinstate a declined or removed participant?
- Should there be a distinction between a "viewer" (read-only access to the trip) and a full participant?
- Should `display_name` / nickname be editable by the participant or only by the organizer?
- Can a participant have multiple loyalty program IDs, or just one per trip profile?
- Can a trip have a minimum participant count before it transitions from `DRAFT` to `OPEN`?
