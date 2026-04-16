# Feature: Calendar

**Status:** Design Phase
**Last Updated:** 2026-03-19

---

## Overview

The **Calendar** is a cross-cutting view that aggregates trips and events from across the user's entire context into a unified timeline. It is not a new entity — it queries existing `trips` and `events` data filtered to the user's memberships. Its purpose is to answer "what's coming up?" at a glance.

The calendar is personal to each user: it reflects only trips where the user is a confirmed participant or organizer, and events from groups the user belongs to or was explicitly invited to.

---

## Data Sources

| Source           | Included condition                                                            |
| ---------------- | ----------------------------------------------------------------------------- |
| Trips            | User is a `CONFIRMED` participant or `ORGANIZER` / `CO_ORGANIZER`             |
| Group trips      | Trip linked to a group the user belongs to, and user is confirmed on the trip |
| Events (`FREE`)  | User has been explicitly invited (any RSVP state)                             |
| Events (`GROUP`) | User is an active member of the linked group                                  |
| Events (`TRIP`)  | User is a confirmed participant on the linked trip                            |

Waitlisted participants (`WAITLISTED`) may optionally see the trip/event in the calendar as a "pending" item — separate from confirmed items.

---

## View Modes

### Monthly View

A standard calendar grid showing the current month by default, navigable backward and forward month by month.

- **Trips** render as multi-day spans from `start_date` to `end_date`. Color-coded by type (own trip vs. group trip).
- **Events** render as single-day chips on their `starts_at` date. If an event spans multiple days, it renders as a span.
- Days with items show a dot indicator in compact mode.
- Clicking a day expands to show all items for that day.
- Clicking a trip or event deep-links to its detail page.

### Upcoming Events View

A chronological list of all future and in-progress trips and events, sorted by start date ascending. This view is more useful as a quick glance from the home screen or dashboard.

- Shows the next 90 days by default, expandable.
- Each item shows: name, type badge (TRIP / EVENT), dates, and a status indicator (confirmed, in progress, RSVP pending).
- Items in the past are hidden by default (accessible via a "show past" toggle).

---

## Filters

Available in both views:

| Filter | Options                             |
| ------ | ----------------------------------- |
| Type   | All / Trips only / Events only      |
| Scope  | All / My own / Group-linked         |
| Status | All / Confirmed only / Pending RSVP |

---

## Color Coding

| Item                                                       | Color treatment                               |
| ---------------------------------------------------------- | --------------------------------------------- |
| Own trip (user is organizer or participant, not via group) | Primary color                                 |
| Group-linked trip                                          | Secondary color or group's avatar color (TBD) |
| Own-created event                                          | Primary color, lighter shade                  |
| Group event                                                | Secondary color, lighter shade                |
| In-progress item                                           | Accented / highlighted                        |
| RSVP pending                                               | Dashed border or reduced opacity              |

Exact color mapping depends on the chosen palette (see `design/visual-identity.md`).

---

## Trip Card (Upcoming View)

Each trip in the upcoming view shows a condensed card:

| Element                      | Source                                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| Trip name                    | `trips.name`                                                     |
| Date range                   | `trips.start_date` – `trips.end_date`                            |
| Status badge                 | `trips.status` (`OPEN`, `CONFIRMED`, `IN_PROGRESS`)              |
| Participant count            | Count of `CONFIRMED` participants                                |
| Budget estimate (if visible) | From `trips.budget_visibility` setting — see `features/trips.md` |
| Primary destination          | Derived from first or most prominent itinerary location          |

---

## Event Card (Upcoming View)

Each event shows:

| Element        | Source                                                     |
| -------------- | ---------------------------------------------------------- |
| Event title    | `events.title`                                             |
| Date/time      | `events.starts_at`                                         |
| Category badge | `events.category`                                          |
| RSVP state     | The user's current `event_attendees.rsvp`                  |
| Context        | "Group: {group name}" or "Trip: {trip name}" or standalone |

---

## Relationship to Other Features

The calendar does not introduce any new data models. All displayed data is owned by `features/trips.md`, `features/events.md`, and `features/participants.md`. The calendar is a **read-only projection**.

Backend implementation: a single `GET /v1/calendar` endpoint with `from` and `to` date range parameters returns a sorted union of the user's trips and events within that range.

---

## Open Questions / To Be Defined

- Should the calendar be accessible from the main navigation (dedicated tab) or embedded in the home screen?
- Should there be an iCal/Google Calendar export option?
- Should trip items show the full date range or just the start date in monthly grid mode?
- Should upcoming events from groups with pending RSVP show a visual prompt to respond?
- Is 90 days the right default window for the upcoming view, or should it be configurable?
