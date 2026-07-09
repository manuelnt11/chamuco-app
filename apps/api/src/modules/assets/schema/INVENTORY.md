# Inventory: schema

---

## assets.schema.ts

### Imports

- `drizzle-orm/pg-core` — `pgEnum`, `pgTable`, `uuid`, `text`, `bigint`, `boolean`, `timestamp` for defining PostgreSQL schema objects

### Definitions

- `assetTypeEnum` (const) — PostgreSQL enum `asset_type` with values: `image`, `video`, `file`, `link`, `text`
- `assetSourceEnum` (const) — PostgreSQL enum `asset_source` with values: `gcs`, `url`, `emoji`, `text`
- `assets` (const) — Drizzle table definition for `assets`; columns: `id` (UUID PK), `type` (assetTypeEnum), `source` (assetSourceEnum), `target` (text), `fileSize` (bigint, nullable), `isPublic` (boolean, default false), `createdAt` (timestamptz, default now)

### Exports

- `assetTypeEnum` — named
- `assetSourceEnum` — named
- `assets` — named
