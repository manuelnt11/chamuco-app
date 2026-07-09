# Inventory: cloud-storage

---

## cloud-storage.constants.ts

### Imports

- `@chamuco/shared-types` — `UploadType` enum used as Record key throughout

### Definitions

- `UPLOAD_SIZE_LIMITS_BYTES` (const) — max file size in bytes per `UploadType` (2 MB avatar, 5 MB covers, 20 MB documents/resources)
- `ALLOWED_CONTENT_TYPES` (const) — allowed MIME type arrays per `UploadType`
- `OBJECT_KEY_PREFIXES` (const) — GCS key prefix strings per `UploadType` (e.g. `avatars`, `group-covers`)
- `DOWNLOAD_TTL_SECONDS` (const) — signed download URL TTL per `UploadType` (7 days for images, 1 hour for documents)
- `UPLOAD_URL_TTL_SECONDS` (const) — signed upload URL TTL: 15 minutes, shared across all types
- `OBJECT_KEY_TO_UPLOAD_TYPE` (const) — reverse lookup from GCS key prefix string to `UploadType`
- `PUBLIC_OBJECT_PREFIXES` (const) — `ReadonlySet<string>` of prefixes whose objects are publicly readable (`avatars`, `group-covers`, `trip-covers`)

### Exports

- `UploadType` — re-export (re-export from `@chamuco/shared-types`)
- `UPLOAD_SIZE_LIMITS_BYTES` — named
- `ALLOWED_CONTENT_TYPES` — named
- `OBJECT_KEY_PREFIXES` — named
- `DOWNLOAD_TTL_SECONDS` — named
- `UPLOAD_URL_TTL_SECONDS` — named
- `OBJECT_KEY_TO_UPLOAD_TYPE` — named
- `PUBLIC_OBJECT_PREFIXES` — named

---

## cloud-storage.module.ts

### Imports

- `@nestjs/common` — `Global`, `Module` decorators

### Definitions

- `CloudStorageModule` (module) — `@Global()` NestJS module that provides and exports `CloudStorageService`; once registered in `AppModule`, no other module needs to import it

### Exports

- `CloudStorageModule` — named

---

## cloud-storage.service.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for unit test module setup
- `@nestjs/config` — `ConfigService` (mocked)
- `./cloud-storage.service` — `CloudStorageService` (subject under test)
- `./cloud-storage.constants` — `ALLOWED_CONTENT_TYPES`, `DOWNLOAD_TTL_SECONDS`, `OBJECT_KEY_PREFIXES`, `UPLOAD_URL_TTL_SECONDS`, `UploadType`

### Definitions

- `CloudStorageService` test suite — covers `generateSignedUploadUrl` (URL shape, prefix routing, expiry timing, signed URL options, content-type-to-extension mapping), `generateSignedDownloadUrl` (read action, TTL per type), `deleteObject` (calls delete with `ignoreNotFound`), `makePublic` (delegates to GCS file), `isAllowedContentType` (allow-list and reject cases); `@google-cloud/storage` is fully mocked via `jest.mock`

### Exports

- _(none — test file, no exports)_

---

## cloud-storage.service.ts

### Imports

- `@nestjs/common` — `Injectable` decorator
- `@nestjs/config` — `ConfigService` for reading `GOOGLE_CLOUD_STORAGE_BUCKET` and optional `GOOGLE_CLOUD_KEY_FILE`
- `@google-cloud/storage` — `Storage` GCS client
- `crypto` — `randomUUID` for generating unique object key segments
- `./cloud-storage.constants` — `ALLOWED_CONTENT_TYPES`, `DOWNLOAD_TTL_SECONDS`, `OBJECT_KEY_PREFIXES`, `UPLOAD_URL_TTL_SECONDS`, `UploadType`

### Definitions

- `SignedUploadUrlResult` (interface) — shape returned by `generateSignedUploadUrl`: `{ uploadUrl, objectKey, expiresAt }`
- `CloudStorageService` (service) — injectable service wrapping `@google-cloud/storage`; initialises `Storage` with optional key file; exposes:
  - `generateSignedUploadUrl(uploadType, contextId, contentType)` — builds a GCS object key, generates a short-lived signed PUT URL, returns `SignedUploadUrlResult`
  - `generateSignedDownloadUrl(objectKey, uploadType)` — generates a signed GET URL with a TTL derived from `DOWNLOAD_TTL_SECONDS`
  - `deleteObject(objectKey)` — deletes a GCS object with `ignoreNotFound: true`
  - `makePublic(objectKey)` — makes a GCS object publicly readable
  - `isAllowedContentType(uploadType, contentType)` — checks MIME against `ALLOWED_CONTENT_TYPES`
  - `getPublicUrl(objectKey)` — returns the canonical `https://storage.googleapis.com/<bucket>/<key>` URL
  - `extractObjectKey(url)` — extracts the object key from a public GCS URL, returns `null` if URL does not match the bucket
  - `extensionFromContentType(contentType)` _(private)_ — maps MIME type to file extension string

### Exports

- `SignedUploadUrlResult` — named
- `CloudStorageService` — named
