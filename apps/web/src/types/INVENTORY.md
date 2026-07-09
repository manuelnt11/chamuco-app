# Inventory: types

---

## group.ts

### Imports

- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `GroupVisibility`, `MembershipStatus` (shared enums/types for group domain)

### Definitions

- `Group` (interface) — shape of a group entity with id, name, description, cover URL, visibility, creator, and timestamps
- `GroupMember` (interface) — shape of an active group member with user identity fields, role, tier, and join date
- `PendingGroupMember` (interface) — shape of a member with a pending REQUEST or INVITED status and initiation timestamp
- `GroupInvitation` (interface) — shape of an invitation record containing a nested group summary and initiation timestamp
- `GroupSearchResult` (interface) — extends `Group` with `memberCount` and `membershipStatus` for search result rows
- `GroupSearchResponse` (interface) — paginated wrapper for `GroupSearchResult` arrays with a total count
- `GroupAnnouncement` (interface) — shape of a group announcement with id, groupId, author username, content, and timestamps
- `GroupAnnouncementsResponse` (interface) — paginated wrapper for `GroupAnnouncement` arrays with a total count

### Exports

- `Group` — named
- `GroupMember` — named
- `PendingGroupMember` — named
- `GroupInvitation` — named
- `MembershipStatus` — named (re-export from `@chamuco/shared-types`)
- `GroupSearchResult` — named
- `GroupSearchResponse` — named
- `GroupAnnouncement` — named
- `GroupAnnouncementsResponse` — named

---

## user.ts

### Imports

- `@chamuco/shared-types` — `ResolvedAsset` (resolved asset shape including URL and metadata)

### Definitions

- `UserSearchResult` (interface) — shape of a user search result with id, username, displayName, and nullable avatar
- `UserSearchResponse` (interface) — paginated wrapper for `UserSearchResult` arrays with a total count

### Exports

- `UserSearchResult` — named
- `UserSearchResponse` — named
