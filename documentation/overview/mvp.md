# Chamuco Travel — MVP Scope

**Status:** Draft
**Last Updated:** 2026-03-23

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
- Personal profile (`user_profiles`): legal name, date of birth (JSONB with year visibility flag), birth country and city, home country and city, phone, bio
- Nationalities & travel documents (`user_nationalities`): multiple nationalities, national ID, passport number, issue date, expiry date, pre-computed `PassportStatus`, daily job for status updates and expiry notifications
- Emergency contacts (`user_emergency_contacts`): 1:many, at least one required
- Loyalty programs (`user_loyalty_programs`): reference data, user-only visibility
- Health profile: dietary preference and notes (`user_health_profiles`), food allergies (`user_food_allergies`), phobias (`user_phobias`), physical limitations (`user_physical_limitations`), medical conditions (`user_medical_conditions`)
- User preferences (`user_preferences`): language, currency, theme
- Profile visibility controls (`ProfileVisibility`)

**Reference:** [`features/users.md`](../features/users.md)

---

### ✅ Traveler Groups

Full implementation of the groups module as designed.

- Group creation with name, description, cover (image or emoji), and visibility (PUBLIC or PRIVATE — required at creation)
- Group membership: roles (`OWNER`, `ADMIN`, `MEMBER`), join requests and invitations
- Group auto-channel (PRIVATE messaging channel mirroring group membership)
- Direct messages (1:1) between users
- Group member tiers (`NEWCOMER` → `NOVICE` → `EXPLORER` → `VETERAN`) computed from shared completed trips
- Group resources (notes, documents, links)

**Reference:** [`features/community.md`](../features/community.md)

---

### 🔲 Trips (Simplified) — Scope Pending Definition

The full trips module covers the complete lifecycle of a journey: creation, participant management, itinerary, expenses, reservations, pre-trip tasks, and post-trip gamification flow. For the MVP, a **simplified version** of trips will be shipped.

The exact scope of the simplified trip module is **pending definition**. The following questions must be resolved before implementation begins:

- Which phases of the trip lifecycle are included? (DRAFT, OPEN, IN_PROGRESS, COMPLETED — or a subset?)
- Is the itinerary builder included in MVP, or is a trip just metadata + participants?
- Are expenses included in MVP?
- Are reservations included in MVP?
- Is the pre-trip task system included?
- What does the post-trip flow look like if the itinerary is simplified? (affects gamification inputs: distance, countries visited)
- Is the participant capacity system included in full, or simplified?

**Reference (full spec):** [`features/trips.md`](../features/trips.md), [`features/participants.md`](../features/participants.md), [`features/expenses.md`](../features/expenses.md), [`features/reservations.md`](../features/reservations.md), [`features/pre-trip-planning.md`](../features/pre-trip-planning.md)

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

MVP notification events:

| Event | Recipient |
|---|---|
| Trip invitation received | Invited user |
| Join request accepted / declined | Requesting user |
| Trip status changed (IN_PROGRESS, COMPLETED) | All confirmed participants |
| Feedback window opened | All confirmed participants |
| Passport `EXPIRING_SOON` | User who owns the passport |
| Passport `EXPIRED` | User who owns the passport |
| Level-up | User |
| Achievement unlocked | User |
| New recognition received | Recipient user |
| New message in a channel or DM | Channel/DM participants |

**Reference:** [`infrastructure/cloud.md`](../infrastructure/cloud.md)

---

## Out of Scope for MVP

The following modules are designed and documented but will not be built in the MVP:

| Module | Reference |
|---|---|
| Agencies | [`features/agencies.md`](../features/agencies.md) |
| Reservations | [`features/reservations.md`](../features/reservations.md) |
| Pre-trip planning (tasks, route planning, budget envelopes) | [`features/pre-trip-planning.md`](../features/pre-trip-planning.md) |
| Events system | [`features/events.md`](../features/events.md) |
| Calendar views | [`features/calendar.md`](../features/calendar.md) |

---

## Open Questions

- What is the exact scope of the simplified trips module? (see Trips section above)
- Does the MVP include expense tracking, or is it deferred?
- If the itinerary is deferred, how are gamification inputs (distance, countries) collected at trip completion?
- Is there a target user count or pilot group for the MVP launch?
