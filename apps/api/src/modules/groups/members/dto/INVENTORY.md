# Inventory: dto

---

## member-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `GroupMemberTier`, `GroupRole` enums for role and tier typing

### Definitions

- `MemberResponseDto` (class) — Response shape for a group member, including identity fields (userId, username, displayName, avatarUrl), role, tier, and joinedAt timestamp

### Exports

- `MemberResponseDto` — named

---

## my-membership-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole` enums for status and role typing

### Definitions

- `MyMembershipResponseDto` (class) — Response shape for the authenticated user's own group membership, exposing only status and role

### Exports

- `MyMembershipResponseDto` — named

---

## pending-item-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `GroupMemberStatus` enum for restricting status to REQUEST or INVITED values

### Definitions

- `PendingItemResponseDto` (class) — Response shape for a pending group membership item (join request or invitation), including identity fields (userId, username, displayName, avatarUrl), status (REQUEST | INVITED), and initiatedAt timestamp

### Exports

- `PendingItemResponseDto` — named

---

## update-member-role.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `class-validator` — `IsEnum` for runtime validation of the role value
- `@chamuco/shared-types` — `GroupRole` enum for allowed role values

### Definitions

- `UpdateMemberRoleDto` (class) — Request body DTO for updating a group member's role; validates that the provided role is a valid `GroupRole` enum value

### Exports

- `UpdateMemberRoleDto` — named
