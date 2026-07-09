# Inventory: **tests**

---

## FeedbackButton.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` for rendering components and querying the DOM
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach` for test structure and assertions
- `react-i18next` (mocked) — `useTranslation` returning an identity `t` function
- `@/components/feedback/FeedbackModal` (mocked) — `FeedbackModal` replaced with a controllable mock
- `@phosphor-icons/react` (mocked) — `ChatCircleIcon` replaced with a stub span
- `@/components/feedback/FeedbackButton` — the component under test

### Definitions

- `mocks` (const) — hoisted mock object holding `mockFeedbackModal` vi.fn() for controlling FeedbackModal behavior across tests
- `FeedbackButton describe block` (function) — test suite covering: initial render, chat icon presence, modal closed initially, modal opens on button click, modal closes when onClose is called

### Exports

- None

---

## FeedbackModal.test.tsx

### Imports

- `react` — `ReactNode` type used in dialog mock implementations
- `@testing-library/react` — `render`, `screen`, `waitFor` for rendering and async DOM queries
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` for test structure and assertions
- `axios` — `AxiosError` for constructing test error instances
- `react-i18next` (mocked) — `useTranslation` returning an identity `t` function
- `@/services/api-client` (mocked) — `apiClient.post` replaced with `mockPost` vi.fn()
- `@/components/ui/toast` (mocked) — `toast.success` and `toast.error` replaced with vi.fn() stubs
- `axios` (partially mocked) — `isAxiosError` replaced with `mockIsAxiosError` vi.fn()
- `@/components/ui/dialog` (mocked) — `Dialog`, `DialogClose`, `DialogPopup`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` replaced with inline-rendering stubs to avoid portal issues
- `@/components/feedback/FeedbackModal` — the component under test

### Definitions

- `mocks` (const) — hoisted mock object holding `mockPost`, `mockToastSuccess`, `mockToastError`, `mockIsAxiosError` vi.fn() stubs
- `makeAxiosError` (function) — creates a partial `AxiosError` with a given HTTP status code for testing error-handling branches
- `FeedbackModal describe block` (function) — test suite with nested groups: `visibility` (open/closed rendering), `dismissal` (cancel resets state), `form validation` (empty/short/valid comment states and error messages), `submission` (API call shape, success state, auto-close, 429 rate-limit error, generic error)

### Exports

- None
