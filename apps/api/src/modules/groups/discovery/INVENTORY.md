# Inventory: discovery

---

## groups-discovery.service.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `NotFoundException` for DI and HTTP errors
- `drizzle-orm` — `and`, `count`, `eq`, `ilike`, `inArray`, `isNull`, `notInArray` for query conditions
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupVisibility`, `MembershipStatus` enums and type
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token, `DrizzleClient` type
- `@/modules/assets/schema/assets.schema` — `assets` table reference
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` for resolving asset URLs
- `@/modules/assets/asset.utils` — `assetRowToAsset` converter utility
- `@/modules/groups/schema/groups.schema` — `groups` table reference
- `@/modules/groups/schema/group-members.schema` — `groupMembers` table reference
- `@/modules/groups/dto/group-response.dto` — `GroupResponseDto` return type
- `@/modules/groups/dto/search-groups-query.dto` — `SearchGroupsQueryDto` input type
- `@/modules/groups/dto/group-search-result.dto` — `GroupSearchResponseDto` return type

### Definitions

- `GroupsDiscoveryService` (service) — NestJS injectable service providing group discovery: lists a user's own active groups and searches all public groups with pagination, cover resolution, member counts, and per-user membership status

### Exports

- `GroupsDiscoveryService` — named

---

## groups-discovery.service.spec.ts

### Imports

- `@nestjs/common` — `NotFoundException` for assertion against thrown errors
- `@nestjs/testing` — `Test`, `TestingModule` for building the isolated test module
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupVisibility` enums for fixture data
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` injection token for mock provider
- `@/modules/assets/asset-resolver.service` — `AssetResolverService` for mock provider
- `./groups-discovery.service` — `GroupsDiscoveryService` unit under test
- `@/modules/groups/dto/search-groups-query.dto` — `SearchGroupsQueryDto` type for test inputs

### Definitions

- `mockCoverAssetRow` (const) — fixture representing a raw asset DB row with an emoji target
- `mockGroupRow` (const) — fixture representing a PUBLIC group DB row owned by `user-uuid`
- `mockOwnerMembership` (const) — fixture representing an ACTIVE OWNER membership row

### Exports

- none
