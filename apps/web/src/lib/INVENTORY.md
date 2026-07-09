# Inventory: lib

---

## auth-cookies.ts

### Imports

- (none — uses only `process.env`)

### Definitions

- `MAX_AGE` (const) — cookie lifetime in seconds (30 days); non-exported internal constant
- `isProd` (const) — boolean derived from `NODE_ENV`; drives cookie name prefix and Secure flag
- `SECURE` (const) — appends `; Secure` in production, empty string in development
- `BASE` (const) — shared cookie attribute string (`path=/; SameSite=Strict` + SECURE)

### Exports

- `COOKIE_CHAMUCO_AUTH_NAME` — named; cookie name with `__Host-` prefix in prod, plain in dev
- `COOKIE_CHAMUCO_AUTH_SET` — named; full `Set-Cookie` header value to establish the auth cookie (Max-Age=30d)
- `COOKIE_CHAMUCO_AUTH_CLEAR` — named; full `Set-Cookie` header value to expire the auth cookie (Max-Age=0)
- `COOKIE_CHAMUCO_REGISTERED_NAME` — named; same prefix logic for the "registered" cookie
- `COOKIE_CHAMUCO_REGISTERED_SET` — named; full `Set-Cookie` value to establish the registered cookie
- `COOKIE_CHAMUCO_REGISTERED_CLEAR` — named; full `Set-Cookie` value to expire the registered cookie

---

## avatar-emojis.ts

### Imports

- (none)

### Definitions

- (none beyond the exported constant)

### Exports

- `AVATAR_EMOJIS` — named; string array of ~80 emoji covering faces, travel, nature, activities, and food/culture categories for avatar selection

---

## countries.test.ts

### Imports

- `vitest` — `describe`, `expect`, `it`, `vi` for test runner and assertions
- `libphonenumber-js` — mocked via `vi.mock`; stubs `getCountries` and `getCountryCallingCode`
- `./countries` — `buildCountryList`, `getCallingCodePrefix`, `getCountryName`, `getEmojiFlag`, `isoByCallingCode` under test

### Definitions

- (test file — no exported definitions)

### Exports

- (none)

---

## countries.ts

### Imports

- `libphonenumber-js` — `getCountries`, `getCountryCallingCode`, `CountryCode`; provides ISO2 country list and dial codes

### Definitions

- `DIAL_CODE_PRIMARY` (const) — map of shared dial codes to their canonical country (e.g. `'1' → 'US'`); resolves ambiguity for NANP and other shared prefixes
- `CALLING_CODE_TO_ISO2` (const) — `Map<string, CountryCode>` built at module load; first-wins with primary overrides applied; powers `isoByCallingCode`

### Exports

- `CountryCode` — re-export (from `libphonenumber-js`)
- `CountryEntry` — named; interface with `iso2: CountryCode`, `name: string`, `dialCode: string`
- `getEmojiFlag` — named; function; converts ISO2 code to regional indicator emoji flag
- `getCountryName` — named; function; returns uppercased localized country name via `Intl.DisplayNames`, falls back to ISO2
- `getCallingCodePrefix` — named; function; returns `+<dialCode>` string for a given ISO2, empty string on error
- `isoByCallingCode` — named; function; reverse-lookup `CountryCode` from a dial code string using the prebuilt map
- `buildCountryList` — named; function; returns sorted `CountryEntry[]` for all countries, localized by the given locale string

---

## i18n.ts

### Imports

- `i18next` — `i18n`; core i18next instance
- `react-i18next` — `initReactI18next`; React binding plugin
- `i18next-http-backend` — `HttpBackend`; loads translation JSON files over HTTP

### Definitions

- (no named declarations beyond the configuration side-effect)

### Exports

- `i18n` (default) — configured i18next instance; supports `en`/`es`, namespaces `common|auth|trips|groups`, loads from `/locales/{{lng}}/{{ns}}.json`

---

## name-utils.ts

### Imports

- (none)

### Definitions

- (no non-exported substantial declarations)

### Exports

- `NAME_REGEX` — named; const `RegExp`; matches strings containing only Unicode letters and whitespace (`/^[\p{L}\s]+$/u`)
- `normalizeName` — named; function; trims and collapses internal whitespace to single spaces
- `humanizeId` — named; function; converts underscore-separated identifiers (e.g. enum values) to title-case words
- `getInitials` — named; function; extracts up to two uppercase initials from a space-separated name

---

## sidebar-constants.ts

### Imports

- (none)

### Definitions

- (no non-exported declarations)

### Exports

- `SIDEBAR_EXPANDED_WIDTH` — named; const string; CSS width value for expanded sidebar (`10rem`)
- `SIDEBAR_COLLAPSED_WIDTH` — named; const string; CSS width value for collapsed sidebar (`3.5rem`)
- `SIDEBAR_STORAGE_KEY` — named; const string; `localStorage` key for persisting collapsed state (`sidebar-collapsed`)

---

## timezones.ts

### Imports

- (none — uses only `Intl` globals)

### Definitions

- `FALLBACK_TIMEZONES` (const) — non-exported array of ~65 IANA timezone strings used when `Intl.supportedValuesOf` is unavailable

### Exports

- `TIMEZONES` — named; `readonly string[]`; full IANA timezone list from `Intl.supportedValuesOf('timeZone')`, falling back to the hardcoded list
- `COUNTRY_TIMEZONE` — named; `Record<string, string>`; maps ISO2 country codes to a representative IANA timezone (50+ entries)
- `formatTimezoneLabel` — named; function; formats a timezone string as `"Region/City UTC+X"` using `Intl.DateTimeFormat`, returns raw name on error

---

## url-utils.ts

### Imports

- (none)

### Definitions

- (no non-exported declarations)

### Exports

- `sanitizeReturnTo` — named; function; validates a `returnTo` query-param value is a safe same-origin path (starts with `/`, not `//`), returns `'/'` for invalid or external values

---

## utils.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect`; test runner
- `./utils` — `cn`, `formatDate` under test

### Definitions

- (test file — no exported definitions)

### Exports

- (none)

---

## utils.ts

### Imports

- `clsx` — `clsx`, `ClassValue`; conditionally joins class name strings
- `tailwind-merge` — `twMerge`; deduplicates conflicting Tailwind utility classes

### Definitions

- (no non-exported substantial declarations)

### Exports

- `cn` — named; function; merges and deduplicates Tailwind CSS class names (wraps `clsx` + `twMerge`)
- `formatDate` — named; function; formats a `Date` as a long locale string (`year`, `month long`, `day`) using `Intl.DateTimeFormat`; defaults to `en-US`
