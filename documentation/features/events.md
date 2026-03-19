# Feature: Events

**Status:** Design Phase
**Last Updated:** 2026-03-19

---

## Overview

**Events** are a first-class entity in Chamuco App. They allow users to organize gatherings that may or may not be tied to a specific trip or group — from pre-trip planning sessions to post-trip celebrations and annual award ceremonies.

Events are a natural extension of the group-travel identity of the platform: groups that travel together also gather between trips, share memories, plan future adventures, and celebrate their community. Events provide a structured space for all of that.

---

## Event Modes

Every event exists in one of three modes, determined at creation and immutable:

| Mode | Description |
|---|---|
| `FREE` | Standalone event. Not linked to any group or trip. Accessible to any invited user. |
| `GROUP` | Linked to a specific group. Visible and joinable by group members. Organized by a group member (any role). |
| `TRIP` | Linked to a specific trip. Accessible to trip participants. Useful for pre-departure planning meetings or post-trip celebrations. |

A `TRIP` event inherits the trip's participant list as the default invitee base, but attendance is always opt-in (no one is automatically confirmed). A `GROUP` event notifies all active group members, but again, attendance is opt-in.

---

## Event Categories

| Category | Description |
|---|---|
| `PRESENTATION` | Sharing photos, stories, or experiences (e.g., post-trip slideshow, destination pitch). |
| `PLANNING` | Organizing logistics for an upcoming trip (route selection, task assignment, budget review). |
| `CELEBRATION` | Social gathering with no formal agenda (trip birthday, group anniversary, farewell). |
| `AWARDS` | Formal recognition ceremony — awarding recognitions, announcing winners of group rankings, presenting group stats. Typically scheduled annually for groups. |
| `OTHER` | Catch-all for events that do not fit the above. |

---

## Event Record (`events`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `title` | String | Display name of the event |
| `description` | Text (optional) | Rich text description of the agenda or purpose |
| `mode` | Enum `EventMode` | `FREE`, `GROUP`, `TRIP` |
| `category` | Enum `EventCategory` | See above |
| `organizer_user_id` | UUID | FK → `users.id` — who created and manages the event |
| `linked_group_id` | UUID (nullable) | FK → `groups.id` — set for `GROUP` mode |
| `linked_trip_id` | UUID (nullable) | FK → `trips.id` — set for `TRIP` mode |
| `starts_at` | Timestamp (with timezone) | Start date and time |
| `ends_at` | Timestamp (with timezone) | End date and time (must be ≥ `starts_at`) |
| `location` | String (optional) | Physical address or venue name |
| `is_virtual` | Boolean | True if held online; if true, `meeting_url` may be set |
| `meeting_url` | String (optional) | Link for online attendance (Zoom, Meet, etc.) |
| `awards_recognitions` | Boolean | Whether the organizer intends to award recognitions at this event |
| `awards_points` | Boolean | Whether the event will distribute Chamuco Points to attendees |
| `points_amount` | Integer (nullable) | Points awarded per attendee if `awards_points` is true |
| `status` | Enum `EventStatus` | See below |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |

### Event Status (enum: `EventStatus`)

| Value | Description |
|---|---|
| `DRAFT` | Created but not yet published. Only visible to the organizer. |
| `PUBLISHED` | Visible to the target audience (group members, trip participants, or directly invited users). RSVPs are open. |
| `IN_PROGRESS` | Event is currently happening (start time has passed). |
| `COMPLETED` | Event has ended. Recognitions and points (if applicable) may now be distributed. |
| `CANCELLED` | Event was cancelled by the organizer. All attendees are notified. |

---

## Attendees & RSVP

### Event Attendee Record (`event_attendees`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `event_id` | UUID | FK → `events.id` |
| `user_id` | UUID | FK → `users.id` |
| `rsvp` | Enum `EventRsvp` | `CONFIRMED`, `TENTATIVE`, `DECLINED` |
| `responded_at` | Timestamp | |
| `invited_by` | UUID (nullable) | FK → `users.id` — who explicitly invited this user (null if self-joined via group/trip) |

### RSVP Flow

- For `GROUP` events: all active group members receive a notification and can RSVP. Any group member may also invite external users (users not in the group) — in that case, `invited_by` is set.
- For `TRIP` events: all confirmed trip participants receive a notification. RSVP is optional.
- For `FREE` events: only explicitly invited users see the event. The organizer adds invitees by `@username`.
- An RSVP can be changed at any time before the event reaches `IN_PROGRESS`.

---

## Capacity

Events may optionally define a maximum attendee capacity. If set:
- Once `CONFIRMED` count reaches the capacity, new RSVPs default to `TENTATIVE` and the organizer is notified.
- The organizer may increase capacity or manually promote `TENTATIVE` attendees to `CONFIRMED`.
- Capacity is stored as `max_attendees: Integer (nullable)` on the `events` record.

---

## Gamification Integration

Events connect to the gamification system in two optional ways, controlled by the event organizer at creation time:

### 1. Chamuco Points Award

If `awards_points` is true and `points_amount` is set, the NestJS backend creates a `chamuco_point_transactions` record (reason: `EVENT_AWARD`) for each `CONFIRMED` attendee when the event transitions to `COMPLETED`. `TENTATIVE` and `DECLINED` attendees do not receive points.

### 2. Recognitions Award

If `awards_recognitions` is true, when the event reaches `COMPLETED` status the organizer enters a recognition window (configurable, default 7 days). During this window, the organizer can award named recognitions to any attendee. Recognitions created in this context have `source: EVENT` and `event_id` set. See `gamification.md` for the full recognition schema.

---

## Event Completion Flow

When an event transitions to `COMPLETED` (automatically at `ends_at` or manually by the organizer):

1. All `CONFIRMED` attendees receive a completion notification.
2. If `awards_points` is true: Chamuco Points are distributed to all `CONFIRMED` attendees.
3. If `awards_recognitions` is true: the organizer receives a prompt to open the recognition award flow.
4. The event record becomes read-only (no further RSVP changes accepted).

---

## Notifications

| Trigger | Recipients | Content |
|---|---|---|
| Event published (`GROUP` mode) | All active group members | "New event: {title} — RSVP now" |
| Event published (`TRIP` mode) | All confirmed trip participants | "New event for your trip: {title}" |
| Event published (`FREE` mode) | All explicitly invited users | "{organizer} invited you to: {title}" |
| RSVP received | Event organizer | "{user} confirmed / declined attendance" |
| 24h before start | All `CONFIRMED` and `TENTATIVE` attendees | "Reminder: {title} starts tomorrow" |
| Event completed | All `CONFIRMED` attendees | "Event completed — {title}" |
| Event cancelled | All attendees with any RSVP | "Event cancelled: {title}" |

All notification strings reference i18n keys with interpolated values. No hardcoded user-facing strings.

---

## Open Questions / To Be Defined

- Can a `GROUP` event be made visible to users outside the group (public event)?
- Should there be a waitlist mechanism for capacity-limited events (similar to trip participants)?
- Can events have sub-events or agenda items (structured schedule within the event)?
- Should events have a dedicated chat channel (similar to trip auto-channels)?
- Can the organizer set a registration deadline separate from the event start time?
- Are events discoverable on a public calendar/feed, or always invitation/group-gated?
- Should recurring events be supported (e.g., "Annual Awards" repeating every December)?
