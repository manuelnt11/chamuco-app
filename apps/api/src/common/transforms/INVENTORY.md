# Inventory: transforms

---

## name.transform.ts

### Imports

- (none)

### Definitions

- `sanitizeUpperCase` (function) — Converts a string value to uppercase; passes non-string values through unchanged.
- `sanitizeProperNoun` (function) — Trims whitespace, collapses internal spaces, and uppercases a string; used for person name fields (first name, last name, city names).
- `sanitizeName` (function) — Trims whitespace and collapses internal spaces while preserving original casing; used for group/trip names and similar free-text name fields.

### Exports

- `sanitizeUpperCase` — named
- `sanitizeProperNoun` — named
- `sanitizeName` — named

---

## name.transform.spec.ts

### Imports

- `./name.transform` — `sanitizeName`, `sanitizeProperNoun`, `sanitizeUpperCase` (functions under test)

### Definitions

- (test file — no exportable definitions)

### Exports

- (none)
