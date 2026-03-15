# Feature: Participants & Invitations

**Status:** Design Phase
**Last Updated:** 2026-03-14

---

## Overview

The participants system manages who belongs to a trip, how they join, and what role they hold. The join flow depends on the trip's visibility setting: **public trips** allow anyone to request membership, while **private trips** use an organizer-driven invitation flow. In both cases, only one active request or invitation per person may exist at a time.

---

## Trip Visibility & Membership Flow

Trip visibility controls **discoverability and self-request capability**. It does not restrict what organizers can do.

### Rules that apply regardless of visibility

- **An organizer (or co-organizer) can always send an invitation** to any user, whether the trip is public or private.
- Only one active request **or** invitation may exist per user per trip at any time. A new one cannot be initiated — by either side — until the current one is resolved (`CONFIRMED`, `REJECTED`, `DECLINED`, `REMOVED`, or `LEFT`).
- Changing a trip's visibility (public ↔ private) at any point **does not affect** any pending requests or invitations. They remain valid and follow their original flow to resolution.

### Public Trip

A public trip is discoverable. In addition to organizer-driven invitations, it enables **user-driven requests**:

1. Any registered user can find the trip and submit a **join request** — provided they have no active request or invitation on the same trip.
2. An organizer reviews the request and **accepts** or **rejects** it.
3. After rejection the user may submit a new request.

### Private Trip

A private trip is not discoverable. Users cannot find it or self-request. The only entry path is an organizer invitation:

1. An organizer sends an **invitation** to a specific user (or group).
2. The user **accepts** or **declines**.
3. After a decline the organizer may re-invite the same user.

### Summary

| Flow | Who can initiate | Who decides | Condition |
|---|---|---|---|
| Organizer invitation | Organizer / Co-organizer | Invited user (accept / decline) | Any visibility — always available |
| User join request | Any registered user | Organizer (accept / reject) | Public trips only |

In both flows: only one active request or invitation per user per trip at a time.

---

## Participant States (enum: `ParticipantStatus`)

The unified state machine covers both flows:

```
── Public trip ──────────────────────────────────────────────────
  [User requests join]
       ↓
  PENDING_REQUEST  →  CONFIRMED  (organizer accepts)
                   →  REJECTED   (organizer rejects → user may request again)

── Private trip ─────────────────────────────────────────────────
  [Organizer sends invitation]
       ↓
  INVITED  →  CONFIRMED  (user accepts)
           →  DECLINED   (user declines → organizer may re-invite)

── Either flow ──────────────────────────────────────────────────
  CONFIRMED  →  REMOVED   (organizer removes participant)
             →  LEFT      (participant voluntarily leaves)
```

| Value | Description |
|---|---|
| `PENDING_REQUEST` | User has submitted a join request on a public trip. Awaiting organizer decision. |
| `INVITED` | Organizer has sent an invitation on a private trip. Awaiting user decision. |
| `CONFIRMED` | Membership is active. The participant is part of the trip. |
| `REJECTED` | Organizer rejected the join request. User may submit a new one. |
| `DECLINED` | User declined the invitation. Organizer may re-invite. |
| `REMOVED` | Organizer removed the participant from the trip. |
| `LEFT` | Participant voluntarily left the trip. |
| `WAITLISTED` | Accepted but on hold due to capacity limit. Promoted automatically when space opens. |

### One Active Request / Invitation at a Time

- A user may not submit a new join request while they have a `PENDING_REQUEST` on the same trip.
- An organizer may not send a new invitation to a user while that user has an `INVITED` status on the same trip.
- Once a request or invitation reaches a terminal state (`CONFIRMED`, `REJECTED`, `DECLINED`, `REMOVED`, `LEFT`), a new one may be initiated.

---

## Participant Record (`trip_participants`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | Parent trip |
| `user_id` | UUID | The participant's account |
| `status` | Enum `ParticipantStatus` | Current state (see above) |
| `role` | Enum `TripRole` | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT` |
| `display_name` | String | Optional per-trip nickname. Defaults to account display name. |
| `join_flow` | Enum `JoinFlow` | `REQUEST` (public) or `INVITATION` (private). Records how this participant entered. |
| `initiated_at` | Timestamp | When the request or invitation was created |
| `responded_at` | Timestamp | When the decision was made (accept / reject / decline) |
| `confirmed_at` | Timestamp | When `CONFIRMED` status was set (may differ from `responded_at` if capacity rules apply) |
| `initiated_by` | UUID | For `INVITATION`: the organizer who sent it. For `REQUEST`: the user themselves. |
| `decided_by` | UUID | Who made the accept/reject/decline decision |
| `organizer_notes` | Text | Internal organizer notes. Not visible to the participant. |

---

## Trip Roles (enum: `TripRole`)

| Value | Description |
|---|---|
| `ORGANIZER` | Full administrative control. Manages invitations, itinerary, expenses, settings. Does not need to be a traveling participant. |
| `CO_ORGANIZER` | Shares organizer-level permissions. Assigned by an organizer. |
| `PARTICIPANT` | A confirmed traveler with standard access. |

### Organizer Constraints

- A trip must always have **at least one organizer** with `CONFIRMED` status.
- An organizer cannot leave or be removed if they are the **last organizer**. They must first assign organizer or co-organizer rights to another confirmed participant.
- An organizer who is not traveling (not a participant themselves) may hold the `ORGANIZER` role without being counted as a traveler in expense splits or capacity limits.

---

## Group Invitations

When a **group** is invited to a private trip:
- A single invitation event is recorded referencing the group.
- Individual `trip_participant` records with status `INVITED` are created for each group member at the time of invitation.
- Members added to the group **after** the invitation is sent do not automatically receive it.
- Each group member responds individually — one member accepting does not affect others.

---

## Attendance Confirmation Rules

For trips where the organizer wants additional control beyond the basic accept/reject flow, confirmation rules can be layered on top:

| Rule | Description |
|---|---|
| `AUTO_ACCEPT` | Join requests or acceptances are confirmed immediately without organizer review. Applies to public trips only. |
| `MANUAL_APPROVAL` | Each request or acceptance requires explicit organizer approval before `CONFIRMED` is set. Default for public trips. |
| `DEADLINE` | Participants must accept or request by a specific date. After the deadline, open invitations and pending requests expire. |
| `CAPACITY_LIMIT` | Only the first N confirmations are accepted. Further requests/acceptances result in `WAITLISTED` status. |

Rules are stored as JSONB on the trip record and can be combined (e.g., `MANUAL_APPROVAL` + `DEADLINE` + `CAPACITY_LIMIT`).

---

## Travel Profile (per trip)

Each confirmed participant can optionally fill in travel document data scoped to the trip. This data is sensitive — visible only to the participant and organizers.

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
| `passport_expiry_date` | Date | Auto-triggers a `DOCUMENTS` pre-trip task if expiry is within 6 months of departure |
| `nationality` | String | ISO 3166-1 alpha-2 country code |
| `loyalty_program_id` | String | Frequent flyer / loyalty program account number |
| `loyalty_program_name` | String | Name of the program (e.g., "LifeMiles") |
| `emergency_contact_name` | String | |
| `emergency_contact_phone` | String | |

---

## Guest Participants

A confirmed participant may register additional non-registered travelers under their account (e.g., children, elderly relatives). These **guests** are linked to the sponsoring participant and counted in expense splits and capacity, but cannot interact with the app independently.

### `trip_guests`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | |
| `sponsored_by` | UUID | The `trip_participant` responsible for this guest |
| `display_name` | String | Guest's name or alias |
| `relationship` | String | Optional (e.g., "daughter", "parent") |
| `travel_profile` | JSONB | Optional travel document data (same fields as `trip_participant_travel_profile`) |

---

## Notifications

| Trigger | Recipient |
|---|---|
| Join request submitted (public trip) | Organizers |
| Invitation sent (private trip) | Invited user |
| Request accepted | User who requested |
| Request rejected | User who requested |
| Invitation accepted | Organizer |
| Invitation declined | Organizer |
| Moved from `WAITLISTED` to `CONFIRMED` | Participant |
| Participant removed | Removed participant |
| Passport expiry warning | Participant |

---

## Open Questions / To Be Defined

- Should `LEFT` be allowed at any trip status, or only before `IN_PROGRESS`?
- When a participant leaves or is removed, how are their existing expense splits handled?
- Can a `CO_ORGANIZER` send invitations and accept/reject requests, or only a full `ORGANIZER`?
- Can a trip have a minimum participant count that must be met before transitioning from `OPEN` to `CONFIRMED`?
- Should there be a "viewer" role — someone who can see the trip details without being a confirmed participant or traveler?
