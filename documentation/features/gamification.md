# Feature: Gamification

**Status:** Design Phase
**Last Updated:** 2026-03-23

---

## Overview

Gamification is a core pillar of Chamuco Travel, not an afterthought. The reference model is Strava: a system that celebrates real-world activity, builds social reputation over time, and creates the feeling that every trip adds something permanent to who you are as a traveler. The goal is never to reward time spent in the app — it is to reward trips taken in the real world.

Gamification operates across three scopes:

- **Personal** — Level, Traveler Score, statistics, achievements, discovery map, and Chamuco Points.
- **Group** — A member's standing within a specific group: status tier, seniority, and peer recognitions.
- **Trip** — Post-trip feedback and reward distribution at the end of each completed journey.

---

## Two Distinct Resources

It is critical to distinguish these two resources — they are separate, serve different purposes, and cannot be exchanged:

| Resource                | Purpose                                                  | Earnable | Spendable                 |
| ----------------------- | -------------------------------------------------------- | -------- | ------------------------- |
| **Level Points (LP)**   | Advance player level. Reflect travel experience.         | ✓        | ✗ Never spent             |
| **Chamuco Points (CP)** | Soft cosmetic currency. Spend on profile customizations. | ✓        | ✓ In the cosmetic catalog |

Both are earned through travel activity, but a player's LP balance only ever grows. Chamuco Points go up and down as items are purchased.

---

## 1. Player Level

### Concept

Every user has a single **global player level** (1–50) that grows throughout their lifetime on the platform. The level reflects accumulated travel experience across all trips, achievements, and recognitions. It is always visible on the user's public profile alongside their name and tier badge.

The level system is designed around **real travel frequency**. A regular traveler (roughly one trip every two months) should progress naturally through the level tiers over years of use. Reaching the highest tier requires sustained commitment over many years — it is a mark of a genuinely experienced traveler, not a power user who logs in daily.

### Level Tiers

Levels are grouped into five named tiers, each spanning ten levels. The tier name and badge are displayed on the profile; the specific level within the tier shows as a numeric label or progress bar.

| Tier | Levels | Name           | Spirit                                       |
| ---- | ------ | -------------- | -------------------------------------------- |
| 1    | 1–10   | **Nómada**     | Starting the journey — every trip is new.    |
| 2    | 11–20  | **Explorador** | Building history, expanding horizons.        |
| 3    | 21–30  | **Aventurero** | Experienced traveler, organizer of memories. |
| 4    | 31–40  | **Viajero**    | Veteran of many roads, respected companion.  |
| 5    | 41–50  | **Leyenda**    | An icon of the community.                    |

### Level Progression Formula

The XP required to advance from level **n** to level **n+1** follows a polynomial curve:

```
LP_required(n → n+1) = floor(A × n^B)
```

**Proposed constants:** `A = 50`, `B = 1.3`

These constants are fine-tuned during implementation to meet the progression targets below. The shape of the curve (polynomial with exponent > 1) is intentional: early levels are quick to reach so new users feel immediate progress, while later levels become progressively harder to sustain engagement over time.

**Sample values with A=50, B=1.3:**

| Level transition            | LP required      |
| --------------------------- | ---------------- |
| 1 → 2                       | 50               |
| 5 → 6                       | 406              |
| 10 → 11                     | 998              |
| 20 → 21                     | 2,462            |
| 30 → 31                     | 4,409            |
| 40 → 41                     | 6,840            |
| 49 → 50                     | 9,098            |
| **Total to reach level 50** | **≈ 167,000 LP** |

### Progression Targets

These are the design targets that validate the formula constants. If constants change, they must continue to satisfy these targets:

| User type                    | Trips/year | Target level 20 | Target level 50 |
| ---------------------------- | ---------- | --------------- | --------------- |
| Casual (4 trips/year)        | 4          | ~2 years        | ~12 years       |
| Regular (6 trips/year)       | 6          | ~1 year         | ~7 years        |
| Active (12 trips/year)       | 12         | ~6 months       | ~3.5 years      |
| Super-active (24 trips/year) | 24         | ~3 months       | ~1.5 years      |

Estimated annual LP by traveler profile (based on the multi-factor trip formula + achievements + recognitions):

| Profile      | Trips/year | LP from trips | LP from logros/reconocimientos | **Total/year** |
| ------------ | ---------- | ------------- | ------------------------------ | -------------- |
| Casual       | 4          | ~14,000       | ~2,000                         | **~16,000**    |
| Regular      | 6          | ~21,000       | ~3,000                         | **~24,000**    |
| Active       | 10         | ~35,000       | ~5,000                         | **~40,000**    |
| Super-active | 24         | ~84,000       | ~8,000                         | **~92,000**    |

Trip LP estimates assume a mid-range trip profile (5–7 days, medium distance, 6–8 participants). Higher bonuses (long-haul, international, organizer) push individual trip yields up; local solo day trips push them down.

### Level-Up Mechanics

- A user may advance **multiple levels at once** if a large LP gain crosses multiple thresholds (e.g., after completing a long trip with several achievements unlocked simultaneously).
- The level stored in `user_stats.level` is updated atomically during the trip completion flow.
- There is no level decay — levels never go down.
- There is no level cap beyond 50; if the system is extended in the future, level 50 becomes the entry to a new tier.

### Level Rewards

Levels are **purely cosmetic and social** — they carry no functional advantages in trip participation, expense access, channel permissions, or any other operational mechanic. This is a deliberate design choice: a first-time traveler and a Leyenda participate in the same trip on equal footing.

What levels unlock:

- Tier badge displayed on profile and in group/trip member lists.
- Specific level milestones (10, 20, 30, 40, 50) unlock exclusive cosmetic items in the Chamuco Points catalog.
- Higher-tier profiles may receive visual distinction in community search results (platform decision at implementation).

---

## 2. Level Points — Sources

Level Points are awarded when travel activity is verified and completed. The primary source is completing trips; achievements and recognitions amplify progression.

### Primary sources

LP awarded for completing a trip is computed from a **multi-factor formula**. The base trip reward always dominates — the act of completing a trip is the most valuable single action in the system. Bonuses reward the nature and context of the journey without overshadowing it.

**Formula:**

```
LP = LP_base + LP_duration + LP_distance + LP_international + LP_participants + LP_organizer
```

| Component          | Value                        | Notes                                                                                   |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------- |
| `LP_base`          | **2,500 LP**                 | Awarded for completing any trip                                                         |
| `LP_duration`      | 60 × min(duration_days, 30)  | Max +1,800 LP at 30+ days                                                               |
| `LP_distance`      | Tier-based (see below)       | Distance from user's home location                                                      |
| `LP_international` | +400 LP                      | If any destination is outside the user's home country                                   |
| `LP_participants`  | floor(100 × ln(n_travelers)) | n_travelers = confirmed participants with `did_travel = true`                           |
| `LP_organizer`     | +1,000 LP                    | Only if role is `ORGANIZER` or `CO_ORGANIZER` **and** `is_traveling_participant = true` |

**Distance tiers** (from the user's `home_city`; falls back to country centroid if not set):

| Distance to destination | Bonus   |
| ----------------------- | ------- |
| < 200 km                | +0 LP   |
| 200–999 km              | +200 LP |
| 1,000–2,999 km          | +500 LP |
| ≥ 3,000 km              | +900 LP |

**Participant bonus — logarithmic curve:**

| Confirmed travelers | LP bonus |
| ------------------- | -------- |
| 1 (solo)            | 0        |
| 2                   | +69      |
| 5                   | +161     |
| 10                  | +230     |
| 20                  | +300     |
| 50                  | +391     |

**Complete examples:**

| Trip                                                   | Base  | Duration | Distance | Intl. | Participants | Organizer | **Total** |
| ------------------------------------------------------ | ----- | -------- | -------- | ----- | ------------ | --------- | --------- |
| 1 day, local, solo                                     | 2,500 | 60       | 0        | 0     | 0            | —         | **2,560** |
| 5 days, 600 km, domestic, 6 people                     | 2,500 | 300      | +200     | 0     | +179         | —         | **3,179** |
| 7 days, 1,500 km, international, 8 people              | 2,500 | 420      | +500     | +400  | +208         | —         | **4,028** |
| 21 days, 8,000 km, international, 15 people, organizer | 2,500 | 1,260    | +900     | +400  | +270         | +1,000    | **6,330** |

In the most extreme realistic trip (last row), the base still represents ~38% of total LP — and for a minimal solo local trip it is 98%. **The fact of traveling is always the dominant reward.**

### Achievements

Achievement LP rewards scale by rarity. See Section 3 for the full rarity classification.

| Achievement rarity | Level Points |
| ------------------ | ------------ |
| `COMMON`           | 500 LP       |
| `UNCOMMON`         | 1,000 LP     |
| `RARE`             | 2,500 LP     |
| `EPIC`             | 5,000 LP     |

### Recognitions and feedback

| Event                                    | Level Points |
| ---------------------------------------- | ------------ |
| Receive a recognition (any source)       | 750 LP       |
| Submit trip feedback (organizer or peer) | 200 LP       |

### Rules

- LP is awarded only on verified, completed trips (`TripStatus = COMPLETED`).
- LP from a cancelled trip is not awarded, even if partially completed.
- LP from achievements is awarded once per achievement, at the moment of unlock.
- LP for feedback is awarded at the moment of submission, within the feedback window.
- LP cannot be manually adjusted, awarded by organizers, or transferred between users.

---

## 3. Achievements

Achievements are **badges awarded automatically** when a user crosses a defined milestone. Each achievement is earned once and never lost. They appear on the user's public profile as a badge collection, sorted by unlock date.

### Achievement Rarity

Every achievement has a rarity level that determines its Level Points reward (see Section 2) and the visual weight of its badge.

| Rarity     | Description                                                      |
| ---------- | ---------------------------------------------------------------- |
| `COMMON`   | Accessible milestones reachable in the first year of active use. |
| `UNCOMMON` | Require consistent effort over 1–2 years.                        |
| `RARE`     | Significant milestones that most users won't reach quickly.      |
| `EPIC`     | Reserved for truly exceptional travel histories.                 |

### Trip Frequency

| Achievement    | Trigger              | Rarity   |
| -------------- | -------------------- | -------- |
| `FIRST_TRIP`   | First completed trip | COMMON   |
| `TRAVELER_5`   | 5 completed trips    | COMMON   |
| `TRAVELER_10`  | 10 completed trips   | COMMON   |
| `TRAVELER_25`  | 25 completed trips   | UNCOMMON |
| `TRAVELER_50`  | 50 completed trips   | RARE     |
| `TRAVELER_100` | 100 completed trips  | EPIC     |

### Geographic Breadth

| Achievement             | Trigger                                         | Rarity   |
| ----------------------- | ----------------------------------------------- | -------- |
| `FIRST_ABROAD`          | First trip outside home country                 | COMMON   |
| `EXPLORER_5_COUNTRIES`  | 5 unique countries visited                      | COMMON   |
| `EXPLORER_10_COUNTRIES` | 10 unique countries visited                     | UNCOMMON |
| `EXPLORER_25_COUNTRIES` | 25 unique countries visited                     | RARE     |
| `EXPLORER_50_COUNTRIES` | 50 unique countries visited                     | EPIC     |
| `CONTINENT_AMERICA`     | Trip in North or South America                  | COMMON   |
| `CONTINENT_EUROPE`      | Trip in Europe                                  | COMMON   |
| `CONTINENT_AFRICA`      | Trip in Africa                                  | UNCOMMON |
| `CONTINENT_ASIA`        | Trip in Asia                                    | UNCOMMON |
| `CONTINENT_OCEANIA`     | Trip in Oceania                                 | RARE     |
| `ALL_CONTINENTS`        | At least one trip on all 6 inhabited continents | EPIC     |

### Distance & Coverage

| Achievement | Trigger             | Rarity   |
| ----------- | ------------------- | -------- |
| `KM_1000`   | 1,000 km traveled   | COMMON   |
| `KM_10000`  | 10,000 km traveled  | UNCOMMON |
| `KM_50000`  | 50,000 km traveled  | RARE     |
| `KM_100000` | 100,000 km traveled | EPIC     |

### Intensity

| Achievement         | Trigger                           | Rarity   |
| ------------------- | --------------------------------- | -------- |
| `TRIPS_3_IN_A_YEAR` | 3 trips in a single calendar year | COMMON   |
| `TRIPS_5_IN_A_YEAR` | 5 trips in a single calendar year | UNCOMMON |
| `LONG_HAUL`         | Trip lasting 14+ days             | UNCOMMON |
| `EPIC_JOURNEY`      | Trip lasting 30+ days             | RARE     |

### Social

| Achievement         | Trigger                              | Rarity   |
| ------------------- | ------------------------------------ | -------- |
| `TRAVEL_SQUAD_10`   | Traveled with 10 unique companions   | COMMON   |
| `TRAVEL_SQUAD_50`   | Traveled with 50 unique companions   | UNCOMMON |
| `TRAVEL_SQUAD_100`  | Traveled with 100 unique companions  | RARE     |
| `BIG_GROUP`         | Trip with 20+ confirmed participants | UNCOMMON |
| `FIRST_ORGANIZER`   | Organized and completed a trip       | COMMON   |
| `SERIAL_ORGANIZER`  | Organized and completed 5 trips      | UNCOMMON |
| `VETERAN_ORGANIZER` | Organized and completed 20 trips     | RARE     |

---

## 4. Traveler Score & Rankings

### Traveler Score

The **Traveler Score** is a composite metric computed from verified travel activity. It is separate from the player level: the score reflects the _breadth and depth_ of real-world travel, while the level reflects _accumulated participation_. Both coexist and serve different purposes.

| Input                                   | Weight rationale    |
| --------------------------------------- | ------------------- |
| Total completed trips                   | Base progression    |
| Countries visited (unique)              | Geographic breadth  |
| Total distance traveled (km)            | Physical reach      |
| Total area explored (km²)               | Coverage density    |
| Achievements unlocked                   | Milestone depth     |
| Positive feedback received as organizer | Social validation   |
| Recognitions received                   | Peer acknowledgment |

The exact formula coefficients are implementation decisions. The key invariant: **the score reflects real-world travel, not app activity or level**.

### Rankings

- **Global ranking** — All users sorted by Traveler Score. Publicly visible.
- **Country ranking** — Filtered by declared home country. Allows local comparison.
- Rankings are recalculated asynchronously after each trip completion event.

---

## 5. Personal Statistics

Computed automatically from completed trips. Stored in `user_stats`. Displayed on the public profile and used as inputs to the Traveler Score.

| Statistic                  | Description                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `level`                    | Current player level (1–50)                                                         |
| `level_points_total`       | Cumulative LP earned since account creation (never decreases)                       |
| `trips_completed`          | Total trips where the user was a confirmed participant and trip reached `COMPLETED` |
| `countries_visited`        | Unique countries covered by at least one `PLACE` item in completed trips            |
| `cities_visited`           | Unique cities visited across completed trips                                        |
| `km_traveled`              | Sum of `distance_km` across all transport items in completed trips                  |
| `km2_explored`             | Approximate area covered by visited place coordinates                               |
| `trips_per_year`           | Historical breakdown: trips completed per calendar year                             |
| `unique_travel_companions` | Count of distinct co-travelers across all completed trips                           |
| `trips_as_organizer`       | Count of trips completed in the `ORGANIZER` role                                    |
| `longest_trip_days`        | Duration in days of the longest completed trip                                      |
| `travel_frequency_index`   | Computed on-the-fly — see TFI section below                                         |
| `traveler_score`           | Composite score for global ranking                                                  |

---

### Travel Frequency Index (TFI)

The **Travel Frequency Index** is a snapshot metric of recent travel momentum. Unlike `trips_completed` (a lifetime count) or `trips_per_year` (a calendar aggregate), the TFI reflects how actively a user has been traveling in the recent past. It decays naturally toward zero if travel stops — a user who traveled intensively two years ago but has not traveled since will eventually converge to 0.

#### Algorithm

```
TFI(t) = C × Σ_{i ∈ trips_365(t)} contribution(D_i) × decay(d_i)
```

| Symbol            | Meaning                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `trips_365(t)`    | Trips where `did_travel = true` and ended within the 365 days before time t  |
| `d_i`             | Days elapsed since trip i ended, at time t                                   |
| `D_i`             | Duration of trip i in days                                                   |
| `contribution(D)` | `1 + 0.04 × min(D, 30)` — ranges from 1.0 (short trip) to 2.2 (30+ day trip) |
| `decay(d)`        | `exp(−d × ln(2) / 120)` — exponential decay with a **120-day half-life**     |
| `C`               | `0.45` — normalization constant calibrated to the reference profiles below   |

The half-life of 120 days means a trip from 4 months ago contributes exactly half as much as a trip completed today. A trip from 1 year ago still contributes ~12% — old travel history fades but does not vanish instantly.

#### Decay reference

| Days since trip ended | Remaining weight          |
| --------------------- | ------------------------- |
| 0 (today)             | 100%                      |
| 60 days               | 71%                       |
| 120 days (half-life)  | 50%                       |
| 240 days              | 25%                       |
| 365 days              | 12%                       |
| > 365 days            | 0% (excluded from window) |

#### Calibration and reference profiles

| Profile           | Trips/year | Total days/year | Approximate TFI |
| ----------------- | ---------- | --------------- | --------------- |
| Inactive          | 0          | 0               | 0.0             |
| Normal traveler   | 3          | 10              | ~0.7            |
| Frequent traveler | 5          | 15              | ~1.1            |
| Avid traveler     | 8          | 30              | ~1.9            |

The TFI is a **snapshot**, not a calendar-year average. Two users with the same annual trip count but different recent timing will have different TFI values. A user who just returned from a trip will see a spike; one who last traveled 8 months ago will show decay even if their total count is high. Constants `C`, the half-life, and the duration coefficient may be fine-tuned during implementation without changing the algorithm's structure.

#### Implementation

The TFI is **not stored** in `user_stats` — it is computed on-the-fly at display time. The query fetches `trip_participants` records where `did_travel = true` and the trip ended within the past 365 days. For the vast majority of users this means fewer than 20 rows. The result may be cached per session or invalidated daily.

---

## 6. Chamuco Points

**Chamuco Points (CP)** are a soft in-app currency with no real monetary value. They are earned through travel activity and spent on cosmetic profile customizations. They are entirely separate from Level Points.

### Earning CP

| Event                                    | Chamuco Points                    |
| ---------------------------------------- | --------------------------------- |
| Trip completed (base)                    | 100 CP                            |
| Trip duration bonus                      | +5 CP per day beyond day 1        |
| Achievement unlocked (COMMON)            | 25 CP                             |
| Achievement unlocked (UNCOMMON)          | 50 CP                             |
| Achievement unlocked (RARE)              | 100 CP                            |
| Achievement unlocked (EPIC)              | 200 CP                            |
| Recognition received                     | 15 CP                             |
| Submit trip feedback                     | 10 CP                             |
| Event participation (if event awards CP) | As defined by the event organizer |

### Spending CP

Chamuco Points are spent on **cosmetic profile customizations** only. No functional advantage is ever sold. Examples of redeemable items:

- Avatar frame variants
- Discovery map color themes
- Profile badge display style
- Custom profile title or tagline
- Animated profile elements
- Exclusive cosmetic unlocks at level milestones (see Section 1)

The cosmetic catalog is a product decision deferred to the implementation phase.

### Rules

- CP do not expire.
- CP cannot be transferred between users.
- CP cannot be purchased with real money.
- The spending catalog is defined by the platform.

### Data Model (`chamuco_point_transactions`)

Each earn or spend event creates an immutable transaction record. The current balance is the sum of all transactions.

| Field          | Type               | Description                                                                                                                |
| -------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `id`           | UUID               |                                                                                                                            |
| `user_id`      | UUID               | FK → `users.id`                                                                                                            |
| `amount`       | Integer            | Positive = earned, negative = spent                                                                                        |
| `reason`       | Enum `PointReason` | `TRIP_COMPLETED`, `ACHIEVEMENT_UNLOCKED`, `RECOGNITION_RECEIVED`, `FEEDBACK_SUBMITTED`, `EVENT_AWARD`, `COSMETIC_PURCHASE` |
| `reference_id` | UUID (nullable)    | FK to the triggering entity                                                                                                |
| `created_at`   | Timestamp          |                                                                                                                            |

---

## 7. Discovery Map

Every user has a **personal discovery map**: an interactive geographic visualization of all places visited across completed trips.

### Granularity

**Country view (default):** World map with visited countries highlighted. A country is visited when at least one `PLACE` itinerary item in a completed trip is located there.

**City view:** Tapping a visited country shows individual cities as point markers, derived from the city metadata on `PLACE` items.

**Continental summary panel:** Always visible alongside the map. Shows per-continent count (e.g., "Europe: 8 / 44 countries — 18%").

### Behavior

- Visited countries: filled with the primary color at 60–80% opacity.
- Unvisited countries: neutral gray.
- Tapping a country or city opens a panel listing the trips that covered that location.
- Map respects the user's active cosmetic theme (Chamuco Points catalog).
- Visibility follows the main `ProfileVisibility` setting — no independent toggle.

### Data Source

Computed on demand from `itinerary_items` of type `PLACE` in completed trips where the user was a confirmed participant. No separate geographic table required.

---

## 8. Group Member Tier

Each user has an independent tier in every group they belong to. This is **separate from the global player level** — it reflects experience with that specific group of people, not global travel breadth.

| Value      | Display name | Requirement                                  |
| ---------- | ------------ | -------------------------------------------- |
| `NEWCOMER` | Nómada       | Joined but no completed trip with this group |
| `NOVICE`   | Novicio      | 1 completed trip with this group             |
| `EXPLORER` | Explorador   | 5 completed trips with this group            |
| `VETERAN`  | Veterano     | 10+ completed trips with this group          |

Group tier is visible within the group context (member list, group channel, trip participants). Outside the group, only global level and Traveler Score are visible.

---

## 9. Recognitions

Recognitions are social badges awarded by people, not the system. They are distinct from Achievements (system-triggered). A recognition carries the giver's name, context, and a title chosen by the giver.

### Sources

| Source             | Who can award                                                | When                                                          |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------- |
| Trip completion    | Trip `ORGANIZER` or `CO_ORGANIZER` with `AWARD_RECOGNITIONS` | Within 7 days of trip reaching `COMPLETED`                    |
| Annual group award | Group `OWNER` or `ADMIN`                                     | Once per calendar year per group                              |
| Event award        | Event organizer                                              | When the event completes, if configured to award recognitions |

### Recognition Record (`recognitions`)

| Field                | Type                     | Description                                                                 |
| -------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `id`                 | UUID                     |                                                                             |
| `recipient_user_id`  | UUID                     | FK → `users.id`                                                             |
| `awarded_by_user_id` | UUID                     | FK → `users.id`                                                             |
| `title`              | String                   | Short label chosen by the giver (e.g., "Mejor Navegador", "Alma del Grupo") |
| `description`        | Text (nullable)          | Optional longer message from the giver                                      |
| `source`             | Enum `RecognitionSource` | `TRIP_COMPLETION`, `GROUP_ANNUAL`, `EVENT`                                  |
| `trip_id`            | UUID (nullable)          |                                                                             |
| `group_id`           | UUID (nullable)          |                                                                             |
| `event_id`           | UUID (nullable)          |                                                                             |
| `awarded_at`         | Timestamp                |                                                                             |

---

## 10. Trip Feedback

At the end of every completed trip, a **feedback window** opens for all confirmed participants. The window remains open for 7 days after `COMPLETED`. Feedback is optional for all participants.

### Trip Feedback (about the trip / organizer)

| Field                 | Type            | Description                                                |
| --------------------- | --------------- | ---------------------------------------------------------- |
| `id`                  | UUID            |                                                            |
| `trip_id`             | UUID            |                                                            |
| `reviewer_user_id`    | UUID            |                                                            |
| `target_user_id`      | UUID            | The organizer being reviewed                               |
| `planning_score`      | Integer (1–5)   | Itinerary quality and accuracy                             |
| `communication_score` | Integer (1–5)   | Clarity and responsiveness                                 |
| `logistics_score`     | Integer (1–5)   | Coordination of transport, stays, activities               |
| `overall_score`       | Integer (1–5)   | Summary score                                              |
| `comment`             | Text (nullable) |                                                            |
| `is_anonymous`        | Boolean         | If true, organizer sees scores but not the reviewer's name |
| `created_at`          | Timestamp       |                                                            |

### Peer Feedback (traveler to traveler)

Optional, positive-only. Each participant can leave a brief acknowledgment for any co-traveler.

| Field          | Type            | Description        |
| -------------- | --------------- | ------------------ |
| `id`           | UUID            |                    |
| `trip_id`      | UUID            |                    |
| `from_user_id` | UUID            |                    |
| `to_user_id`   | UUID            |                    |
| `note`         | Text (nullable) | Max 280 characters |
| `created_at`   | Timestamp       |                    |

---

## 11. Trip Completion Flow

When a trip transitions to `COMPLETED`, the NestJS backend executes the following sequence atomically (PostgreSQL transaction where possible, idempotent if re-run):

1. **Update trip status** to `COMPLETED` in PostgreSQL.
2. **Archive the trip's auto-channel** in Firestore (set to read-only).
3. **Compute and store stats updates** for each confirmed participant:
   - Update `user_stats`: `trips_completed`, `countries_visited`, `km_traveled`, etc.
   - Update `group_member_stats` and recalculate group tier for each group associated with the trip.
4. **Evaluate achievements**: check all milestone conditions for each participant. Create `user_achievements` records for newly met thresholds.
5. **Distribute Level Points (LP)**:
   - For each participant with `did_travel = true`, compute LP using the multi-factor formula: base (2,500) + duration + distance + international + participant count + organizer bonus. See Section 2 for the full formula.
   - Award achievement LP for any achievements unlocked in step 4.
6. **Evaluate level-ups**: for each participant, check if accumulated `level_points_total` crosses one or more level thresholds. Advance `level` accordingly (may be multiple levels at once). Notify the user of each level-up (and tier advancement if applicable).
7. **Distribute Chamuco Points (CP)**: award base trip CP + duration bonus + achievement CP for newly unlocked achievements.
8. **Open the feedback window**: set `feedback_open_until = now() + 7 days` on the trip record.
9. **Notify all participants** that the trip is complete and the feedback window is open.
10. **Unlock organizer recognition window**: organizers receive a prompt to award recognitions, valid until `feedback_open_until`.

---

## Open Questions

- What is the exact Traveler Score formula and coefficient weighting?
- Can an organizer award a recognition to themselves?
- Is there a maximum number of recognitions an organizer can give per trip?
- Should peer feedback notes be visible on the recipient's public profile, or only in the trip context?
- Is the `km2_explored` metric feasible to compute from itinerary coordinates? (May need to simplify to a radius-based approximation.)
- Should there be a group aggregate discovery map ("places our group has collectively been")?
- What happens to accumulated Chamuco Points if a user account is deleted?
- Should the level system have a "prestige" mechanic (reset to level 1 after 50, with a special badge), or is level 50 the permanent ceiling?
