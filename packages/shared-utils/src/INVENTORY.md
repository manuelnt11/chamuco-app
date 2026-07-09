# Inventory: src

---

## emoji-utils.ts

### Imports

- _(none)_

### Definitions

- `getTwemojiUrl` (function) — Converts an emoji character to a Twemoji CDN URL by mapping each code point to hex and joining with `-`.

### Exports

- `getTwemojiUrl` — named

---

## index.ts

### Imports

- `./emoji-utils` — barrel re-export of all emoji-utils exports

### Definitions

- `DOCUMENT_ID_FORMAT_REGEX` (const) — Regex that validates document IDs (national IDs, passport numbers, ETA auth numbers): uppercase letters, digits, and interior hyphens only; no leading/trailing hyphens.

### Exports

- `* from './emoji-utils'` — barrel re-export
- `DOCUMENT_ID_FORMAT_REGEX` — named
