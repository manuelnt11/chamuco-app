# Inventory: public-profile

---

## PublicProfileAchievements.tsx

### Imports

- react-i18next — `useTranslation` for `profile` namespace i18n
- @/components/ui/badge — `Badge` UI component for displaying achievement chips
- @/components/ui/empty-state — `EmptyState` component shown when achievements list is empty
- @/lib/name-utils — `humanizeId` converts underscore-separated IDs to human-readable labels

### Definitions

- `PublicProfileAchievementsProps` (interface) — props shape: `achievements: string[]`
- `PublicProfileAchievements` (component) — renders a labelled section of achievement badges; shows `EmptyState` when list is empty, otherwise maps each ID to a `Badge` via `humanizeId`

### Exports

- `PublicProfileAchievementsProps` — named
- `PublicProfileAchievements` — named

---

## PublicProfileAchievements.test.tsx

### Imports

- @testing-library/react — `render`, `screen` for DOM rendering and querying
- vitest — `describe`, `it`, `expect`
- react-i18next — mocked via `vi.mock`; returns identity `t` function
- ./PublicProfileAchievements — `PublicProfileAchievements` component under test

### Definitions

- test suite `PublicProfileAchievements` — 5 tests covering: heading render, empty state, badge-per-achievement, humanized IDs, and empty-state suppression when achievements exist

### Exports

- (none)

---

## PublicProfileDiscoveryMap.tsx

### Imports

- react-i18next — `useTranslation` for `profile` namespace i18n
- @/components/ui/badge — `Badge` UI component for displaying ISO country code chips

### Definitions

- `PublicProfileDiscoveryMapProps` (interface) — props shape: `countries: string[]`
- `PublicProfileDiscoveryMap` (component) — renders a labelled section with a placeholder panel; conditionally lists country-code `Badge` elements when `countries` is non-empty

### Exports

- `PublicProfileDiscoveryMapProps` — named
- `PublicProfileDiscoveryMap` — named

---

## PublicProfileDiscoveryMap.test.tsx

### Imports

- @testing-library/react — `render`, `screen`
- vitest — `describe`, `it`, `expect`
- react-i18next — mocked via `vi.mock`
- ./PublicProfileDiscoveryMap — `PublicProfileDiscoveryMap` component under test

### Definitions

- test suite `PublicProfileDiscoveryMap` — 4 tests covering: heading render, placeholder text, country badge rendering, and empty-countries guard

### Exports

- (none)

---

## PublicProfileHeader.tsx

### Imports

- @chamuco/shared-types — `ResolvedAsset` type for the avatar prop
- @/components/ui/avatar — `Avatar` component for user photo or initials fallback
- @/lib/name-utils — `getInitials` derives initials from display name for avatar fallback

### Definitions

- `PublicProfileHeaderProps` (interface) — props: `displayName`, `username`, `avatar: ResolvedAsset | null`, `bio: string | null`
- `PublicProfileHeader` (component) — renders avatar, display name, `@username`, and optional bio in a responsive flex layout; no i18n (no translatable strings)

### Exports

- `PublicProfileHeaderProps` — named
- `PublicProfileHeader` — named

---

## PublicProfileHeader.test.tsx

### Imports

- @testing-library/react — `render`, `screen`
- vitest — `describe`, `it`, `expect`
- @/components/ui/avatar — mocked to a simple `div` exposing `data-testid="avatar"`
- ./PublicProfileHeader — `PublicProfileHeader` component under test

### Definitions

- test suite `PublicProfileHeader` — 7 tests covering: display name, @username, bio conditional render, avatar presence, initials fallback, and single-word name initials

### Exports

- (none)

---

## PublicProfileRecognitions.tsx

### Imports

- react-i18next — `useTranslation` for `profile` namespace i18n
- @/components/ui/badge — `Badge` UI component for recognition chips
- @/components/ui/empty-state — `EmptyState` shown when recognitions list is empty
- @/lib/name-utils — `humanizeId` converts underscore-separated IDs to readable labels

### Definitions

- `PublicProfileRecognitionsProps` (interface) — props shape: `recognitions: string[]`
- `PublicProfileRecognitions` (component) — renders a labelled section of recognition badges; shows `EmptyState` when empty; keys duplicate IDs with index to avoid React key collisions

### Exports

- `PublicProfileRecognitionsProps` — named
- `PublicProfileRecognitions` — named

---

## PublicProfileRecognitions.test.tsx

### Imports

- @testing-library/react — `render`, `screen`
- vitest — `describe`, `it`, `expect`
- react-i18next — mocked via `vi.mock`
- ./PublicProfileRecognitions — `PublicProfileRecognitions` component under test

### Definitions

- test suite `PublicProfileRecognitions` — 5 tests covering: heading render, empty state, badge-per-recognition, empty-state suppression, and duplicate-ID key handling

### Exports

- (none)

---

## PublicProfileStats.tsx

### Imports

- react-i18next — `useTranslation` for `profile` namespace i18n
- @chamuco/shared-types — `KeyStats` type representing the five numeric stat fields

### Definitions

- `PublicProfileStatsProps` (interface) — props shape: `keyStats: KeyStats`
- `StatItemProps` (interface) — internal props for the `StatItem` helper: `value: number`, `label: string`
- `StatItem` (component) — non-exported helper; renders a single stat value with locale formatting (`toLocaleString`) and a label underneath
- `PublicProfileStats` (component) — renders a labelled 2×5 responsive grid of `StatItem` elements for trips completed, countries visited, cities visited, km traveled, and trips as organizer

### Exports

- `PublicProfileStatsProps` — named
- `PublicProfileStats` — named

---

## PublicProfileStats.test.tsx

### Imports

- @testing-library/react — `render`, `screen`
- vitest — `describe`, `it`, `expect`
- react-i18next — mocked via `vi.mock`
- ./PublicProfileStats — `PublicProfileStats` component under test

### Definitions

- `baseStats` (const) — shared fixture with values for all five `KeyStats` fields
- test suite `PublicProfileStats` — 8 tests covering: heading render, each stat value, locale formatting (45,000), all five labels, and zero-value rendering

### Exports

- (none)

---

## index.ts

### Imports

- (none — re-export barrel only)

### Definitions

- (none)

### Exports

- `PublicProfileHeader` — barrel re-export from ./PublicProfileHeader
- `PublicProfileHeaderProps` — barrel re-export from ./PublicProfileHeader
- `PublicProfileStats` — barrel re-export from ./PublicProfileStats
- `PublicProfileStatsProps` — barrel re-export from ./PublicProfileStats
- `PublicProfileAchievements` — barrel re-export from ./PublicProfileAchievements
- `PublicProfileAchievementsProps` — barrel re-export from ./PublicProfileAchievements
- `PublicProfileRecognitions` — barrel re-export from ./PublicProfileRecognitions
- `PublicProfileRecognitionsProps` — barrel re-export from ./PublicProfileRecognitions
- `PublicProfileDiscoveryMap` — barrel re-export from ./PublicProfileDiscoveryMap
- `PublicProfileDiscoveryMapProps` — barrel re-export from ./PublicProfileDiscoveryMap
