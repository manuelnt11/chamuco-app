# Inventory: assets

---

## asset-resolver.service.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for building isolated NestJS test modules
- `./asset-resolver.service` — `AssetResolverService` (subject under test)
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` (mocked dependency)
- `@chamuco/shared-types` — `Asset` type used to construct test fixtures

### Definitions

- `BUCKET` (const) — mock GCS bucket name constant used in expected URL assertions
- `mockCloudStorage` (const) — mock implementation of `CloudStorageService` with `getPublicUrl` and `generateSignedDownloadUrl`

### Exports

- none

---

## asset-resolver.service.ts

### Imports

- `@nestjs/common` — `Injectable` decorator
- `@chamuco/shared-utils` — `getTwemojiUrl` to convert an emoji character to a Twemoji CDN URL
- `@chamuco/shared-types` — `Asset`, `ResolvedAsset` types
- `@/modules/cloud-storage/cloud-storage.constants` — `DOWNLOAD_TTL_SECONDS`, `OBJECT_KEY_TO_UPLOAD_TYPE` maps for TTL lookup by upload type
- `@/modules/cloud-storage/cloud-storage.service` — `CloudStorageService` for public URL generation and signed download URL generation

### Definitions

- `AssetResolverService` (service) — resolves an `Asset` record into a `ResolvedAsset` with a usable URL; handles four sources: `url` (passthrough), `emoji` (Twemoji CDN), `text` (passthrough), `gcs` (public URL or signed download URL with expiry)
- `resolveOne` (function) — private method that dispatches on `asset.source` and returns the appropriate `ResolvedAsset`

### Exports

- `AssetResolverService` — named

---

## asset.utils.ts

### Imports

- `@chamuco/shared-types` — `Asset` type (return type of the utility function)
- `./schema/assets.schema` — `assets` Drizzle schema table for `$inferSelect` row type

### Definitions

- `assetRowToAsset` (function) — maps a Drizzle `assets` table row to an `Asset` domain object, converting `createdAt` to ISO string and normalizing nullable `fileSize` to `undefined`

### Exports

- `assetRowToAsset` — named

---

## assets.module.ts

### Imports

- `@nestjs/common` — `Global`, `Module` decorators

### Definitions

- `AssetsModule` (module) — `@Global()` NestJS module that provides and exports `AssetResolverService` app-wide without requiring explicit imports in feature modules

### Exports

- `AssetsModule` — named
