# Inventory: invitation-tokens

---

## InvitationLinkWidget.tsx

### Imports

- `react` — `useState`, `useEffect`, `useRef`, `SubmitEvent` (state, side effects, ref for timeout, form event type)
- `react-i18next` — `useTranslation` (i18n hook for translated strings)
- `@phosphor-icons/react` — `ShareNetworkIcon`, `CopyIcon`, `CheckIcon`, `UploadSimpleIcon`, `PaperPlaneTiltIcon` (action and heading icons)
- `@/components/ui/button` — `Button` (shared button primitive)
- `@/components/ui/input` — `Input` (text input for URL display and email field)
- `@/components/ui/label` — `Label` (form label for invite modal fields)
- `@/components/ui/textarea` — `Textarea` (optional note field in invite modal)
- `@/components/ui/spinner` — `Spinner` (loading indicator during initial fetch)
- `@/components/ui/toast` — `toast` (error notification helper)
- `@/components/ui/field-message` — `FieldMessage` (inline error display below email input)
- `@/components/ui/dialog` — `Dialog`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogFooter` (modal primitives for invite-by-email flow)
- `@chamuco/shared-types` — `InvitationTokenContext` (enum for REFERRAL / TRIP / GROUP context)
- `@/services/invitation-tokens.service` — `createInvitationToken`, `getOpenInvitationToken`, `toggleInvitationToken` (API calls for token lifecycle)

### Definitions

- `LinkData` (interface) — shape of a resolved invitation token: `token`, `url`, `isActive`
- `InvitationLinkWidgetProps` (interface) — props for the widget: `contextType`, `contextId`, `storageId`, `showToggle`
- `storageKey` (const) — pure function deriving the localStorage key from `contextType` and `storageId`
- `readCache` (function) — reads and JSON-parses a `LinkData` entry from localStorage; clears corrupted entries and returns `null`
- `InvitationLinkWidget` (component) — self-contained widget that loads, generates, copies/shares, toggles, and sends targeted email invitations for an invitation link; persists link data in localStorage keyed by context

### Exports

- `InvitationLinkWidget` — named

---

## InvitationLinkWidget.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` (component rendering and async assertions)
- `@testing-library/user-event` — `userEvent` (simulates real user interactions)
- `react` — `ReactNode` (type for mock component children)
- `@chamuco/shared-types` — `InvitationTokenContext` (enum used in test scenarios)
- `./InvitationLinkWidget` — `InvitationLinkWidget` (component under test)

### Definitions

- `mocks` (const) — hoisted Vitest mock factory holding `mockCreateToken`, `mockGetOpenToken`, `mockToggleToken`, `mockToastError`, `mockClipboard`, `mockShare`
- `renderWidget` (function) — test helper that renders `InvitationLinkWidget` with given `contextType`, `contextId`, and `showToggle`

### Exports

- none (test file, no exports)
