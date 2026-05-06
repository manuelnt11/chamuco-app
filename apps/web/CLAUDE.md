# Chamuco Web — AI Assistant Instructions

This file extends the root `CLAUDE.md` with rules specific to the `apps/web` Next.js package. Read the root `CLAUDE.md` first.

---

## Language Rules — i18n

**No hardcoded user-facing strings.** Every visible text must use `i18next` `t()` references. Enforced by `eslint-plugin-i18next` at lint and CI level. This is a hard requirement, not a guideline.

### i18n Namespace Usage

**Configuration:**

- Location: `apps/web/src/lib/i18n/config.ts`
- Default namespace: `common`
- Available namespaces: `common`, `auth`, `trips`, `groups`, `profile`, `errors`
- Translation files: `apps/web/src/locales/{en|es}.json`

**Namespace Rules:**

1. **When to use the default namespace (`common`):**
   - Shared UI elements across the entire app (navigation, actions, status messages)
   - Generic validation messages
   - Time/date formatting
   - Home page content
   - Offline page content

   ```tsx
   // ✅ Correct - uses default 'common' namespace
   const { t } = useTranslation();

   <h1>{t('home.title')}</h1>              // resolves to common.home.title
   <button>{t('actions.save')}</button>    // resolves to common.actions.save
   <span>{t('navigation.trips')}</span>    // resolves to common.navigation.trips
   ```

2. **When to use specific namespaces:**
   - Feature-specific pages should use their own namespace
   - Each major section (trips, groups, profile, etc.) has its own namespace
   - Auth flows use the `auth` namespace
   - Error messages use the `errors` namespace

   ```tsx
   // ✅ Correct - trips page uses 'trips' namespace
   const { t } = useTranslation('trips');

   <h1>{t('title')}</h1>           // resolves to trips.title
   <p>{t('myTrips')}</p>           // resolves to trips.myTrips
   <span>{t('status.draft')}</span> // resolves to trips.status.draft
   ```

   ```tsx
   // ✅ Correct - groups page uses 'groups' namespace
   const { t } = useTranslation('groups');

   <h1>{t('title')}</h1>      // resolves to groups.title
   <p>{t('myGroups')}</p>     // resolves to groups.myGroups
   ```

3. **What NOT to do:**

   ```tsx
   // ❌ WRONG - using fully qualified keys when a namespace is available
   const { t } = useTranslation();
   <h1>{t('trips.title')}</h1>  // This will look in common.trips.title (doesn't exist!)

   // ❌ WRONG - using fully qualified keys with specific namespace
   const { t } = useTranslation('trips');
   <h1>{t('trips.title')}</h1>  // This will look in trips.trips.title (doesn't exist!)

   // ❌ WRONG - hardcoded strings
   <h1>Trips</h1>  // Fails eslint-plugin-i18next check
   ```

4. **Cross-namespace references:**

   If you need to reference keys from a different namespace within a component:

   ```tsx
   // ✅ Correct - access multiple namespaces
   const { t } = useTranslation(['trips', 'common']);

   <h1>{t('title')}</h1>                    // from trips namespace
   <button>{t('common:actions.save')}</button>  // explicitly from common namespace
   ```

5. **Validation:**

   Always run the i18n validation script after modifying translation keys:

   ```bash
   ./scripts/validate-i18n-keys.sh
   ```

   The script automatically detects the namespace from `useTranslation('namespace')` calls and validates that all keys exist in the corresponding JSON files.

**File Organization Pattern:**

```
apps/web/src/
├── app/
│   ├── trips/page.tsx        → useTranslation('trips')
│   ├── groups/page.tsx       → useTranslation('groups')
│   ├── profile/page.tsx      → useTranslation('profile')
│   └── page.tsx              → useTranslation() = 'common'
├── components/
│   ├── navigation/           → useTranslation() = 'common'
│   ├── header/               → useTranslation() = 'common'
│   └── layout/               → useTranslation() = 'common'
└── locales/
    ├── en.json               → { common: {...}, trips: {...}, groups: {...}, ... }
    └── es.json               → { common: {...}, trips: {...}, groups: {...}, ... }
```

**Key takeaway:** Match the `useTranslation()` namespace to the feature you're working in, and use keys relative to that namespace. The validation script enforces this convention.

---

## Standing Rules

### 1. Frontend environment variables — three files must always stay in sync

All frontend environment variables are validated at startup by `apps/web/src/config/env.ts`. Adding a new `NEXT_PUBLIC_` variable requires updating **three files together** — missing any one of them will cause either a runtime crash or a failing test:

| File                                   | What to do                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/config/env.constants.ts` | Add the key to the `REQUIRED_VARS` tuple                                                                                                         |
| `apps/web/src/config/env.ts`           | Add `KEY: process.env.KEY` to the `raw` object (literal access is required — Next.js does not replace `process.env[variable]` in client bundles) |
| `apps/web/src/config/env.test.ts`      | Add the key to `setAllEnv()` and `clearAllEnv()`, and update the `toEqual` assertion in "returns all env vars when all are set"                  |

Also update `.env.example` with the new key (empty value) so other developers know to set it.

**Current required variables:**

| Variable                                   | Purpose                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase client SDK                                        |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase client SDK                                        |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase client SDK                                        |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase client SDK                                        |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client SDK                                        |
| `NEXT_PUBLIC_API_URL`                      | NestJS API base URL (e.g. `http://localhost:3001` locally) |

### 2. Validate i18n keys when modifying translations

When any of the following changes are made to the frontend codebase:

- Adding or modifying `t('key')` calls in components
- Adding, removing, or modifying keys in translation files (`locales/en.json`, `locales/es.json`)
- Refactoring components that use i18n

**You must run the i18n validation script:**

```bash
./scripts/validate-i18n-keys.sh
```

**The script validates:**

1. **Missing keys** — Keys used in code (`t('key')`) but not defined in `en.json`
2. **Translation parity** — Keys in `en.json` that don't exist in `es.json`
3. **Unused keys** — Keys defined in translation files but not referenced in code (informational only)

**Key conventions:**

- The default namespace is `common` (configured in `apps/web/src/lib/i18n/config.ts`)
- When using `t('home.title')`, it resolves to `common.home.title` in the JSON
- For other namespaces, use explicit prefixes: `t('auth.signIn')`, `t('trips.title')`, `t('groups.members')`
- Never use hardcoded strings in user-facing components — use i18n keys instead
- Brand name "Chamuco" and proper nouns can have `eslint-disable-next-line i18next/no-literal-string` comments

**Fix workflow:**

- If keys are missing in `en.json`, add them to the appropriate namespace
- If keys are missing in `es.json`, translate and add them (maintain parity with `en.json`)
- If many unused keys are reported, it's informational — no action required unless keys are confirmed obsolete

**The script exits with code 1 if any keys are missing**, blocking commits via pre-commit hooks if integrated. All i18n keys must be valid before merging.

### 3. File uploads — use FileUploadButton + useFileUpload

All user-generated media uploads use the signed URL infrastructure. Never upload through the API — always direct-to-GCS.

**Key files:**

- `src/components/ui/file-upload-button.tsx` — drop-in trigger button with progress bar, error display, and retry
- `src/hooks/useFileUpload.ts` — fetches signed URL, drives XHR upload, exposes `upload`, `progress`, `isUploading`, `error`, `reset`
- `src/services/gcs-upload.ts` — low-level XHR PUT with progress events and 5-minute abort timeout
- `UploadType` enum imported from `@chamuco/shared-types` (re-exported by both `useFileUpload` and `file-upload-button`)

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

- `useFileUpload` logs the raw error to `console.error('[useFileUpload]', message)` and sets `error` state with the technical message.
- `FileUploadButton` always shows the localized `t('upload.errorDefault')` string — never exposes the raw error to the user.
- Callers receive the original `Error` object via `onError` for upstream handling.

**i18n keys** (all in `common` namespace under `upload.*`):

- `upload.chooseFile` — default button label
- `upload.uploading` — label while upload is in progress
- `upload.retry` — retry button label
- `upload.errorDefault` — user-facing error message
- `upload.progressLabel` — ARIA label for the progress bar (`Upload progress: {{progress}}%`)
