# Inventory: navigation

---

## index.ts

### Imports

- `./utils` — `isActiveRoute`, `getNavItemAriaLabel`

### Definitions

_(no local definitions — barrel re-export only)_

### Exports

- `isActiveRoute` — re-export (barrel re-export from `./utils`)
- `getNavItemAriaLabel` — re-export (barrel re-export from `./utils`)

---

## utils.ts

### Imports

_(no imports)_

### Definitions

- `isActiveRoute` (function) — returns true if the current pathname matches a nav item path; exact match for `'/'`, prefix match (guarded with trailing slash) for all other paths
- `getNavItemAriaLabel` (function) — builds an accessible aria-label string for a nav item, appending `"(current page)"` when active and a pending-invitations count when a badge value is provided

### Exports

- `isActiveRoute` — named
- `getNavItemAriaLabel` — named

---

## path-mapping.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect`
- `@/lib/navigation` — `isActiveRoute`, `getNavItemAriaLabel` (path-alias smoke test)

### Definitions

_(test file — no exported declarations)_

### Exports

_(none)_

---

## utils.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect`
- `./utils` — `isActiveRoute`, `getNavItemAriaLabel`

### Definitions

_(test file — no exported declarations)_

### Exports

_(none)_
