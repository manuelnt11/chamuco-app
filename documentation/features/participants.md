# Feature: Participants & Invitations

**Status:** Design Phase
**Last Updated:** 2026-03-19

---

## Overview

The participants system manages who belongs to a trip, how they join, and what role they hold. There are two entry paths into a trip: **join requests** (user-initiated) and **invitations** (organizer-initiated). Which path is available depends on trip visibility — specifically, whether the user can see the trip at all.

---

## Trip Visibility & Membership Flow

**Trip visibility controls discoverability only** — it determines who can find and view the trip. It does not restrict what organizers can do.

The rule is simple: **if a user can see the trip, they can submit a join request.** Organizers can always invite anyone regardless of visibility.

### Visibility Levels

| Visibility | Who can discover the trip | Join request available to |
|---|---|---|
| `PUBLIC` | Any registered user | Any registered user |
| `LINK_ONLY` | Anyone with the direct link | Anyone with the link |
| `PRIVATE` | Not publicly searchable. Visible only to members of groups the organizer has explicitly shared it with (see below). If no groups are defined, no one can find it. | Members of the trip's visible groups only |

### Private Trip — Visible Groups

A private trip may define a set of groups whose members can see it. This is stored in a separate `trip_visible_to_groups` table (see `architecture/database-design.md`). Any member of a listed group can:
- See the trip in the group's context.
- Submit a join request.

If the organizer defines no visible groups, the trip is invisible to everyone except direct invitees — all participants must be invited.

### Rules that apply regardless of visibility

- **An organizer (or co-organizer with `MANAGE_PARTICIPANTS`) can always send an invitation** to any user, regardless of trip visibility.
- Only one active request **or** invitation may exist per user per trip at any time. A new one cannot be initiated until the current one reaches a terminal state (`CONFIRMED`, `REJECTED`, `DECLINED`, `REMOVED`, or `LEFT`).
- Changing a trip's visibility does not affect any pending requests or invitations in flight. They remain valid until resolved.

### Entry Path Summary

| Flow | Who initiates | Who decides | Who can cancel | Condition |
|---|---|---|---|---|
| Join request | The user | Organizer (accept / reject) | The user (withdraw at any time) | User can see the trip |
| Organizer invitation | Organizer / authorized CO_ORGANIZER | The invited user (accept / decline) | The organizer (revoke at any time) | Always available |

---

## Participant States (enum: `ParticipantStatus`)

The unified state machine covers both flows:

```
── Join request (user-initiated) ────────────────────────────────
  [User submits request]
       ↓
  PENDING_REQUEST  →  CONFIRMED  (organizer accepts)
                   →  REJECTED   (organizer rejects → user may re-request, goes to back of queue)
                   →  [deleted]  (user withdraws request → slot freed, user may re-request)

── Invitation (organizer-initiated) ─────────────────────────────
  [Organizer sends invitation]
       ↓
  INVITED  →  CONFIRMED  (user accepts)
           →  DECLINED   (user declines → organizer may re-invite)
           →  [deleted]  (organizer revokes invitation → slot freed, organizer may re-invite)

── Either flow ──────────────────────────────────────────────────
  CONFIRMED  →  REMOVED   (organizer removes participant)
             →  LEFT      (participant voluntarily leaves)
```

| Value | Description |
|---|---|
| `PENDING_REQUEST` | User submitted a join request. Awaiting organizer decision. When capacity is full, this request is part of the request queue (ordered by `initiated_at`). |
| `INVITED` | Organizer sent an invitation. Awaiting user decision. |
| `CONFIRMED` | Membership is active. The participant is part of the trip. |
| `REJECTED` | Organizer rejected the join request. The user may submit a new one — the new request will have a later `initiated_at` and will go to the back of the queue. |
| `DECLINED` | User declined the invitation. Organizer may re-invite. |
| `REMOVED` | Organizer removed the participant from the trip. |
| `LEFT` | Participant voluntarily left the trip. |

### One Active Request / Invitation at a Time

- A user may not submit a new join request while they have a `PENDING_REQUEST` on the same trip.
- An organizer may not send a new invitation to a user while that user has an `INVITED` status on the same trip.
- Once a request or invitation reaches a terminal state (`CONFIRMED`, `REJECTED`, `DECLINED`, `REMOVED`, `LEFT`), a new one may be initiated.

### Withdrawal and Revocation

Requests and invitations can be cancelled at any time by whoever created them, before the other party responds:

- **Request withdrawal** — The user who submitted the `PENDING_REQUEST` can cancel it at any time. The record is deleted. The user has no active request and may submit a new one; the new `initiated_at` places them at the back of the queue.
- **Invitation revocation** — The organizer (or co-organizer with `MANAGE_PARTICIPANTS`) who sent the `INVITED` invitation can revoke it at any time. The record is deleted. The user has no active invitation and may be re-invited.

In both cases the deletion is permanent — no terminal status is set. Since neither party has made a commitment (no `CONFIRMED` state was ever reached), there is no audit trail requirement for the removed record.

---

## Participant Record (`trip_participants`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | Parent trip |
| `user_id` | UUID | The participant's account |
| `status` | Enum `ParticipantStatus` | Current state (see above) |
| `role` | Enum `TripRole` | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT` |
| `is_traveling_participant` | Boolean | Whether this person is physically traveling on the trip. Independent of `role`. Defaults to `true`. When `false`, the person is excluded from capacity counts, expense splits, and the per-person budget estimate. |
| `co_organizer_permissions` | `CoOrganizerPermission`[] (JSONB) | Set of capabilities granted to this co-organizer. Null for `ORGANIZER` and `PARTICIPANT` roles. Defined by the assigning organizer. |
| `display_name` | String | Optional per-trip nickname. Defaults to `users.display_name`. |
| `profile_confirmed_at` | Timestamp | When the participant last confirmed their personal profile is accurate for this trip. Null if never confirmed. Informational only — does not block participation. |
| `share_medical_notes` | Boolean | Whether the participant opts in to sharing their `medical_notes` from their health profile with the trip organizer. Defaults to `false`. |
| `did_travel` | Boolean (nullable) | `null` while the trip is active. Set at trip completion — defaults to `true` for all `CONFIRMED` participants unless the organizer explicitly marks someone as `false` (e.g., a participant who was confirmed but did not travel in the end). Participants with `did_travel = false` are excluded from expense splits and the post-trip settlement. |
| `join_flow` | Enum `JoinFlow` | `REQUEST`, `INVITATION`, or `ROLE_INVITATION`. Records how this participant entered. `ROLE_INVITATION` applies when the user was not yet a participant and was added via a role invitation that specified `will_travel = true`. |
| `initiated_at` | Timestamp | When the request or invitation was created. For requests, this is also the queue ordering key — earlier `initiated_at` = higher priority in the request queue. |
| `responded_at` | Timestamp | When the organizer or user made their decision |
| `confirmed_at` | Timestamp | When `CONFIRMED` status was set |
| `initiated_by` | UUID | For `INVITATION`: the organizer who sent it. For `REQUEST`: the user themselves. |
| `decided_by` | UUID | Who made the accept/reject/decline decision |
| `organizer_notes` | Text | Internal organizer notes. Not visible to the participant. |

---

## Trip Roles (enum: `TripRole`)

| Value | Description |
|---|---|
| `ORGANIZER` | Full administrative control over the trip. All permissions always granted. May or may not be a traveling participant — decided independently via `is_traveling_participant`. Multiple users may hold this role simultaneously. |
| `CO_ORGANIZER` | Delegated administrative helper. Permissions are explicitly defined by an assigning `ORGANIZER` via `co_organizer_permissions`. May or may not be a traveling participant — independent of the role. |
| `PARTICIPANT` | A confirmed traveler with standard access. No administrative capabilities. Always a traveling participant (`is_traveling_participant = true`). |

### Role vs. Participation — Independent Axes

The administrative role (`ORGANIZER` / `CO_ORGANIZER`) and physical participation in the trip (`is_traveling_participant`) are **two independent attributes**. Any combination is valid:

| Role | `is_traveling_participant` | Meaning |
|---|---|---|
| `ORGANIZER` | `true` | Organizes and travels on the trip |
| `ORGANIZER` | `false` | Organizes the trip but does not travel (e.g., a professional trip coordinator) |
| `CO_ORGANIZER` | `true` | Helps organize and also travels |
| `CO_ORGANIZER` | `false` | Helps organize remotely without traveling |
| `PARTICIPANT` | `true` | Travels. No organizational access. (`is_traveling_participant` is always `true` for this role.) |

Non-traveling organizers and co-organizers (`is_traveling_participant = false`) are:
- **Excluded** from capacity counts.
- **Excluded** from the per-person budget estimate denominator.
- **Excluded** from expense splits by default (may be manually added to specific expenses).
- **Included** in the trip's communication channel as admins.

### Organizer Constraints

- A trip must always have **at least one** user with `role = ORGANIZER` and `status = CONFIRMED`.
- The last remaining organizer cannot leave or be removed without first assigning the `ORGANIZER` role to another confirmed member.
- Multiple users may hold the `ORGANIZER` role simultaneously. Organizer rights are assigned by any existing organizer.
- A co-organizer may be promoted to full organizer by any existing organizer at any time.

---

## Co-Organizer Permissions

When an organizer assigns the `CO_ORGANIZER` role to a member, they define a custom set of capabilities from the `CoOrganizerPermission` enum. The assigning organizer can grant any combination — from a single permission to all of them. The `co_organizer_permissions` field on `trip_participants` stores this set as a JSONB array.

An `ORGANIZER` always has all permissions implicitly and is never subject to this enum.

### Permission Enum (`CoOrganizerPermission`)

| Value | Scope |
|---|---|
| `MANAGE_ITINERARY` | Create, edit, and delete itinerary items |
| `MANAGE_EXPENSES` | Record, edit, and delete expense records |
| `MANAGE_PARTICIPANTS` | Invite users, accept/reject join requests, remove participants, manage the waitlist |
| `MANAGE_RESERVATIONS` | Add and update reservation records |
| `EDIT_TRIP_DETAILS` | Edit trip name, description, dates, destination, visibility, and general settings |
| `MANAGE_PRE_TRIP_TASKS` | Add, edit, assign, and resolve pre-trip checklist tasks |
| `MODERATE_CHANNEL` | Pin messages, delete any message, and manage members in the trip's auto-channel |
| `VIEW_TRAVEL_PROFILES` | Access participants' documents, health data, and emergency contacts |
| `AWARD_RECOGNITIONS` | Award recognitions to participants during the post-trip recognition window |

### Assignment Rules

- **Permission management is exclusively an organizer action.** Only users with `role = ORGANIZER` may assign, modify, or revoke a co-organizer's permissions. A co-organizer has no authority over their own permission set or that of any other co-organizer.
- Permissions are set at the time the co-organizer role is assigned and can be updated at any time by any `ORGANIZER`.
- A co-organizer cannot assign the `ORGANIZER` role — only a full `ORGANIZER` can promote another member to organizer.
- Removing all permissions from a co-organizer is allowed but effectively reduces them to a supervised helper with no administrative capabilities; consider demoting them to `PARTICIPANT` instead.
- When a co-organizer is promoted to `ORGANIZER`, their `co_organizer_permissions` is cleared (all permissions are implicitly granted by the role).

---

## Role Invitations

Promoting a user to `ORGANIZER` or `CO_ORGANIZER` is done exclusively through a **role invitation** — a distinct flow from participant invitations, with its own rules and lifecycle.

### When the Invitee Is Already a Confirmed Participant

If the invitee already has `status = CONFIRMED` on the trip:

- The role invitation upgrades their `role` field on the existing `trip_participants` record. No new record is created.
- `is_traveling_participant` is always `true` — they are already a traveler. This is non-configurable: the organizer cannot set it to `false` via a role invitation.

### When the Invitee Is Not Yet a Trip Participant

If the invitee has no active or confirmed record on the trip, the organizer must declare `will_travel` at the time of creating the role invitation:

- **`will_travel = true`** — If the invitee accepts, a `trip_participants` record is created with `is_traveling_participant = true` and the specified role. **This path bypasses `WAITLIST_MODE`**: capacity queue ordering does not apply to direct role appointments.
- **`will_travel = false`** — The invitee joins as a non-traveling organizer or co-organizer. No capacity impact; no waitlist constraint.

### Role Downgrade

Removing a role downward (`ORGANIZER → CO_ORGANIZER`, `ORGANIZER → PARTICIPANT`, `CO_ORGANIZER → PARTICIPANT`) is a direct organizer action — **no invitation is required**. A role downgrade never changes `is_traveling_participant`. Travel status and role are always independent axes.

### Lifecycle

- A role invitation can be **revoked by the issuing organizer** at any time before the invitee responds. The record is deleted.
- The invitee can **accept or decline** the role invitation.
- If the invitee declines, the record is deleted. If they were not yet a participant, no `trip_participants` record is created.
- Like participant invitations, a role invitation can be created and deleted without a response — no terminal status is required.

### Conflict Resolution

Only one active invitation or request per user per trip at a time. If the invitee already has an active `PENDING_REQUEST` or `INVITED` (participant) record when the role invitation is created, that record is **deleted immediately**. The role invitation takes its place. The one-active-record rule is preserved.

### Role Invitation Record (`trip_role_invitations`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | The trip |
| `user_id` | UUID | The user being invited to the role |
| `invited_role` | Enum `TripRole` | `ORGANIZER` or `CO_ORGANIZER` only |
| `co_organizer_permissions` | `CoOrganizerPermission`[] JSONB | Required when `invited_role = CO_ORGANIZER`. Null for `ORGANIZER`. |
| `will_travel` | Boolean | Whether the invitee will travel. Always `true` — and non-configurable — when the invitee is already a confirmed participant. |
| `invited_by` | UUID | The organizer who created the invitation |
| `created_at` | Timestamp | When the invitation was sent |
| `responded_at` | Timestamp | When the invitee accepted or declined |

---

## Group Invitations

When a **group** is invited to a private trip:
- A single invitation event is recorded referencing the group.
- Individual `trip_participant` records with status `INVITED` are created for each group member at the time of invitation.
- Members added to the group **after** the invitation is sent do not automatically receive it.
- Each group member responds individually — one member accepting does not affect others.

---

## Attendance Confirmation Rules

Confirmation rules give the organizer additional control over how requests and invitations are processed. They are stored as JSONB on the trip record and can be combined.

| Rule | Description |
|---|---|
| `AUTO_ACCEPT` | Join requests are confirmed immediately without organizer review. Only meaningful for trips where the requesting user can see the trip (visibility permitting). |
| `MANUAL_APPROVAL` | Each request requires explicit organizer approval before `CONFIRMED` is set. Default behavior. |
| `DEADLINE` | Participants must accept (invitations) or request by a specific date. After the deadline, open invitations and pending requests expire. |
| `CAPACITY_LIMIT` | Sets a maximum number of confirmed traveling participants (non-traveling organizers excluded). Once full, the organizer cannot confirm additional requests until a spot opens. |
| `WAITLIST_MODE` | Only meaningful when `CAPACITY_LIMIT` is also set. When active, the organizer is **required to accept requests in chronological order** (by `initiated_at`). The organizer may reject any request at any time, but cannot skip a pending request to accept a later one. |

---

## Waitlist Mode

The "waitlist" is not a separate entity or status — it is a **view of `PENDING_REQUEST` records ordered by `initiated_at`**, combined with the `WAITLIST_MODE` confirmation rule.

When `CAPACITY_LIMIT` is full and `WAITLIST_MODE` is active:
- New join requests accumulate as `PENDING_REQUEST` entries.
- The organizer sees them in chronological order (oldest first).
- When a spot opens (a confirmed participant leaves or is removed, or capacity is increased), the organizer **must** confirm the oldest pending request in the queue. They cannot skip it to accept a newer one.
- The organizer **can** reject any request at any time. Rejecting a request removes the candidate from the queue; their slot moves to the next person.
- A rejected user may re-submit a request. The new request has a later `initiated_at` and goes to the back of the queue.

When `CAPACITY_LIMIT` is full but `WAITLIST_MODE` is **not** active:
- New requests accumulate as `PENDING_REQUEST`.
- The organizer may accept any pending request in any order when a spot opens (no ordering constraint).

### Role Invitations and the Queue

Role invitations with `will_travel = true` **always bypass `WAITLIST_MODE`**. A direct role appointment is not a general join request — it is an explicit organizer decision and is not subject to queue ordering constraints. See the Role Invitations section above.

### Participant Invitations and the Request Queue

Whether a regular organizer-sent participant invitation bypasses the request queue when `WAITLIST_MODE` is active remains an **open question**:
- **Invitations bypass the queue** — the organizer's invitation is an explicit choice that takes precedence over pending requests.
- **Invitations respect the queue** — sending an invitation while pending requests are waiting is not allowed when `WAITLIST_MODE` is active.

This is left as a pending decision until the feature is implemented.

---

## Travel Profile

A participant's travel-relevant personal data — documents, emergency contact, dietary needs, allergies, phobias, limitations — lives on the **user's personal profile** (`user_profiles` and `user_health_profiles`), not on the trip participant record. This is the single source of truth: the person's data exists once and is referenced by any trip they join, rather than duplicated per trip.

See [`features/users.md`](./users.md) for the full profile model.

### What the participant record adds

The `trip_participants` record carries two trip-specific fields related to the profile:

- **`profile_confirmed_at`** — timestamp of when the participant last confirmed their personal profile is accurate for this trip (e.g., passport still valid, emergency contact up to date). Informational only. The pre-trip task system handles hard blockers.
- **`share_medical_notes`** — opt-in flag for sharing the participant's `medical_notes` with the organizer for this specific trip. Defaults to `false`. Only the participant can toggle it.

### Passport expiry detection

The trigger for auto-creating a `DOCUMENTS` pre-trip task (passport expiry within 6 months of departure) is evaluated against the user's `passport_expiry_date` in `user_profiles` when they are confirmed as a participant. It is not stored per trip.

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
| `travel_profile` | JSONB | Optional personal data for the guest. Mirrors the fields in `user_profiles` and `user_health_profiles` (name, document numbers, dietary preference, allergies, emergency contact, etc.). JSONB is appropriate here because guests don't have system accounts. |

---

## Notifications

| Trigger | Recipient |
|---|---|
| Join request submitted | Organizers |
| Invitation sent | Invited user |
| Role invitation sent | Invited user |
| Request accepted | User who requested |
| Request rejected | User who requested |
| Invitation accepted | Organizer |
| Invitation declined | Organizer |
| Role invitation accepted | Organizer |
| Role invitation declined | Organizer |
| Participant removed | Removed participant |
| Passport expiry warning | Participant |

---

## Open Questions / To Be Defined

- Should `LEFT` be allowed at any trip status, or only before `IN_PROGRESS`?
- When a participant leaves or is removed, how are their existing expense splits handled?
- Can a trip have a minimum participant count that must be met before transitioning from `OPEN` to `CONFIRMED`?
- Should there be a "viewer" role — someone who can see the trip details without being a confirmed participant or traveler?
- Should regular participant invitations bypass the request queue when `WAITLIST_MODE` is active, or should sending an invitation while pending requests are waiting be blocked? (Note: role invitations with `will_travel = true` are resolved — they always bypass. This question concerns regular participant invitations only. See Waitlist Mode — Participant Invitations and the Request Queue.)
