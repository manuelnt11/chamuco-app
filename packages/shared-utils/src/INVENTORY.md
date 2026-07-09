# Inventory: src

---

## `date-utils.ts`

### Imports

_None_

### Definitions

- `isValidCalendarDay` (function) — validates that a given day/month/year combination forms a real calendar date
- `computeAge` (function) — computes a person's age in years from their birth day, month, and year

### Exports

- `isValidCalendarDay` — named
- `computeAge` — named

---

## `emoji-utils.ts`

### Imports

_None_

### Definitions

- `getTwemojiUrl` (function) — converts an emoji character to a Twemoji CDN URL (WhatsApp variant via realityripple mirror)

### Exports

- `getTwemojiUrl` — named

---

## `index.ts`

### Imports

_None (barrel only)_

### Definitions

- `DOCUMENT_ID_FORMAT_REGEX` (const) — regex enforcing uppercase-letters/digits with optional interior hyphens; no leading or trailing hyphens; used for national IDs, passport numbers, and ETA authorization numbers

### Exports

- `date-utils.ts` exports — barrel re-export
- `emoji-utils.ts` exports — barrel re-export
- `DOCUMENT_ID_FORMAT_REGEX` — named
