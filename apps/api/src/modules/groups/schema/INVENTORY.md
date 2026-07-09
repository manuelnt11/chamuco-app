# Inventory: schema

---

## group-announcements.schema.ts

### Imports

- `drizzle-orm` — `relations` for defining ORM relationship descriptors
- `drizzle-orm/pg-core` — `index`, `pgTable`, `text`, `timestamp`, `uuid` for table and column definitions
- `@/modules/groups/schema/groups.schema` — `groups` table reference for FK
- `@/modules/users/schema/users.schema` — `users` table reference for FK

### Definitions

- `groupAnnouncements` (const) — Drizzle table for `group_announcements`; UUID PK, `group_id` FK → groups, `created_by` FK → users, `content` text, timestamps; composite index on `(group_id, created_at)`
- `groupAnnouncementsRelations` (const) — Drizzle relations descriptor; `group` (one → groups) and `creator` (one → users)

### Exports

- `groupAnnouncements` — named
- `groupAnnouncementsRelations` — named

---

## group-member-stats.schema.ts

### Imports

- `drizzle-orm` — `relations` for ORM relationship descriptors
- `drizzle-orm/pg-core` — `integer`, `pgEnum`, `pgTable`, `primaryKey`, `timestamp`, `uuid` for table, enum, and column definitions
- `@chamuco/shared-types` — `GroupMemberTier` enum for tier values
- `@/modules/groups/schema/groups.schema` — `groups` table reference for FK
- `@/modules/users/schema/users.schema` — `users` table reference for FK

### Definitions

- `groupMemberTierEnum` (const) — Drizzle pgEnum for `group_member_tier`; values from `GroupMemberTier` (NEWCOMER, NOVICE, EXPLORER, VETERAN)
- `groupMemberStats` (const) — Drizzle table for `group_member_stats`; composite PK `(group_id, user_id)`, `tier` enum, `group_trips_completed`, `joined_at`, `active_streak`, `updated_at`
- `groupMemberStatsRelations` (const) — Drizzle relations descriptor; `group` (one → groups) and `user` (one → users)

### Exports

- `groupMemberTierEnum` — named
- `groupMemberStats` — named
- `groupMemberStatsRelations` — named

---

## group-members.schema.ts

### Imports

- `drizzle-orm` — `relations` for ORM relationship descriptors
- `drizzle-orm/pg-core` — `index`, `pgEnum`, `pgTable`, `primaryKey`, `timestamp`, `uuid` for table, enum, and column definitions
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole` enums for status and role values
- `@/modules/groups/schema/groups.schema` — `groups` table reference for FK
- `@/modules/users/schema/users.schema` — `users` table reference for FK

### Definitions

- `groupMemberStatusEnum` (const) — Drizzle pgEnum for `group_member_status`; values from `GroupMemberStatus` (REQUEST, INVITED, ACTIVE, REJECTED, REMOVED, LEFT)
- `groupRoleEnum` (const) — Drizzle pgEnum for `group_role`; values from `GroupRole` (OWNER, ADMIN, MEMBER)
- `groupMembers` (const) — Drizzle table for `group_members`; composite PK `(group_id, user_id)`, `status` enum, `role` enum (default MEMBER), `initiated_at`, `responded_at`, `initiated_by` FK → users, `decided_by` FK → users; indexes on `(user_id, status)` and `(group_id, status)`
- `groupMembersRelations` (const) — Drizzle relations descriptor; `group` (one → groups), `user` (one → users), `initiator` (one → users, named), `decider` (one → users, named)

### Exports

- `groupMemberStatusEnum` — named
- `groupRoleEnum` — named
- `groupMembers` — named
- `groupMembersRelations` — named

---

## groups.schema.ts

### Imports

- `drizzle-orm` — `relations` for ORM relationship descriptors
- `drizzle-orm/pg-core` — `pgEnum`, `pgTable`, `text`, `timestamp`, `uuid`, `varchar` for table, enum, and column definitions
- `@chamuco/shared-types` — `GroupVisibility` enum for visibility values
- `@/modules/assets/schema/assets.schema` — `assets` table reference for cover FK
- `@/modules/users/schema/users.schema` — `users` table reference for FK

### Definitions

- `groupVisibilityEnum` (const) — Drizzle pgEnum for `group_visibility`; values from `GroupVisibility` (PUBLIC, PRIVATE)
- `groups` (const) — Drizzle table for `groups`; UUID PK, `name` varchar(100), `description` text, `cover` UUID FK → assets (nullable), `visibility` enum, `created_by` FK → users, `created_at`, `updated_at`, `deleted_at` (soft-delete)
- `groupsRelations` (const) — Drizzle relations descriptor; `coverAsset` (one → assets) and `creator` (one → users)

### Exports

- `groupVisibilityEnum` — named
- `groups` — named
- `groupsRelations` — named
