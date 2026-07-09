# Inventory: feedback

---

## FeedbackButton.tsx

### Imports

- react — `useState` for open/close state
- @phosphor-icons/react — `ChatCircleIcon` for the floating action button icon
- react-i18next — `useTranslation` for i18n strings from the `feedback` namespace
- @/components/ui/button — `Button` base UI component
- @/components/feedback/FeedbackModal — `FeedbackModal` dialog triggered by this button

### Definitions

- `FeedbackButton` (component) — Fixed-position floating icon button (bottom-right) that opens `FeedbackModal` on click; uses `feedback` namespace for `aria-label`

### Exports

- `FeedbackButton` — named

---

## FeedbackModal.tsx

### Imports

- react — `useEffect`, `useState` for form state, submission state, and auto-close timer
- axios — `isAxiosError` to detect 429 rate-limit responses distinctly
- react-i18next — `useTranslation` for i18n strings from the `feedback` namespace
- @/components/ui/button — `Button` base UI component
- @/components/ui/dialog — `Dialog`, `DialogClose`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogPopup`, `DialogTitle` for modal structure
- @/components/ui/textarea — `Textarea` for the feedback comment input
- @/components/ui/toast — `toast` for error notifications on submit failure
- @/services/feedback.service — `submitFeedback` to POST feedback payload to the API

### Definitions

- `MAX_CHARS` (const) — Maximum allowed characters for the feedback comment (2000)
- `MIN_CHARS` (const) — Minimum required characters for a valid submission (10)
- `SUCCESS_CLOSE_DELAY_MS` (const) — Auto-close delay after successful submission in ms (5000)
- `FeedbackModalProps` (interface) — Props shape: `open: boolean`, `onClose: () => void`
- `FeedbackModal` (component) — Controlled dialog for collecting user feedback; validates comment length, submits via `submitFeedback`, shows success state with auto-close, handles 429 rate-limit errors distinctly

### Exports

- `FeedbackModal` — named
