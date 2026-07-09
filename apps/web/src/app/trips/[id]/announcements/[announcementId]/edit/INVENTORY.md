# Inventory: edit

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState`, `use`, `SubmitEvent` (React hooks, param unwrapping, and form event type)
- `next/link` — `Link` (client-side navigation component)
- `next/navigation` — `useRouter` (programmatic routing)
- `react-i18next` — `useTranslation` (i18n hook for the `trips` namespace)
- `@chamuco/shared-types` — `TripRole` (enum of trip participant roles)
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon` (SVG icon components)
- `@/services/trips.service` — `getTripParticipation`, `getTripAnnouncement`, `updateTripAnnouncement` (API call functions)
- `@/hooks/useAuth` — `useAuth` (auth state hook providing `isLoading`)
- `@/components/ui/announcement-form` — `AnnouncementForm` (reusable controlled form component)

### Definitions

- `EditTripAnnouncementPageProps` (interface) — props shape for the page; `params` is a `Promise<{ id: string; announcementId: string }>` (Next.js async params)
- `ORGANIZER_ROLES` (const) — array of `TripRole` values (`ORGANIZER`, `CO_ORGANIZER`) used to gate edit access
- `EditTripAnnouncementPage` (component) — page that loads an existing announcement, enforces organizer-only access (redirects non-organizers), pre-fills the `AnnouncementForm`, and submits a PATCH to update the content before redirecting to the announcements list

### Exports

- `EditTripAnnouncementPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` (DOM rendering and query utilities)
- `@testing-library/user-event` — `userEvent` (simulates real user interactions)
- `react` — `ReactNode`, `FormEvent` (type imports used in mock implementations)
- `@chamuco/shared-types` — `TripRole`, `TripParticipantStatus` (enums for mock data)
- `./page` — `EditTripAnnouncementPage` (component under test)

### Definitions

- `mocks` (const) — hoisted `vi.fn()` stubs: `mockApiGet`, `mockApiPatch`, `mockUseAuth`, `mockRouterPush`, `mockRouterReplace`
- `mockAnnouncement` (const) — static fixture object representing an announcement API response
- `setupMocks` (function) — configures `mockUseAuth`, `mockApiGet`, and `mockApiPatch` per-test based on a given `TripRole | null`

### Exports

- none (test file, no exports)
