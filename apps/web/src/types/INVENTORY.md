# Inventory: types

---

## `group.ts`

### Imports

- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `GroupVisibility` (enums/types used in interface fields)

### Definitions

- `Group` (interface) — core group entity with id, name, description, cover URL, visibility, ownership, and timestamps
- `GroupMember` (interface) — active group member with role, tier, and join timestamp
- `PendingGroupMember` (interface) — member with `REQUEST` or `INVITED` status awaiting resolution
- `GroupInvitation` (interface) — pending invitation carrying minimal group info and initiation timestamp
- `GroupAnnouncement` (interface) — group announcement post with content, author username, and timestamps
- `GroupAnnouncementsResponse` (interface) — paginated response wrapper for a list of group announcements

### Exports

- `GroupSearchResult` — barrel re-export from `@chamuco/shared-types`
- `GroupSearchResponse` — barrel re-export from `@chamuco/shared-types`
- `MembershipStatus` — barrel re-export from `@chamuco/shared-types`
- `Group` — named
- `GroupMember` — named
- `PendingGroupMember` — named
- `GroupInvitation` — named
- `GroupAnnouncement` — named
- `GroupAnnouncementsResponse` — named

---

## `user.ts`

### Imports

- none

### Definitions

- none

### Exports

- `UserSearchResult` — barrel re-export from `@chamuco/shared-types`
- `UserSearchResponse` — barrel re-export from `@chamuco/shared-types`
