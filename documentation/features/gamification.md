# Feature: Gamification

**Status:** Design Phase
**Last Updated:** 2026-03-19

---

## Overview

Chamuco App is not just a trip planner — it is a platform for groups that travel together. Gamification reinforces this identity: achievements are richer when shared, reputation is built in front of people who were actually there, and recognitions carry weight because they come from real co-travelers. The reference model is closer to Strava than to a standard loyalty program. The goal is not to reward engagement with the app, but to celebrate real-world travel.

Gamification in Chamuco operates across three scopes:

- **Personal** — A traveler's public reputation, statistics, achievements, and discovery map.
- **Group** — A member's standing within a specific group: status tier, seniority, and peer recognitions.
- **Trip** — Post-trip feedback and reward distribution at the end of each completed journey.

---

## 1. Traveler Score & Personal Rankings

### Traveler Score

Every user has a single composite score used for global ranking: the **Traveler Score**. It is computed automatically from verified activity (completed trips). It is not manually editable or purchasable.

The score formula weights the following inputs:

| Input | Weight rationale |
|---|---|
| Total completed trips | Base progression |
| Countries visited (unique) | Geographic breadth |
| Total distance traveled (km) | Depth of exploration |
| Total area explored (km²) | Coverage of destinations |
| Achievements unlocked | Milestone depth |
| Positive feedback received | Social validation |
| Recognitions received | Peer acknowledgment |

The exact formula coefficients are an implementation decision. The key invariant is that **the score reflects real-world travel, not app activity**.

### Personal Rankings

- **Global ranking** — All users sorted by Traveler Score. Paginated and publicly visible on each user's profile.
- **Country ranking** — Filtered by the user's declared country of residence. Allows comparison with local travelers.
- Rankings are recalculated asynchronously after each trip completion event.

---

## 2. Personal Statistics

Statistics are computed automatically from completed trips. They are displayed on the user's public profile and feed into the Traveler Score.

| Statistic | Description |
|---|---|
| `trips_completed` | Total count of trips where the user was a confirmed participant and the trip reached `COMPLETED` status |
| `countries_visited` | Count of unique countries covered by at least one itinerary item in a completed trip |
| `regions_visited` | Count of unique region/state subdivisions visited (used for the discovery map) |
| `km_traveled` | Sum of `distance_km` across all transport itinerary items in completed trips |
| `km2_explored` | Approximate area covered by visited places, computed from coordinates of `PLACE` itinerary items |
| `trips_per_year` | Historical breakdown: trips completed per calendar year |
| `unique_travel_companions` | Count of distinct users who were confirmed participants on the same completed trip |
| `trips_as_organizer` | Count of trips where the user held the `ORGANIZER` role |
| `longest_trip_days` | Duration in days of the longest completed trip |

Statistics are stored in a dedicated `user_stats` table (1:1 with `users`) and updated as part of the trip completion flow. See `database-design.md` for schema.

---

## 3. Achievements

Achievements (Logros) are **badges awarded automatically** when a user crosses a defined milestone. Each achievement is earned once and never lost. They appear on the user's public profile as a collection of badges, sorted by earn date.

Achievements are grouped into categories:

### Trip Frequency

| Achievement | Trigger |
|---|---|
| `FIRST_TRIP` | First completed trip |
| `TRAVELER_5` | 5 completed trips |
| `TRAVELER_10` | 10 completed trips |
| `TRAVELER_25` | 25 completed trips |
| `TRAVELER_50` | 50 completed trips |
| `TRAVELER_100` | 100 completed trips |

### Geographic Breadth

| Achievement | Trigger |
|---|---|
| `FIRST_ABROAD` | First completed trip outside the user's declared home country |
| `EXPLORER_5_COUNTRIES` | 5 unique countries visited |
| `EXPLORER_10_COUNTRIES` | 10 unique countries visited |
| `EXPLORER_25_COUNTRIES` | 25 unique countries visited |
| `EXPLORER_50_COUNTRIES` | 50 unique countries visited |
| `CONTINENT_AMERICA` | Completed a trip in South or North America |
| `CONTINENT_EUROPE` | Completed a trip in Europe |
| `CONTINENT_AFRICA` | Completed a trip in Africa |
| `CONTINENT_ASIA` | Completed a trip in Asia |
| `CONTINENT_OCEANIA` | Completed a trip in Oceania |
| `ALL_CONTINENTS` | Completed at least one trip on all 6 inhabited continents |

### Distance & Coverage

| Achievement | Trigger |
|---|---|
| `KM_1000` | 1,000 km traveled |
| `KM_10000` | 10,000 km traveled |
| `KM_50000` | 50,000 km traveled |
| `KM_100000` | 100,000 km traveled |

### Intensity

| Achievement | Trigger |
|---|---|
| `TRIPS_3_IN_A_YEAR` | 3 completed trips in a single calendar year |
| `TRIPS_5_IN_A_YEAR` | 5 completed trips in a single calendar year |
| `LONG_HAUL` | Completed a trip lasting 14+ days |
| `EPIC_JOURNEY` | Completed a trip lasting 30+ days |

### Social

| Achievement | Trigger |
|---|---|
| `TRAVEL_SQUAD_10` | Traveled with 10 unique companions across trips |
| `TRAVEL_SQUAD_50` | Traveled with 50 unique companions |
| `TRAVEL_SQUAD_100` | Traveled with 100 unique companions |
| `BIG_GROUP` | Participated in a trip with 20+ confirmed participants |
| `FIRST_ORGANIZER` | Organized and completed a trip as `ORGANIZER` |
| `SERIAL_ORGANIZER` | Organized and completed 5 trips |

---

## 4. Chamuco Points

**Chamuco Points** are a soft in-app currency with no real monetary value. They are earned through travel activity and spent on profile customizations.

### Earning Points

| Event | Points awarded |
|---|---|
| Trip completed (base) | 100 points per trip |
| Trip duration bonus | +10 points per day beyond day 1 |
| Achievement unlocked | Varies per achievement (10–200 points) |
| Recognition received | 15 points per recognition |
| Event participation (if event awards points) | As defined by the event organizer |
| Positive peer feedback received | 5 points per positive feedback |

The base trip award is scaled by the platform and may be adjusted. Points are distributed at the moment the trip status transitions to `COMPLETED`.

### Spending Points

Chamuco Points are spent exclusively on **cosmetic profile customizations**. They carry no functional advantage. Examples of redeemable items:

- Avatar frame variants
- Discovery map color themes
- Profile badge display style
- Custom profile title or tagline
- Animated profile elements

The catalog of redeemable items is a product decision deferred to the implementation phase.

### Rules

- Points do not expire.
- Points cannot be transferred between users.
- Points cannot be purchased with real money.
- The spending catalog is defined by the platform, not by users or organizers.

### Data Model (`chamuco_point_transactions`)

Each earn or spend event creates an immutable transaction record. The current balance is the sum of all transactions for a user.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `user_id` | UUID | FK → `users.id` |
| `amount` | Integer | Positive = earned, negative = spent |
| `reason` | Enum `PointReason` | `TRIP_COMPLETED`, `ACHIEVEMENT_UNLOCKED`, `RECOGNITION_RECEIVED`, `PEER_FEEDBACK`, `EVENT_AWARD`, `COSMETIC_PURCHASE` |
| `reference_id` | UUID (nullable) | FK to the triggering entity (trip, achievement, recognition, etc.) |
| `created_at` | Timestamp | |

The computed balance is never stored directly — it is always derived from the transaction log.

---

## 5. Discovery Map

Every user has a **personal discovery map**: an interactive geographic visualization of all territories they have visited across completed trips.

### Granularity

- **Country level** — every country where at least one itinerary `PLACE` item was located in a completed trip is highlighted.
- **Region/state level** — for countries with region data on itinerary items, individual regions/states are highlighted within the country polygon.

### Behavior

- Territories with at least one visit are colored (color determined by the user's active map theme from Chamuco Points catalog; default is the primary color of the chosen app palette).
- Unvisited territories are neutral gray.
- Clicking or tapping a highlighted territory opens a panel showing the trips that covered that territory, with links to each trip's detail page.
- The map is displayed on the user's public profile if their profile visibility permits it.

### Data Source

The map is derived from `itinerary_items` of type `PLACE` that carry coordinate or country/region metadata, filtered to items belonging to completed trips where the user was a confirmed participant.

---

## 6. Group Member Status

Each user has an independent status in every group they belong to. This is separate from the user's global reputation and from their `GroupRole` (admin/member). Status reflects **experience within that specific group**.

### Status Tiers (enum: `GroupMemberTier`)

| Value | Display name | Requirement |
|---|---|---|
| `NEWCOMER` | Novicio | Joined the group but has not yet completed a trip with it |
| `NOVICE` | Novicio | 1 completed trip within this group |
| `EXPLORER` | Explorador | 5 completed trips within this group |
| `VETERAN` | Veterano | 10+ completed trips within this group |

"Completed trip within this group" means: the user was a confirmed participant on a trip that (a) was organized by or associated with the group and (b) reached `COMPLETED` status.

### Additional Group Stats

Stored in `group_member_stats` (see `database-design.md`):

| Field | Description |
|---|---|
| `group_trips_completed` | Count of trips completed as a member of this group |
| `joined_at` | Date the user's membership became `ACTIVE` — used to display seniority |
| `active_streak` | Consecutive trips participated in without skipping any group trip |
| `recognitions_received` | Count of recognitions received within this group |

Group seniority (years as a member) is displayed alongside the tier badge in the group member list and in the group channel.

### Status Visibility

Within the group context (member list, group channel, group trip participants), the user's tier badge and seniority label are visible to all group members. Outside the group, only the user's global reputation is visible.

---

## 7. Recognitions

**Recognitions** are social badges awarded by people, not by the system. They are distinct from Achievements (which are auto-triggered by milestones). A recognition carries the name of who gave it, the context in which it was given, and a title chosen by the giver.

### Sources

| Source | Who can award | When |
|---|---|---|
| Trip completion | Trip `ORGANIZER` or `CO_ORGANIZER` | Within a configurable window after the trip reaches `COMPLETED` (e.g., 7 days) |
| Annual group award | Group `OWNER` or `ADMIN` | Once per calendar year per group |
| Event award | Event organizer | When the event is marked as completed, if the event was configured to award recognitions |

### Recognition Record (`recognitions`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `recipient_user_id` | UUID | FK → `users.id` |
| `awarded_by_user_id` | UUID | FK → `users.id` |
| `title` | String | Short label chosen by the giver (e.g., "Best Navigator", "Soul of the Group") |
| `description` | Text (optional) | Longer message from the giver |
| `source` | Enum `RecognitionSource` | `TRIP_COMPLETION`, `GROUP_ANNUAL`, `EVENT` |
| `trip_id` | UUID (nullable) | Set if source is `TRIP_COMPLETION` |
| `group_id` | UUID (nullable) | Set if source is `GROUP_ANNUAL` |
| `event_id` | UUID (nullable) | Set if source is `EVENT` |
| `awarded_at` | Timestamp | |

Recognitions appear on the recipient's public profile, grouped by source context. Each recognition displays the giver's name and the context ("Received on Trip: Egypt 2024" or "Awarded by Grupo Aventureros — 2025").

---

## 8. Trip Feedback

At the end of every completed trip, a **feedback window** opens for all confirmed participants. The window remains open for a configurable period (default: 7 days after `COMPLETED`).

Feedback is **optional** for all participants. No participant is penalized for not leaving feedback.

### Trip Feedback (about the trip overall)

Directed at the organizer(s). Covers: planning quality, itinerary accuracy, communication, logistics. Uses a structured rating (1–5 stars per dimension) plus an optional free-text comment.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | FK → `trips.id` |
| `reviewer_user_id` | UUID | FK → `users.id` (the reviewer) |
| `target_user_id` | UUID | FK → `users.id` (the organizer being reviewed) |
| `planning_score` | Integer (1–5) | Itinerary quality and accuracy |
| `communication_score` | Integer (1–5) | Clarity and responsiveness before and during the trip |
| `logistics_score` | Integer (1–5) | Coordination of transport, stays, activities |
| `overall_score` | Integer (1–5) | Summary score |
| `comment` | Text (optional) | |
| `is_anonymous` | Boolean | If true, the organizer sees the scores but not the reviewer's name |
| `created_at` | Timestamp | |

Aggregate scores from trip feedback contribute to the organizer's **Traveler Score** (specifically, the positive feedback received component).

### Peer Feedback (traveler to traveler)

Each participant can leave a brief acknowledgment for any other participant on the same trip. This is entirely optional and positive-only — there is no mechanism for negative peer feedback.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | FK → `trips.id` |
| `from_user_id` | UUID | FK → `users.id` |
| `to_user_id` | UUID | FK → `users.id` |
| `note` | Text (optional) | Short message (max 280 characters) |
| `created_at` | Timestamp | |

Peer feedback received contributes to the recipient's Chamuco Points and Traveler Score. The feedback note is visible on the recipient's trip summary view (for that specific trip) and optionally on their public profile (user-controlled).

---

## 9. Trip Completion Flow

When a trip transitions to `COMPLETED` status (automatically at `end_date` boundary or manually by the organizer), the following sequence is triggered by the NestJS backend:

1. **Update trip status** in PostgreSQL to `COMPLETED`.
2. **Archive the trip's auto-channel** in Firestore (set to read-only).
3. **Compute and store stats updates** for each confirmed participant:
   - Increment `trips_completed`, update `countries_visited`, `km_traveled`, etc. in `user_stats`.
   - Increment `group_trips_completed` and recalculate tier in `group_member_stats` for each group associated with the trip.
4. **Evaluate achievements** for each participant: check all milestone conditions and create new `user_achievements` records for any newly met thresholds.
5. **Distribute Chamuco Points** to each participant: create a `chamuco_point_transactions` record for base trip award + duration bonus + any achievement point bonuses.
6. **Open the feedback window**: set `feedback_open_until` on the trip record (current timestamp + 7 days).
7. **Notify all participants** that the trip is complete and the feedback window is open.
8. **Unlock organizer recognition window**: organizers receive a prompt to award recognitions to participants, valid until `feedback_open_until`.

This entire sequence is atomic where possible (PostgreSQL operations in a single transaction) and idempotent (safe to re-run if partially failed).

---

## Open Questions / To Be Defined

- What is the exact Traveler Score formula and coefficient weighting?
- Should the discovery map also be viewable as a group aggregate ("places our group has been")?
- Is peer feedback completely anonymous, or does the recipient see who sent it?
- Should there be any negative feedback mechanism for peer-to-peer, or is the system positive-only by design?
- Can an organizer award a recognition to themselves?
- Is there a maximum number of recognitions an organizer can give per trip?
- Should achievements have associated Chamuco Point rewards of varying amounts, or a flat rate?
- Is the `km2_explored` metric feasible to compute accurately from itinerary place coordinates? (May need to simplify to a point-count or radius-based approximation.)
- Should the discovery map have a public/private toggle independent of the main profile visibility setting?
- What happens to accumulated Chamuco Points if a user account is deleted?
