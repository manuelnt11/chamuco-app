# Inventory: dto

---

## resolved-asset.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` decorator for OpenAPI field documentation
- `@chamuco/shared-types` — `ResolvedAsset` interface implemented by the DTO

### Definitions

- `ResolvedAssetDto` (class) — Response DTO representing a fully resolved asset record; implements the shared `ResolvedAsset` contract and exposes `id`, `type`, `source`, `target`, `fileSize`, `isPublic`, `createdAt`, `url`, and optional `expiresAt` fields with full OpenAPI annotations

### Exports

- `ResolvedAssetDto` — named
