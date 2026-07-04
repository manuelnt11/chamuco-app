# Chamuco Web — AI Assistant Instructions

This file extends the root `CLAUDE.md` with rules specific to the `apps/web` Next.js package. Read the root `CLAUDE.md` first.

---

## Language Rules — i18n

**No hardcoded user-facing strings.** Every visible text must use `i18next` `t()` references. Enforced by `eslint-plugin-i18next` at lint and CI level. This is a hard requirement, not a guideline.

### i18n Namespace Usage

**Configuration:**

- Location: `apps/web/src/lib/i18n/config.ts`
- Default namespace: `common`
- Available namespaces: `common`, `auth`, `trips`, `groups`, `profile`, `explore`, `feedback`, `errors`, `legal`
- Translation files: `apps/web/src/locales/{en|es}/{namespace}.json` — one file per namespace per language

**Namespace Rules:**

1. **When to use the default namespace (`common`):**
   - Shared UI elements across the entire app (navigation, actions, status messages)
   - Generic validation messages, time/date formatting
   - Home page and offline page content

   ```tsx
   // ✅ Correct - uses default 'common' namespace
   const { t } = useTranslation();

   <h1>{t('home.title')}</h1>              // resolves to common.home.title
   <button>{t('actions.save')}</button>    // resolves to common.actions.save
   ```

2. **When to use specific namespaces:**
   - Feature-specific pages use their own namespace
   - Auth flows use `auth`, error messages use `errors`

   ```tsx
   // ✅ Correct - trips page uses 'trips' namespace
   const { t } = useTranslation('trips');

   <h1>{t('title')}</h1>            // resolves to trips.title
   <span>{t('status.draft')}</span> // resolves to trips.status.draft
   ```

3. **What NOT to do:**

   ```tsx
   // ❌ WRONG - fully qualified key when namespace is set
   const { t } = useTranslation('trips');
   <h1>{t('trips.title')}</h1>  // looks in trips.trips.title (doesn't exist!)

   // ❌ WRONG - hardcoded strings
   <h1>Trips</h1>  // fails eslint-plugin-i18next check
   ```

4. **Cross-namespace references:**

   ```tsx
   // ✅ Correct - access multiple namespaces
   const { t } = useTranslation(['trips', 'common']);

   <h1>{t('title')}</h1>                        // from trips namespace
   <button>{t('common:actions.save')}</button>  // explicitly from common
   ```

5. **Validation** — always run after modifying translation keys:

   ```bash
   ./scripts/validate-i18n-keys.sh
   ```

**File Organization Pattern:**

```
apps/web/src/
├── app/
│   ├── trips/page.tsx            → useTranslation('trips')
│   ├── groups/page.tsx           → useTranslation('groups')
│   ├── explore/groups/page.tsx   → useTranslation('explore')
│   ├── profile/page.tsx          → useTranslation('profile')
│   ├── sign-in/page.tsx          → useTranslation('auth')
│   ├── privacy-policy/page.tsx   → useTranslation('legal')
│   ├── terms-of-service/page.tsx → useTranslation('legal')
│   └── page.tsx                  → useTranslation() = 'common'
├── components/
│   ├── navigation/               → useTranslation() = 'common'
│   ├── header/                   → useTranslation() = 'common'
│   └── feedback/                 → useTranslation('feedback')
└── locales/
    ├── en/{namespace}.json
    └── es/{namespace}.json       → mirrors en/ structure exactly
```

---

## Standing Rules

### 1. Frontend environment variables — three files must always stay in sync

All frontend environment variables are validated at startup by `apps/web/src/config/env.ts`. Adding a new `NEXT_PUBLIC_` variable requires updating **three files together** — missing any one causes a runtime crash or failing test:

| File                                   | What to do                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/config/env.constants.ts` | Add the key to the `REQUIRED_VARS` tuple                                                                                                         |
| `apps/web/src/config/env.ts`           | Add `KEY: process.env.KEY` to the `raw` object (literal access is required — Next.js does not replace `process.env[variable]` in client bundles) |
| `apps/web/src/config/env.test.ts`      | Add the key to `setAllEnv()` and `clearAllEnv()`, and update the `toEqual` assertion in "returns all env vars when all are set"                  |

Also update `.env.example` with the new key (empty value).

**Current required variables:**

| Variable                                   | Purpose                                                     |
| ------------------------------------------ | ----------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase client SDK                                         |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase client SDK                                         |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase client SDK                                         |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase client SDK + FCM service worker (`sw.template.js`) |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase client SDK                                         |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client SDK                                         |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`           | FCM Web Push VAPID key                                      |
| `NEXT_PUBLIC_API_URL`                      | NestJS API base URL (e.g. `http://localhost:3001` locally)  |

### 2. Validate i18n keys when modifying translations

When adding/modifying `t('key')` calls or editing translation files, run:

```bash
./scripts/validate-i18n-keys.sh
```

**The script validates:**

1. **Missing keys** — keys used in code but not in `locales/en/{namespace}.json`
2. **Translation parity** — keys in `en/` that don't exist in `es/`
3. **Unused keys** — keys in translation files not referenced in code

**Script limitations:** uses regex, not AST. Template literals (``t(`namespace.${variable}`)``) and dynamic key construction are not fully analyzed — the script whitelists all keys under the static prefix.

**Fix workflow:**

- Missing keys → add to `locales/en/{namespace}.json`
- Missing in `es` → translate and add to `locales/es/{namespace}.json`
- Unused keys — classify first:
  - **Pre-planned** (not yet built) → keep
  - **Dead** (code uses different key, or feature removed) → delete from both `en` and `es`
  - ~100 pre-planned keys currently exist across namespaces — expected, not a problem

The script exits with code 1 if any keys are missing, blocking commits.

### 3. File uploads — use FileUploadButton + useFileUpload

All user-generated media uploads use the signed URL infrastructure. Never upload through the API — always direct-to-GCS.

**Key files:**

- `src/components/ui/file-upload-button.tsx` — drop-in button with progress, error, retry
- `src/hooks/useFileUpload.ts` — fetches signed URL, drives XHR upload, exposes `upload`, `progress`, `isUploading`, `error`, `reset`
- `src/services/gcs-upload.ts` — low-level XHR PUT with progress events and 5-minute abort timeout
- `UploadType` enum imported from `@chamuco/shared-types`

**Usage:**

```tsx
import { FileUploadButton, UploadType } from '@/components/ui/file-upload-button';

<FileUploadButton
  uploadType={UploadType.USER_AVATAR}
  contextId={user.id}
  onSuccess={(objectKey) => saveAvatarKey(objectKey)}
  onError={(err) => console.error(err)}
/>;
```

**Error handling contract:**

- `useFileUpload` logs raw error to `console.error('[useFileUpload]', message)` and sets `error` state.
- `FileUploadButton` always shows `t('upload.errorDefault')` — never exposes the raw error to the user.
- Callers receive the original `Error` via `onError` for upstream handling.

**i18n keys** (all in `common` namespace under `upload.*`):
`upload.chooseFile`, `upload.uploading`, `upload.retry`, `upload.errorDefault`, `upload.progressLabel`

### 4. React event types — use the React 19 replacements, not FormEvent

`FormEvent` and `FormEventHandler` are **deprecated** in React 19. Use the specific React event types:

| Deprecated                          | Replacement                           |
| ----------------------------------- | ------------------------------------- |
| `FormEvent<HTMLFormElement>`        | `SubmitEvent<HTMLFormElement>`        |
| `FormEventHandler<HTMLFormElement>` | `SubmitEventHandler<HTMLFormElement>` |

```tsx
// ✅ Correct — React 19 SubmitEvent
import { type SubmitEvent } from 'react';
async function handleSave(e: SubmitEvent<HTMLFormElement>) { e.preventDefault(); }

// ❌ Wrong — FormEvent is deprecated in React 19
import { type FormEvent } from 'react';
async function handleSave(e: FormEvent<HTMLFormElement>) { ... }
```

Import from `'react'`, not from `lib.dom.d.ts`.

### 5. React imports — always use named imports

Next.js uses the automatic JSX transform. **Never use `import React from 'react'` or `import * as React from 'react'`**.

- Import only the specific APIs you need: `useState`, `useRef`, `type ComponentProps`, etc.
- Use `import type` (or the `type` modifier per-import) for type-only imports.
- Never reference `React.X` — always destructure.

```tsx
// ✅ Correct
import { useState, type ComponentProps, type ReactNode } from 'react';

// ❌ Wrong — never use these
import React from 'react';
import * as React from 'react';
// and never use React.useState, React.ComponentProps, etc.
```

**Exception:** `React.createElement` → use the named `createElement` import.

### 6. Never display raw user IDs — always use @username

Any user-facing string that references who performed an action must display `@username`, never a raw UUID.

```tsx
// ✅ Correct
t('announcementsPostedBy', { name: `@${a.createdByUsername}` });

// ❌ Wrong — UUID is meaningless to users
t('announcementsPostedBy', { name: a.createdBy });
```

If an API response returns only a user ID where a username is needed, that is a backend bug — fix the DTO to include `username`.

### 7. Iconic UI — prefer icons over text labels for actions

Action buttons with a clear icon equivalent should use icon-only with a `title` tooltip and `aria-label`. Avoid redundant text labels when context makes the action clear.

**Rules:**

- `title={t('...')}` + `aria-label={t('...')}` on icon buttons.
- `aria-hidden="true"` on the icon element itself.
- Use `p-2` padding (square) instead of `px-3 py-1.5` (wide) for icon-only buttons.
- Tooltip text still lives in i18n JSON — never hardcode.

```tsx
// ✅ Correct — icon button with tooltip
<Link
  href={`/groups/${group.id}/settings`}
  className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted"
  title={t('settings.title')}
  aria-label={t('settings.title')}
>
  <GearSixIcon className="size-5" aria-hidden="true" />
</Link>

// ❌ Wrong — text label when icon suffices
<Link href={`/groups/${group.id}/settings`} ...>
  {t('settings.title')}
</Link>
```

**When text labels ARE appropriate:** primary CTAs (create, save, submit), empty states, onboarding flows, or any action where the icon alone could be ambiguous.

### 8. Services layer — structure and type import conventions

API calls live in `src/services/`. Each domain follows this layout:

```
src/services/
├── {domain}.service.ts        ← API call functions (no React, no hooks)
├── {domain}.service.test.ts   ← unit tests with mocked apiClient
└── {domain}.types.ts          ← request/payload types local to this service
                                   omit if the service has no payload types
```

**Type ownership rules:**

| Type category                         | Where it lives          | Example                                      |
| ------------------------------------- | ----------------------- | -------------------------------------------- |
| API response shapes (shared with API) | `@chamuco/shared-types` | `NotificationItem`, `BulkInvitationResponse` |
| Request payloads / local DTOs         | `{domain}.types.ts`     | `RegisterPayload`, `FeedbackPayload`         |

**Never redefine in `{domain}.types.ts` a type that already exists in `@chamuco/shared-types`.** Import it directly.

**Never re-export `@chamuco/shared-types` types from a `.types.ts` file.** Consumers import from the package directly.

```ts
// ✅ Correct — response type from shared-types, payload type local
import type { FeedbackResponse } from '@chamuco/shared-types';
import type { FeedbackPayload } from '@/services/feedback.types';

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> { ... }

// ❌ Wrong — redefines a type that exists in shared-types
// feedback.types.ts
export interface FeedbackResponse { issueUrl: string; }  // duplicate, will diverge

// ❌ Wrong — re-exports shared-types through a local file
// feedback.types.ts
export type { FeedbackResponse } from '@chamuco/shared-types';  // pointless indirection
```

**Special files:**

- `api-client.ts` — configured Axios instance; all service files import from here
- `gcs-upload.ts` — low-level XHR PUT for direct GCS uploads; used by `useFileUpload`
- `places.service.ts` — city search, no `.types.ts` (response type `CityResult` is in shared-types)

---

## Standing Rule 9: Invitation redirect — never deep-link before acceptance

Redeeming an invitation token creates an `INVITED` record. The user is **not yet a member** until they explicitly accept. Never redirect to a specific trip (`/trips/:id/*`) or group (`/groups/:id/*`) page after redemption — the server will return 403 because membership is not confirmed.

After redeeming a token, always redirect to the **general list view** where pending invitations are visible:

| Context    | Redirect after redeem |
| ---------- | --------------------- |
| `trip`     | `/trips`              |
| `group`    | `/groups`             |
| `referral` | `/`                   |

This rule applies everywhere a token is redeemed: `/join` page, post-login hooks, and any future redemption entry point.
