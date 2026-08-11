# Inventory: layout

---

## AppShell.tsx

### Imports

- `react` — `ReactNode` (children prop type)
- `next/navigation` — `usePathname` (reads current route to detect auth/no-chrome pages)
- `@/components/header` — `Header` (top navigation bar)
- `@/components/navigation` — `MobileBottomNav`, `DesktopSideNav` (responsive nav chrome)
- `@/components/feedback/FeedbackButton` — `FeedbackButton` (floating feedback widget)
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

- `@phosphor-icons/react` — `AirplaneTiltIcon`, `MapPinIcon`, `CompassIcon`, `UsersThreeIcon`, `SuitcaseRollingIcon`, `GlobeHemisphereWestIcon`, `TentIcon`, `BackpackIcon`, `CameraIcon`, `IslandIcon`, `BinocularsIcon`, `MountainsIcon`, `MapTrifoldIcon`, `UmbrellaIcon` (travel/group icon set for the pattern)

### Definitions

- `WALLPAPER_ICONS` (const) — Ordered array of the travel/group icon components used to build the pattern
- `ROTATIONS` (const) — Fixed set of Tailwind rotation classes
- `SIZES` (const) — Fixed set of Tailwind `size-*` classes for per-tile icon size variety
- `JITTERS` (const) — Fixed set of small Tailwind translate classes for per-tile position variety
- `hash` (function) — Deterministic integer hash (SSR-safe — no `Math.random`/`Date.now`) used to pick each tile's icon/rotation/size/jitter independently
- `TILE_COUNT` (const) — Number of icon tiles generated (540), sized to cover up to ~4K desktop displays
- `wallpaperTiles` (const) — Precomputed array of `{ Icon, rotation, size, jitter }` tile definitions, one per grid cell
- `AppWallpaper` (component) — Renders two fixed, `aria-hidden`, desktop-only (`md:block`) layers behind the shell: a repeating icon-pattern grid (`-z-20`) filling the full viewport, and a `bg-background` mask (`-z-10`) spanning the shell's own centered column (`left-app-edge`/`right-app-edge`) so the pattern only shows in the side gutters

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
