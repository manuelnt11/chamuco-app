# Chamuco App — Database Design

**Status:** Active — core entities implemented; post-MVP tables documented as spec only
**Last Updated:** 2026-06-02

---

## Database Engine

**PostgreSQL** with JSONB support.

The design philosophy balances relational integrity for core entities with document-style flexibility for sub-entities that naturally belong to a single parent. This avoids over-normalization without sacrificing the queryability and consistency of relational data.

---

## Encoding and Collation

### Database-level encoding

The Cloud SQL PostgreSQL instance **must be created with `UTF8` encoding**. This is set once at instance creation and cannot be changed afterward.

```sql
-- Cloud SQL flag (set at instance creation, not per-DB)
-- Encoding: UTF8
-- Locale: en_US.UTF8 (or C.UTF-8)
```

`UTF8` in PostgreSQL stores every Unicode code point, including the full Basic Multilingual Plane and supplementary planes — which includes emoji (U+1F600 and above). No additional column-level configuration is needed to store emoji in `text` or `varchar` columns.

### Collation strategy

Sorting and comparison behavior is defined per column via ICU collations, available in PostgreSQL 10+ and fully supported on Cloud SQL.

| Context                                                                         | Collation           | Reason                                                                         |
| ------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| Default (most columns)                                                          | `und-x-icu`         | Unicode-correct ordering for any language, no locale assumption                |
| User-facing text sorted for display (`display_name`, `trip name`, group `name`) | `und-x-icu`         | Handles accented characters, CJK, Arabic, etc. correctly                       |
| `username`                                                                      | `C` (binary)        | Always lowercase ASCII `a-z 0-9 _ -`; binary ordering is sufficient and faster |
| Full-text search columns (future)                                               | `pg_catalog.simple` | Language-agnostic stemming via `tsvector`; collation handled by FTS            |

The default collation for the database is set to `und-x-icu` so that any column without an explicit override inherits Unicode-correct behavior automatically.

```sql
CREATE DATABASE chamuco
  ENCODING 'UTF8'
  LC_COLLATE = 'und-x-icu'
  LC_CTYPE   = 'en_US.UTF-8'
  TEMPLATE   = template0;
```

### Emoji in `cover_emoji` and similar columns

The `cover_emoji` column on `groups` and `trips` stores a single emoji character. A standard `text` column with `UTF8` encoding handles this without any special type. No length constraint is applied — `varchar(1)` would incorrectly reject multi-codepoint emoji sequences (e.g., flags: 🇲🇽 = U+1F1F2 + U+1F1FD).

### Drizzle ORM notes

- Drizzle uses `text` / `varchar` PostgreSQL types. No ORM-level encoding setting is needed — encoding is inherited from the database.
- When generating migrations with `drizzle-kit generate`, the `CREATE DATABASE` statement is **not** produced by drizzle-kit. It must be part of the Cloud SQL provisioning script (Terraform or `gcloud sql databases create`).
- The migration runner (`drizzle-kit migrate`) connects to an already-provisioned database and assumes `UTF8` is in place.

---

## Design Principles

1. **Relational tables for entities with independent existence** — If an entity can exist independently, be referenced by multiple parents, or needs to be queried/filtered across trips, it gets its own table.

2. **JSONB for sub-entities scoped to a single parent** — If data only exists in the context of its parent and rarely needs to be queried independently, it can be stored as a JSONB column on the parent row. Examples: custom fields on an activity, contact info embedded in a stay.

3. **No unnecessary join tables** — Avoid creating association tables unless the relationship itself carries data or needs to be queried independently.

4. **Soft deletes** — Core entities (trips, users, participants) should use soft deletes (`deleted_at` timestamp) rather than hard deletes to preserve audit trails.

5. **Audit fields** — All tables include `created_at`, `updated_at`, and `deleted_at`.

---

## Core Entity Overview

Tables are divided into **implemented** (schema file + migration exist) and **post-MVP spec** (designed, not yet built).

### Users & Identity ✅ Implemented

- `users` — Account records. Linked to Firebase Authentication. Holds `avatar UUID FK → assets.id`.
- `user_profiles` — Extended profile data (bio, privacy settings, date of birth, birth/home location). Avatar is NOT stored here — it lives on `users` as an FK.
- `user_preferences` — Display and UX preferences (language, currency, theme). 1:1 with `users`. See `design/preferences.md`.
- `user_nationalities` — User citizenships (1:many). Each record holds optional passport fields and a pre-computed `PassportStatus`. See `features/users.md`.
- `user_visas` — Visas per citizenship (1:many from `user_nationalities`). Carries coverage type, visa type, entries, expiry, and pre-computed `VisaStatus`. See `features/users.md`.
- `user_etas` — Electronic Travel Authorizations (1:many from `user_nationalities`). Tied to a specific passport number. See `features/users.md`.
- `support_admin_audit_log` — Immutable log of every write performed by a `SUPPORT_ADMIN` user. Records are never updated or deleted. See `features/users.md` and `infrastructure/auth.md`.
- `assets` — Normalized media records shared across entities. Columns: `id`, `type` (enum: `image | video | file | link | text`), `source` (enum: `gcs | url | emoji | text`), `target` (objectKey for GCS, full URL, emoji char, or plain text), `file_size` (bigint, GCS only), `is_public` (boolean), `created_at`. URLs are never stored — computed at read time by `AssetResolverService`. Scalar assets (avatar, cover image) are referenced by a direct FK on the entity. Collection assets (group resources, trip attachments) use a join table — see [Asset Collection Pattern](#asset-collection-pattern-post-mvp) below. **`type` describes the rendered output format, not the storage mechanism** — emoji covers use `type: 'image'` because they render as a PNG via the Twemoji CDN; `AssetResolverService` always dispatches on `source`, not `type`. The `source` enum carries the actual storage discriminant (`gcs`, `url`, `emoji`, `text`).

### Social / Community ✅ Implemented

- `groups` — Named collections of users. Holds visibility (PUBLIC/PRIVATE), cover asset FK, `cover_emoji`, and `deleted_at` for soft-delete.
- `group_members` — Composite PK `(group_id, user_id)`. Carries `GroupRole` (ADMIN/MEMBER) and `GroupMemberStatus` (PENDING_INVITATION / PENDING_REQUEST / ACTIVE / REJECTED). See `features/community.md`.
- `group_member_stats` — Per-member gamification stats within a specific group: tier, completed trips, seniority, streak. See `features/gamification.md` and `features/community.md`.
- `group_announcements` — Broadcast announcements created by group admins. Carries `content` (rich text), `group_id`, `created_by`, timestamps. Read-only feed for members; no reply mechanism. See `features/community.md`.

### Social / Community — Post-MVP spec

- `group_resources` — Notes, documents, and links attached to a group by its members. See `features/community.md`. (Issue #246)
- `conversations`, `messages`, `channels` — Slack-like messaging. Not active until post-MVP messaging is implemented. See `features/community.md`.

### Notifications ✅ Implemented

- `notifications` — Persistent in-app notification records per user. Columns: `id`, `user_id`, `type` (`notification_type` enum), `data` (JSONB payload with deep-link context), `read_at`, `created_at`. Indexed on `(user_id, created_at DESC)`.
- `notification_deliveries` — Delivery record per notification per channel. Columns: `id`, `notification_id`, `channel` (`PUSH | EMAIL | SMS`), `status` (`PENDING | SENT | FAILED`), `sent_at`, `error`, `created_at`. Enables per-channel retry and auditing.
- `user_fcm_tokens` — Composite PK `(user_id, token)`. Stores FCM registration tokens per device. Columns: `device_hint` (optional), `created_at`, `last_used_at`. See `features/notifications.md`.

### Trips — Post-MVP spec (Issues #343–#354)

- `trips` — The central entity. Holds metadata, status, settings.
- `trip_participants` — Users invited/confirmed on a trip. Carries attendance status, role, co-organizer permissions, and traveling flag.
- `trip_visible_to_groups` — Join table (`trip_id`, `group_id`). Defines which groups can discover a `PRIVATE` trip.
- `trip_role_invitations` — Pending invitations to assign `ORGANIZER` or `CO_ORGANIZER` role.
- `trip_destinations` — Ordered list of countries/cities visited on the trip.
- `trip_invite_links` — Shareable invite tokens with optional expiry and use cap.
- `trip_budget_items` — Planned costs defined by the organizer.
- `trip_notes` — Collaborative notes by confirmed participants.
- `trip_key_dates` — Important dates with optional FCM reminder.
- `trip_announcements` — Broadcast announcements from organizers to confirmed participants.
- `trip_guests` — Non-registered travelers sponsored by a confirmed participant.

See `features/trips.md` for full spec.

### Pre-Trip Planning — Post-MVP spec

- `pre_trip_tasks`, `pre_trip_task_completions`, `pre_trip_task_templates`, `trip_exchange_rates` — See `features/pre-trip-planning.md`.

### Itinerary — Post-MVP spec

- `itinerary_items`, `movements`, `stays`, `trip_room_groups`, `stay_room_groups`, `activities`, `reservations` — See `features/trips.md` and `features/reservations.md`.

### Expenses — Post-MVP spec

- `expenses`, `expense_payers`, `expense_splits`, `expense_settlements`, `trip_budget_item_optins` — See `features/expenses.md`.

### Gamification & Feedback — Post-MVP spec

- `user_stats`, `user_achievements`, `chamuco_point_transactions`, `recognitions` — See `features/gamification.md`.
- `trip_feedback`, `peer_feedback` — See `features/gamification.md`.

### Events — Post-MVP spec

- `events`, `event_attendees` — See `features/events.md`.

---

## JSONB Usage Examples

| Table           | JSONB Column         | Contents                                                            | Status         |
| --------------- | -------------------- | ------------------------------------------------------------------- | -------------- |
| `notifications` | `data`               | Deep-link payload: entity IDs, names, and routing context           | ✅ Implemented |
| `trips`         | `confirmation_rules` | Custom rules the organizer sets for confirming attendance           | Post-MVP       |
| `trips`         | `settings`           | Trip-level preferences (visibility, notification preferences, etc.) | Post-MVP       |
| `movements`     | `metadata`           | Carrier, flight number, seat info, booking reference                | Post-MVP       |
| `stays`         | `metadata`           | Check-in instructions, contact info, amenities                      | Post-MVP       |
| `activities`    | `details`            | Custom fields specific to the activity type                         | Post-MVP       |

---

## Asset Collection Pattern (Post-MVP)

Entities that own a **single** asset (user avatar, group cover, trip cover) hold a direct `UUID FK → assets.id` column on the entity table. Entities that own a **collection** of assets (group resources, trip attachments) use a dedicated join table that carries the relationship metadata.

### Design rules

- The `assets` table records only what the asset _is_ — type, source, target, size, visibility, creation time. It never carries context about who uploaded it, to which group, or in what order.
- Context belongs in the join table: who uploaded it, when, what it means within that collection (description, position, etc.).
- This separation ensures the same asset record can be re-referenced without duplication and storage accounting (`SUM(file_size)`) is always accurate via a JOIN.

### Projected schema — `group_assets` (example)

```sql
CREATE TABLE group_assets (
  group_id    UUID        NOT NULL REFERENCES groups(id)  ON DELETE CASCADE,
  asset_id    UUID        NOT NULL REFERENCES assets(id)  ON DELETE RESTRICT,
  description TEXT,
  position    INTEGER     NOT NULL,
  uploaded_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, asset_id)
);
```

Key decisions:

- **Composite PK `(group_id, asset_id)`** — enforces at the DB level that the same asset cannot appear twice in the same group. No separate `UNIQUE` constraint needed. A surrogate `id` is intentionally omitted: the domain rule is that an asset belongs to a group at most once, so the PK should reflect that invariant directly. If a future table needs to reference a specific `group_assets` row (e.g., `group_asset_comments`), add a surrogate key at that point.
- `ON DELETE RESTRICT` on `asset_id` — prevents deleting an asset that is still referenced by a group. The service must remove the `group_assets` row first, then delete the asset and its GCS object.
- `is_public = false` on all document assets — enforced in the service layer at creation, never inferred from the prefix.
- Storage limit check: `SELECT SUM(a.file_size) FROM group_assets ga JOIN assets a ON a.id = ga.asset_id WHERE ga.group_id = $1 AND a.source = 'gcs'`.
- Orphan detection (audit job): compare all `assets.target WHERE source = 'gcs'` against the GCS bucket listing; objects with no live reference are flagged for deletion.

The same pattern applies to `trip_assets`. The `assets` table schema requires no changes when new collection types are added — only a new join table and service logic.

---

## Naming Conventions

- Table names: `snake_case`, plural (e.g., `trip_participants`, `expense_splits`).
- Column names: `snake_case` (e.g., `created_at`, `trip_id`).
- Primary keys: `id` of type UUID (v4).
- Foreign keys: `{referenced_table_singular}_id` (e.g., `trip_id`, `user_id`).
- Enum columns: stored as `VARCHAR` with application-level validation via TypeScript enums.

---

## Indexes

To be defined per table as schemas are detailed. General rules:

- All foreign key columns get an index.
- Columns used in frequent `WHERE` or `ORDER BY` clauses get indexes.
- JSONB columns that are queried frequently use GIN indexes.
