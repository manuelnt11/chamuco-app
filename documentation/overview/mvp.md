# Chamuco Travel — MVP Scope

**Status:** Active — in development
**Last Updated:** 2026-06-02

---

## Purpose

This document defines the scope of the **Minimum Viable Product (MVP)** of Chamuco Travel. The MVP is the first shippable version of the platform — complete enough to deliver real value to a group of travelers, but deliberately scoped to avoid building features whose design is not yet validated.

The MVP is not a demo. It is a functional product that a real group can use to plan and complete a real trip together.

---

## Build Status Legend

Each module header shows its current implementation state:

| Marker         | Meaning                                                    |
| -------------- | ---------------------------------------------------------- |
| ✅ Built       | Backend + frontend implemented and merged to `main`        |
| 🔄 Partial     | Core functionality built; specific sub-features still open |
| ⏳ Not started | Designed and tracked in GitHub Issues; work not yet begun  |

The ✅/🔄/⏳ markers reflect implementation status, not MVP scope. All modules in this document are in scope for MVP unless explicitly listed under [Out of Scope](#out-of-scope-for-mvp).

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

### 🔄 Users & Personal Profile

Core user record and travel documents are built. Health data, emergency contacts, and loyalty programs are designed but not yet implemented.

**Built:**

- Core user record (`users`): username, display name, avatar, auth provider, timezone
- Personal profile (`user_profiles`): legal name, date of birth (JSONB with year visibility flag), birth/home country (char(2)) and city, phone, bio
- Nationalities & travel documents (`user_nationalities`): multiple nationalities, national ID, passport number, issue date, expiry date, pre-computed `PassportStatus`
- Visas (`user_visas`): per-citizenship visa records with coverage type, visa type, entries, expiry, pre-computed `VisaStatus`
- ETAs (`user_etas`): electronic travel authorizations tied to a specific passport number
- User preferences (`user_preferences`): language, currency, theme
- Profile visibility controls (`ProfileVisibility`)
- Daily passport status job (`PassportStatusJob`) — transitions `ACTIVE` → `EXPIRING_SOON` → `EXPIRED`, sends FCM notifications
- Public profile view (`/profile/:username`)
- Account deletion flow

**Not yet started:**

- Structured health data — `user_phobias`, `user_physical_limitations`, `user_food_allergies`, `user_medical_conditions` (dedicated tables per type, not JSONB; each includes an `OTHER` + `description` option)
- Emergency contacts (`user_emergency_contacts`) — at least one mandatory
- Loyalty programs (`user_loyalty_programs`) — reference data only

**Reference:** [`features/users.md`](../features/users.md)

---

### 🔄 Traveler Groups

Core group functionality and announcements are built. Member tiers and group resources are still open.

**Built:**

- Group CRUD: name, description, cover (image or emoji), visibility (PUBLIC/PRIVATE — required at creation), soft-delete
- Privacy enforcement: PUBLIC → PRIVATE restrictions (cannot remove members from an already-public group)
- Group membership: roles (`ADMIN`, `MEMBER`), join requests and invitations, bulk invite by user autocomplete
- Group discovery and search (`/explore/groups`)
- Group announcements: admins send one-way broadcast (rich text), read-only feed for members, FCM push delivery
- Group settings page (edit, delete)

**Not yet started:**

- Group member tiers (`NEWCOMER` → `NOVICE` → `EXPLORER` → `VETERAN`) — schema exists (`group_member_stats`), display not built (Issue #245)
- Group resources (notes, documents, links) — Issue #246
- Integration review & test coverage cleanup — Issue #248

> Real-time messaging (group channels and 1:1 DMs) is out of scope for MVP. Firestore is not needed until messaging is implemented.

**Reference:** [`features/community.md`](../features/community.md)

---

### ⏳ Trips (Simplified) — Issues #343–#354

The full trips module covers the complete lifecycle of a journey: creation, participant management, itinerary, expenses, reservations, pre-trip tasks, and post-trip gamification. For the MVP, a **simplified version** is shipped with the following scope:

**Core lifecycle** — All statuses are supported: `DRAFT`, `OPEN`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Roles (ORGANIZER, CO_ORGANIZER, PARTICIPANT) and visibility (PUBLIC, PRIVATE) are fully implemented. Link-based invitation flow is handled by `invitation_tokens` (see `features/invitation-tokens.md`).

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

### ⏳ Gamification — Epic #10

Full implementation of the gamification module as designed. Depends on the Trips module completing first.

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

Push notification delivery via Firebase Cloud Messaging (FCM) integrated with a unified Service Worker (shared with PWA caching). In-app notification feed with per-channel opt-out preferences.

FCM is the only Firebase service used in MVP. Firestore is not required (messaging is post-MVP).

**Built:**

- FCM token registration/deregistration per device (`user_fcm_tokens`)
- In-app notification feed: create, list, mark-read (`notifications` + `notification_deliveries`)
- Per-channel opt-out preferences stored on `user_preferences`
- `notify()` dispatcher with pluggable channel strategies (PUSH implemented; EMAIL/SMS stubs)
- Transient messages: ephemeral FCM data messages for real-time UI signals (not persisted)
- Notification bell + panel in app header

**Active notification types:**

| Event                       | Trigger                      | Recipient                  | Status                            |
| --------------------------- | ---------------------------- | -------------------------- | --------------------------------- |
| Passport `EXPIRING_SOON`    | Daily job                    | User                       | ✅                                |
| Passport `EXPIRED`          | Daily job                    | User                       | ✅                                |
| Group invitation received   | Admin invites user           | Invited user               | ✅                                |
| Group join request accepted | Admin accepts request        | Requesting user            | ✅                                |
| Group announcement          | Admin sends broadcast        | All group members          | ✅                                |
| Trip invitation received    | Organizer invites user       | Invited user               | ✅                                |
| Trip status changed         | Organizer transitions status | All confirmed participants | ✅                                |
| Trip announcement           | Organizer sends broadcast    | All confirmed participants | ✅                                |
| Key date reminder           | Daily job, 24h before date   | All confirmed participants | ⏳ Pending trips module (Epic #9) |
| Achievement unlocked        | Trip completion flow         | User                       | ⏳ Pending gamification           |
| New recognition received    | Organizer/admin awards       | Recipient user             | ⏳ Pending gamification           |

**Announcements** are one-way broadcasts. An organizer or admin writes a short message that is delivered as a push notification to all recipients. There is no reply mechanism and no persistent chat thread — the notification is the message. Announcements are stored in PostgreSQL and displayed in a read-only feed within the group or trip detail screen.

**Reference:** [`infrastructure/cloud.md`](../infrastructure/cloud.md), [`features/notifications.md`](../features/notifications.md)

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

---

## Module Build Progress Summary

| Module          | Status         | Notes                                                                        |
| --------------- | -------------- | ---------------------------------------------------------------------------- |
| Authentication  | ✅ Built       | —                                                                            |
| Notifications   | ✅ Built       | Key-date reminders pending (Epic #9)                                         |
| Users & Profile | 🔄 Partial     | Health data, emergency contacts, loyalty programs not started                |
| Groups          | 🔄 Partial     | Member tiers (#245), resources (#246) pending                                |
| Trips           | ⏳ Not started | Issues #343–#354                                                             |
| Participants    | ⏳ Not started | Epic #7                                                                      |
| Gamification    | ⏳ Not started | Epic #10; depends on Trips                                                   |
| Scheduled jobs  | 🔄 Partial     | Passport job ✅; trip auto-complete ✅; key-date-reminders pending (Epic #9) |
