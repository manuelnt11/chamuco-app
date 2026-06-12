# Chamuco API — AI Assistant Instructions

This file extends the root `CLAUDE.md` with rules specific to the `apps/api` NestJS package. Read the root `CLAUDE.md` first.

**Sub-package instructions** — read the relevant file when working in these directories:

- `src/database/CLAUDE.md` — Schema, migration workflow, Drizzle client, seeds, Drizzle Studio
- `src/i18n/CLAUDE.md` — Backend i18n: translation files, key conventions, interpolation syntax

---

## Module Structure

Feature code lives under `src/modules/`. Top-level modules own a domain; sub-resources live in named subdirectories with their own controller/service pair:

```
src/modules/
├── auth/                          ← authentication (Firebase token verification)
├── assets/                        ← asset resolution (signed download URLs)
├── cloud-storage/                 ← @Global() GCS service, no need to import elsewhere
├── feedback/                      ← GitHub issue creation
├── health/                        ← readiness probe
├── jobs/                          ← scheduled jobs (passport expiry, trip status)
├── locations/                     ← city search
├── notifications/
│   ├── channel-strategies/        ← push vs. in-app strategy implementations
│   └── dto/
├── transient-messages/            ← real-time toast payloads (FCM data messages)
│   └── channel-strategies/
├── uploads/                       ← signed URL generation
├── groups/
│   ├── announcements/             ← group-announcements controller + service
│   ├── discovery/                 ← public group search
│   ├── invitations/               ← outbound invitations
│   ├── join-requests/             ← inbound join requests
│   ├── members/                   ← member management
│   ├── dto/
│   └── schema/
├── trips/
│   ├── announcements/             ← trip-announcements controller + service
│   ├── destinations/              ← trip destinations
│   ├── groups/                    ← trip ↔ group associations
│   ├── invitations/               ← outbound invitations
│   ├── join-requests/             ← inbound join requests
│   ├── participants/              ← participant management
│   ├── dto/
│   └── schema/
└── users/
    ├── emergency-contacts/
    ├── health/                    ← blood type, dietary preferences, allergens, phobias
    ├── loyalty-programs/
    ├── preferences/               ← app language, theme, currency
    ├── profile/                   ← personal details, date of birth, nationalities
    ├── travel-docs/               ← passports, visas, ETAs
    ├── dto/
    └── schema/
```

**Sub-resource naming pattern:** `{parent}-{resource}.controller.ts` / `{parent}-{resource}.service.ts` (e.g. `group-members.controller.ts`, `users-travel-docs.service.ts`). Controller and service spec files sit alongside their implementation file.

**DTOs always live in a `dto/` subdirectory** of the module they belong to. Response DTOs that have a corresponding interface in `@chamuco/shared-types` must implement it:

```ts
import type { NotificationItem } from '@chamuco/shared-types';

export class NotificationResponseDto implements NotificationItem { ... }
```

This gives TypeScript a compile-time check that the DTO stays structurally compatible with the shared contract.

---

## Standing Rules

### 1. OpenAPI documentation on every backend change

Every NestJS controller endpoint must be fully documented with `@nestjs/swagger` decorators. When any of the following are modified:

- A controller method (new endpoint, changed path, changed HTTP method)
- A request DTO or response DTO
- An enum used in a request or response

Then verify and update:

- `@ApiTags`, `@ApiOperation`, `@ApiResponse` on the controller
- `@ApiProperty` on all DTO fields (type, description, example, required/optional)
- `@ApiBearerAuth()` if the endpoint requires authentication

No endpoint may be left without a summary (`@ApiOperation`), at least one `@ApiResponse`, and fully annotated DTO fields.

### 2. City fields — minimum length is 1

All city fields across all DTOs (`homeCity`, `birthCity`, `departure_city`, etc.) use **minimum length = 1** and maximum length = 100. The floor is 1 (not 2) because single-character city names are valid (e.g. "Å" in Norway). When adding a new city field:

- `@MinLength(1)` + `@MaxLength(100)` (or `@Length(1, 100)`)
- `@Matches(/^[\p{L}\s]+$/u)` — Unicode letters and spaces only, no digits or symbols
- `@Transform(({ value }) => sanitizeProperNoun(value))` — trims, collapses spaces, uppercases

### 3. Migration file on every schema change

When any Drizzle schema file (`*.schema.ts`) is modified — new table, new column, renamed column, dropped column, new index, constraint change — a migration file must be generated:

```bash
pnpm --filter db drizzle-kit generate
```

The generated `.sql` file must be committed alongside the schema change in the same PR. No schema change may be merged without its corresponding migration file. Destructive operations (column drops, renames) require a multi-step migration strategy — document the steps in the PR description.

### 4. File uploads — always go through CloudStorageService

All user-generated media uploads follow the signed URL pattern — never proxy file bytes through the API.

**Flow:**

1. Client calls `POST /v1/uploads/signed-url` with `uploadType`, `contextId`, `contentType`, `fileSize`.
2. Backend validates auth, content type, and size, then returns a short-lived signed PUT URL.
3. Client PUTs the file directly to GCS using that URL.
4. Client stores the returned `objectKey` in the database to later retrieve a signed download URL.

**Key files:**

- `src/modules/cloud-storage/cloud-storage.constants.ts` — `UploadType` re-export, size limits, allowed MIME types, object key prefixes, download TTLs
- `src/modules/cloud-storage/cloud-storage.service.ts` — `generateSignedUploadUrl`, `generateSignedDownloadUrl`, `deleteObject`, `isAllowedContentType`
- `src/modules/cloud-storage/cloud-storage.module.ts` — `@Global()` module, no need to import in feature modules
- `src/modules/uploads/uploads.controller.ts` — `POST /v1/uploads/signed-url` with `authorizeUpload` guard

**Authorization rules per `UploadType`:**

- `USER_AVATAR` — `contextId` must equal `user.id`
- `GROUP_COVER`, `GROUP_RESOURCE_DOCUMENT`, `TRIP_RESOURCE` — blocked with `ForbiddenException` until group/trip membership modules exist

**Adding a new upload type:**

1. Add value to `UploadType` enum in `packages/shared-types/src/enums/upload-type.enum.ts`
2. Add entries to all four `Record<UploadType, ...>` maps in `cloud-storage.constants.ts`
3. Add a case to `authorizeUpload` in `uploads.controller.ts` (TypeScript exhaustiveness check will fail to compile if you forget)
4. Add the accepted MIME types to `ACCEPTED_TYPES` in `apps/web/src/components/ui/file-upload-button.tsx`

**Runtime requirement:** `GOOGLE_CLOUD_STORAGE_BUCKET` env var must be set. Validated at startup by `environment.schema.ts`. For e2e tests, `test-bucket` is injected via `test/setup-env.ts`.
