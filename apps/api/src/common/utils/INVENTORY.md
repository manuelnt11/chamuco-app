# Inventory: utils

---

## document-status.util.ts

### Imports

- `@chamuco/shared-types` — `DocumentStatus` enum (ACTIVE, EXPIRING_SOON, EXPIRED)

### Definitions

- `computeDocumentStatus` (function) — Derives a `DocumentStatus` from an ISO date string; returns EXPIRED if past today, EXPIRING_SOON if within 30 days, otherwise ACTIVE

### Exports

- `computeDocumentStatus` — named

---

## document-status.util.spec.ts

### Imports

- `@chamuco/shared-types` — `DocumentStatus` enum
- `./document-status.util` — `computeDocumentStatus` (unit under test)

### Definitions

- `dateOffset` (function) — Local test helper; builds an ISO date string offset by N days from today (UTC midnight)

### Exports

- _(none — test file)_

---

## i18n-content.utils.ts

### Imports

- _(none)_

### Definitions

- `toI18nPrefix` (function) — Converts a SCREAMING_SNAKE_CASE string to camelCase for use as an i18n key segment (e.g. `PASSPORT_EXPIRING_SOON` → `passportExpiringSoon`)
- `normalizeI18nArgs` (function) — Filters a `Record<string, unknown>` payload down to only primitive values (string, number, boolean) accepted by nestjs-i18n interpolation

### Exports

- `toI18nPrefix` — named
- `normalizeI18nArgs` — named

---

## i18n-content.utils.spec.ts

### Imports

- `./i18n-content.utils` — `normalizeI18nArgs`, `toI18nPrefix` (units under test)

### Definitions

- _(no substantial non-exported declarations)_

### Exports

- _(none — test file)_

---

## passport-status.util.ts

### Imports

- `@chamuco/shared-types` — `PassportStatus` enum (OMITTED, ACTIVE, EXPIRING_SOON, EXPIRED)

### Definitions

- `computePassportStatus` (function) — Derives a `PassportStatus` from an optional ISO date string; returns OMITTED if absent, EXPIRED if past today, EXPIRING_SOON if within 6 months, otherwise ACTIVE

### Exports

- `computePassportStatus` — named

---

## passport-status.util.spec.ts

### Imports

- `@chamuco/shared-types` — `PassportStatus` enum
- `@/common/utils/passport-status.util` — `computePassportStatus` (unit under test)

### Definitions

- `dateOffset` (function) — Local test helper; builds an ISO date string offset by N days from today (UTC midnight)

### Exports

- _(none — test file)_
