# Inventory: new

---

## page.tsx

### Imports

- `next/navigation` — `useRouter` for programmatic navigation after trip creation
- `react-i18next` — `useTranslation` for the `trips` i18n namespace
- `@/components/trips/TripForm` — `TripForm` component for the create-trip form
- `@/services/trips.types` — `TripResponse` type (type-only) for the success callback signature

### Definitions

- `NewTripPage` (component) — Client component that renders the new-trip page; displays a localised heading and a `TripForm` in `create` mode, then redirects to `/trips/:id` on success

### Exports

- `NewTripPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` for rendering and querying the component
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./page` — `NewTripPage` (default import) — component under test

### Definitions

- `mockPush` (const) — `vi.fn()` spy that stands in for `router.push`; asserts navigation target after form submission

### Exports

- _(none — test file, no exports)_
