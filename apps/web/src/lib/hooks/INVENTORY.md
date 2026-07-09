# Inventory: hooks

---

## index.ts

### Imports

- `./useScrollDirection` — `useScrollDirection` hook

### Definitions

_No local definitions — barrel re-export only._

### Exports

- `useScrollDirection` — re-export (barrel re-export from `./useScrollDirection`)

---

## useScrollDirection.ts

### Imports

- `react` — `useState`, `useEffect`, `useRef` for state and lifecycle management

### Definitions

- `ScrollDirection` (type) — union `'up' | 'down' | 'idle'` representing scroll state
- `SCROLL_THRESHOLD` (const) — 8 px minimum delta before a direction change is registered
- `useScrollDirection` (hook) — tracks window scroll direction; returns `'up'`, `'down'`, or `'idle'`; handles iOS overscroll, uses `ResizeObserver` to keep max scroll position accurate, cleans up all listeners on unmount

### Exports

- `useScrollDirection` — named

---

## useScrollDirection.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` for test framework
- `@testing-library/react` — `renderHook`, `act` for hook rendering
- `./useScrollDirection` — `useScrollDirection` hook under test

### Definitions

_Test suite only — no exported definitions._

### Exports

_None._

---

## useSidebarCollapsed.ts

### Imports

- `react` — `useState`, `useEffect` for state and side effects
- `@/lib/sidebar-constants` — `SIDEBAR_STORAGE_KEY`, `SIDEBAR_EXPANDED_WIDTH`, `SIDEBAR_COLLAPSED_WIDTH` for localStorage key and CSS width values

### Definitions

- `useSidebarCollapsed` (hook) — manages sidebar collapsed/expanded state; reads initial value from `localStorage` on mount, syncs `--layout-sidebar-width` CSS variable on state change, persists toggled state back to `localStorage`; returns `{ collapsed, toggle }`

### Exports

- `useSidebarCollapsed` — named

---

## useSidebarCollapsed.test.ts

### Imports

- `@testing-library/react` — `renderHook`, `act` for hook rendering
- `vitest` — `describe`, `it`, `expect`, `beforeEach`, `afterEach`, `vi` for test framework
- `./useSidebarCollapsed` — `useSidebarCollapsed` hook under test
- `@/lib/sidebar-constants` — `SIDEBAR_STORAGE_KEY`, `SIDEBAR_COLLAPSED_WIDTH`, `SIDEBAR_EXPANDED_WIDTH` for assertion values

### Definitions

_Test suite only — no exported definitions._

### Exports

_None._
