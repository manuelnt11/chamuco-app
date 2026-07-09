# Inventory: [username]

---

## page.tsx

### Imports

- `react` — `useState`, `useEffect`, `useCallback` for state and lifecycle management
- `next/navigation` — `useParams` (reads `username` route param), `useRouter` (back navigation)
- `react-i18next` — `useTranslation` for i18n string lookup in the `profile` namespace
- `@/components/ui/spinner` — `Spinner` loading indicator component
- `@/components/ui/button` — `Button` action button component
- `@/components/ui/empty-state` — `EmptyState` component for not-found and error states
- `@/components/public-profile` — `PublicProfileHeader`, `PublicProfileStats`, `PublicProfileAchievements`, `PublicProfileRecognitions`, `PublicProfileDiscoveryMap` section components
- `@/services/users.service` — `getPublicProfile` API call to fetch public profile data
- `@/services/users.types` — `PublicProfileData` response type

### Definitions

- `PublicProfilePage` (component) — Client-side page that fetches and renders a user's public profile by username; handles loading, 404, and generic error states; conditionally renders gamification sections based on visibility

### Exports

- `PublicProfilePage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` for rendering and querying the DOM
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `vitest` — `describe`, `it`, `expect`, `beforeEach` test utilities; `vi` (global) for mocking
- `next/navigation` — mocked: `useRouter`, `useParams`
- `@/services/api-client` — mocked: `apiClient.get` to control API responses
- `react-i18next` — mocked: `useTranslation` returning key-passthrough stub
- `@/components/ui/spinner` — mocked: `Spinner` renders a `role="status"` div
- `@/components/public-profile` — mocked: all five section components render minimal test stubs
- `@chamuco/shared-types` — `ProfileVisibility` enum used in fixture data
- `./page` — `PublicProfilePage` component under test

### Definitions

- `publicProfileData` (const) — Fixture for a public profile with all gamification fields populated
- `privateProfileData` (const) — Fixture for a private profile with all gamification fields as `null`
- `make404Error` (function) — Factory that returns an error object with `response.status = 404`
- `makeGenericError` (function) — Factory that returns an error object with `response.status = 500`

### Exports

- _(none — test file, no exports)_
