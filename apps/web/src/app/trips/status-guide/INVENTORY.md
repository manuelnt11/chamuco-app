# Inventory: status-guide

---

## page.tsx

### Imports

- `next/navigation` — `useRouter` for programmatic back navigation
- `react-i18next` — `useTranslation` for i18n `t()` function
- `@chamuco/shared-types` — `TripStatus` enum for all trip status values
- `@phosphor-icons/react` — `ArrowLeftIcon`, `ArrowRightIcon`, `ArrowDownIcon`, `InfoIcon`, `CheckCircleIcon`, `ProhibitIcon` for UI icons
- `@/components/trips/TripStatusBadge` — `TripStatusBadge` component to render styled status chips

### Definitions

- `MAIN_FLOW` (const) — ordered array of `TripStatus` values representing the linear progression (DRAFT → OPEN → CONFIRMED → IN_PROGRESS → COMPLETED)
- `STATUS_GUIDE_KEYS` (const) — lookup table mapping each `TripStatus` to its i18n key paths for intent, conditions, and restrictions
- `TERMINAL_STATUSES` (const) — `Set<TripStatus>` containing COMPLETED and CANCELLED, used to flag non-progressable statuses
- `TripStatusGuidePage` (component) — page component rendering the full status guide with back button, flow diagram, and per-status detail cards
- `StatusCard` (component) — renders a single status card with intent, conditions, and restrictions rows using colored icons; accepts `status` and `t` props

### Exports

- `TripStatusGuidePage` — default
