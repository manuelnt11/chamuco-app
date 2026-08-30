# Inventory: layout

---

## AppShell.tsx

### Imports

- `react` — `ReactNode` (children prop type)
- `next/navigation` — `usePathname` (reads current route to detect auth/no-chrome pages)
- `@/components/header` — `Header` (top navigation bar)
- `@/components/navigation` — `MobileBottomNav`, `DesktopSideNav` (responsive nav chrome)
- `@/store/group-invitations` — `GroupInvitationsProvider` (context provider for group invitation state)
- `@/store/trip-invitations` — `TripInvitationsProvider` (context provider for trip invitation state)
- `./AppWallpaper` — `AppWallpaper` (desktop gutter wallpaper behind the shell)

### Definitions

- `NO_CHROME_PATHS` (const) — Array of route prefixes (`/sign-in`, `/onboarding`, `/privacy-policy`, `/terms-of-service`, `/account-deletion`) that render without nav chrome
- `AppShellProps` (interface) — Props shape for `AppShell`; single `children: ReactNode` field
- `AppShell` (component) — Root layout shell; conditionally renders AppWallpaper, Header, DesktopSideNav, MobileBottomNav, and invitation providers for standard pages; renders a bare `<main>` for auth/legal pages matched by `NO_CHROME_PATHS`

### Exports

- `AppShell` — named

---

## AppWallpaper.tsx

### Imports

- `react` — `useEffect`, `useMemo`, `useState`
- `@phosphor-icons/react` — `AirplaneTiltIcon`, `MapPinIcon`, `CompassIcon`, `UsersThreeIcon`, `SuitcaseRollingIcon`, `GlobeHemisphereWestIcon`, `TentIcon`, `BackpackIcon`, `CameraIcon`, `IslandIcon`, `BinocularsIcon`, `MountainsIcon`, `MapTrifoldIcon`, `UmbrellaIcon` (travel/group icon set for the pattern)

### Definitions

- `WALLPAPER_ICONS` (const) — Ordered array of the travel/group icon components used to build the pattern
- `ROTATIONS` (const) — Fixed set of Tailwind rotation classes
- `SIZES` (const) — Fixed set of Tailwind `size-*` classes for per-tile icon size variety
- `JITTERS` (const) — Fixed set of small Tailwind translate classes for per-tile position variety
- `hash` (function) — Deterministic integer hash (SSR-safe — no `Math.random`/`Date.now`) used to pick each tile's icon/rotation/size/jitter independently
- `TILE_SIZE` (const) — Pixel size of one grid cell (72); must match the `grid-cols`/`auto-rows` classes on the pattern grid
- `DESKTOP_BREAKPOINT` (const) — Tailwind's `md` breakpoint (768); below this the hook reports 0 tiles so the pattern never mounts on mobile
- `BUFFER_ROWS` (const) — Extra rows added to the computed row count so a stale measurement still overflows the viewport rather than under-filling it
- `useWallpaperTileCount` (hook) — Measures `window.innerWidth`/`innerHeight` on mount and on `resize` to compute exactly how many tiles are needed to cover the current viewport at `TILE_SIZE` (0 below `DESKTOP_BREAKPOINT`)
- `buildWallpaperTiles` (function) — Builds an array of `{ Icon, rotation, size, jitter }` tile definitions for a given tile count. Non-null assertions are safe: `hash(...) % array.length` is always a valid index
- `AppWallpaper` (component) — Renders two fixed, `aria-hidden`, desktop-only (`md:block`) layers behind the shell: a repeating icon-pattern grid (`-z-20`) sized to the viewport via `useWallpaperTileCount`, and a `bg-background` mask (`-z-10`) spanning the shell's own centered column (`left-app-edge`/`right-app-edge`) so the pattern only shows in the side gutters

### Exports

- `AppWallpaper` — named

---

## AppWallpaper.test.tsx

### Imports

- `@testing-library/react` — `render`
- `vitest` — `describe`, `it`, `expect`
- `./AppWallpaper` — `AppWallpaper` (component under test)

### Definitions

- _(none — test file, no exports)_

### Exports

- _(none — test file, no exports)_

---

## AppShell.test.tsx

### Imports

- `react` — `ReactNode` (used in mock provider types)
- `@testing-library/react` — `render`, `screen` (DOM rendering and querying)
- `vitest` — `describe`, `it`, `expect`, `vi` (test runner and mock utilities)
- `./AppShell` — `AppShell` (component under test)

### Definitions

- `mockUsePathname` (const) — Hoisted `vi.fn()` stub for `next/navigation`'s `usePathname`, defaulting to `'/'`

### Exports

- _(none — test file, no exports)_

---

## index.ts

### Imports

- _(none)_

### Definitions

- _(none)_

### Exports

- `AppShell` — named (barrel re-export from `./AppShell`)
