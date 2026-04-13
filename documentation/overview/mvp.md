# Chamuco Travel — MVP Scope

**Status:** Draft
**Last Updated:** 2026-03-25

---

## Purpose

This document defines the scope of the **Minimum Viable Product (MVP)** of Chamuco Travel. The MVP is the first shippable version of the platform — complete enough to deliver real value to a group of travelers, but deliberately scoped to avoid building features whose design is not yet validated.

The MVP is not a demo. It is a functional product that a real group can use to plan and complete a real trip together.

---

## MVP Modules

### ✅ Authentication

Full implementation of the authentication layer as designed.

- Google Sign-In via Firebase Authentication
- Facebook Sign-In via Firebase Authentication
- Username selection at first login
- `display_name` pre-filled from OAuth provider, editable during onboarding
- Firebase ID token verification on the NestJS backend (`admin.auth().verifyIdToken()`)
- No custom JWT system

**Reference:** [`infrastructure/auth.md`](../infrastructure/auth.md)

---

### ✅ Users & Personal Profile

Full implementation of the user profile module as designed.

- Core user record (`users`): username, display name, avatar, auth provider, timezone
- Personal profile (`user_profiles`): legal name, date of birth (JSONB with year visibility flag), birth/home country (char(2)) and city, phone, bio; plus health data (dietary preference, food allergies, phobias, physical limitations, medical conditions), emergency contacts, and loyalty programs — all stored as typed columns or JSONB arrays on the same table
- Nationalities & travel documents (`user_nationalities`): multiple nationalities, national ID, passport number, issue date, expiry date, pre-computed `PassportStatus`, daily job for status updates and expiry notifications
- User preferences (`user_preferences`): language, currency, theme
- Profile visibility controls (`ProfileVisibility`)

**Reference:** [`features/users.md`](../features/users.md)

---

### ✅ Traveler Groups

Full implementation of the groups module as designed, **excluding messaging**.

- Group creation with name, description, cover (image or emoji), and visibility (PUBLIC or PRIVATE — required at creation)
- Group membership: roles (`OWNER`, `ADMIN`, `MEMBER`), join requests and invitations
- Group member tiers (`NEWCOMER` → `NOVICE` → `EXPLORER` → `VETERAN`) computed from shared completed trips
- Group resources (notes, documents, links)
- Group announcements: admins can send a one-way broadcast notification to all group members (see Notifications)

> Real-time messaging (group channels and 1:1 DMs) is out of scope for MVP. The Firestore dependency is therefore deferred — it is not needed until messaging is implemented.

**Reference:** [`features/community.md`](../features/community.md)

---

### ✅ Trips (Simplified)

The full trips module covers the complete lifecycle of a journey: creation, participant management, itinerary, expenses, reservations, pre-trip tasks, and post-trip gamification. For the MVP, a **simplified version** is shipped with the following scope:

**Core lifecycle** — All statuses are supported: `DRAFT`, `OPEN`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Roles (ORGANIZER, CO_ORGANIZER, PARTICIPANT) and visibility (PUBLIC, LINK_ONLY, PRIVATE) are fully implemented.

**Departure & return locations** — Every trip declares a `departure_country` + `departure_city` and an optional `return_country` + `return_city` (null = same as departure). These define the trip route for distance calculation.

**Ordered destinations** (`trip_destinations`) — At least one destination required. Ordered by `position`. Used in route computation for LP distance: departure → destinations (in order) → return.

**Free-text itinerary** — The full structured itinerary builder is post-MVP. In MVP, a single `itinerary_notes` text field on the `trips` record replaces it.

**Budget items** (`trip_budget_items`) — A simple named list of cost items (name, description, amount, currency). Not linked to participants or expense splits. Currency defaults to the trip's `base_currency`.

**Notes** (`trip_notes`) — A collaborative list of notes any confirmed participant or organizer can add.

**Key dates** (`trip_key_dates`) — A list of important dates (deadline, milestone, payment date) with a description and an optional reminder flag. When `reminder_enabled = true`, a FCM push notification is sent to all confirmed participants 24 hours before the date.

**Announcements** — Organizers can send one-way broadcast announcements to all confirmed participants via FCM (see Notifications section).

**Gamification** — Full post-trip completion flow is included: stats, achievements, Chamuco Points, feedback window, and recognition window. Distance is computed from the trip route (departure → destinations → return). Countries visited are derived from `trip_destinations` + return location.

**Out of scope for MVP (trips):**

- Structured itinerary builder (items, categories, subtypes)
- Expense tracking (`expenses`, `expense_payers`, splits, settlement)
- Reservations
- Pre-trip tasks
- Budget estimate computation and `budget_visibility`
- Trip resources (NOTE/DOCUMENT/LINK)
- Activity sequence view

**Reference:** [`features/trips.md`](../features/trips.md), [`features/participants.md`](../features/participants.md)

---

### ✅ Gamification

Full implementation of the gamification module as designed.

- Player level system (1–50, 5 named tiers: Nómada → Leyenda)
- Level Points (LP) earned from trips using the multi-factor formula (base + duration + distance + international + participants + organizer bonus)
- Achievements (auto-triggered badges at defined milestones)
- Traveler Score and global ranking
- Personal statistics (`user_stats`): trips, countries, km, companions, organizer count, longest trip
- Travel Frequency Index (TFI): computed on-the-fly from the last 365 days
- Chamuco Points (CP): earned and spendable on cosmetic profile customizations
- Discovery Map: geographic visualization of visited places
- Recognitions: peer-awarded badges at trip completion, annual group award, event award
- Trip feedback: structured post-trip evaluation (7-day window)
- Trip completion flow: atomic sequence updating stats, achievements, LP, level, CP, feedback window, and recognition window

> Note: gamification outputs depend heavily on the trip module scope. If the simplified trips module does not include an itinerary, inputs such as `km_traveled`, `countries_visited`, and `distance_from_home` (used for LP distance tier) will need to be either declared manually by the organizer or deferred to post-MVP.

**Reference:** [`features/gamification.md`](../features/gamification.md)

---

### ✅ Notifications

Push notification delivery via Firebase Cloud Messaging (FCM) integrated with a unified Service Worker (shared with PWA caching).

FCM is the only Firebase service used in MVP. Firestore is not required (messaging is post-MVP).

**MVP notification events:**

| Event                                            | Trigger                                                   | Recipient                              |
| ------------------------------------------------ | --------------------------------------------------------- | -------------------------------------- |
| Trip invitation received                         | Organizer invites user                                    | Invited user                           |
| Join request accepted / declined                 | Organizer acts on request                                 | Requesting user                        |
| Trip status changed (`IN_PROGRESS`, `COMPLETED`) | Organizer transitions status                              | All confirmed participants             |
| Feedback window opened                           | Trip reaches `COMPLETED`                                  | All confirmed participants             |
| Passport `EXPIRING_SOON`                         | Daily job                                                 | User who owns the record               |
| Passport `EXPIRED`                               | Daily job                                                 | User who owns the record               |
| Level-up                                         | Trip completion flow                                      | User                                   |
| Achievement unlocked                             | Trip completion flow                                      | User                                   |
| New recognition received                         | Organizer or admin awards recognition                     | Recipient user                         |
| Key date reminder                                | 24 hours before a key date with `reminder_enabled = true` | All confirmed participants of the trip |
| Trip announcement                                | Organizer sends broadcast                                 | All confirmed participants of the trip |
| Group announcement                               | Group admin sends broadcast                               | All members of the group               |

**Announcements** are one-way broadcasts. An organizer or admin writes a short message that is delivered as a push notification to all recipients. There is no reply mechanism and no persistent chat thread — the notification is the message. Announcements are stored in PostgreSQL for an audit trail and displayed in a simple read-only feed within the trip or group detail screen.

**Reference:** [`infrastructure/cloud.md`](../infrastructure/cloud.md)

---

## Out of Scope for MVP

The following modules are designed and documented but will not be built in the MVP:

| Module              | Notes                                                                | Reference                                                           |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Real-time messaging | Group channels, DMs, Firestore integration — deferred until post-MVP | [`features/community.md`](../features/community.md)                 |
| Agencies            | —                                                                    | [`features/agencies.md`](../features/agencies.md)                   |
| Reservations        | —                                                                    | [`features/reservations.md`](../features/reservations.md)           |
| Pre-trip planning   | Tasks, route planning, budget envelopes                              | [`features/pre-trip-planning.md`](../features/pre-trip-planning.md) |
| Events system       | —                                                                    | [`features/events.md`](../features/events.md)                       |
| Calendar views      | —                                                                    | [`features/calendar.md`](../features/calendar.md)                   |

---

## Open Questions

- Is there a target user count or pilot group for the MVP launch?
- Should past trips (pre-Chamuco travel history) be supported in MVP? If so, which entry path: full retroactive trip creation, lightweight history entry, or a streamlined past-trip flow?
