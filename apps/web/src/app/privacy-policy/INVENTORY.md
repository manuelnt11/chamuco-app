# Inventory: privacy-policy

---

## page.tsx

### Imports

- `next/link` — `Link` component for client-side navigation
- `react-i18next` — `useTranslation` hook for i18n string resolution
- `@/config/app.constants` — `CONTACT_EMAIL` constant for the mailto link
- `@/components/header/Logo` — `Logo` component rendered in the minimal header
- `@/components/LanguageToggle` — `LanguageToggle` component for locale switching
- `@/components/ThemeToggle` — `ThemeToggle` component for dark/light mode

### Definitions

- `PrivacyPolicyPage` (component) — Full-page Privacy Policy layout with a sticky minimal header, 13 translated content sections (controller, data collected, purposes, sensitive data, third parties, international transfers, minors, retention, rights, security, organizers, changes, contact), and a footer nav linking to sign-in, terms-of-service, and account-deletion pages; uses `legal` and `common` i18n namespaces

### Exports

- `PrivacyPolicyPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` for component rendering and DOM queries
- `react` — `ReactNode` type used in the `next/link` mock
- `@/config/app.constants` — `CONTACT_EMAIL` to assert the correct mailto href

### Definitions

- `vi.mock('next/link', ...)` (const) — replaces `Link` with a plain `<a>` element for test assertions
- `vi.mock('@/components/header/Logo', ...)` (const) — stubs `Logo` with a `data-testid="logo"` div
- `vi.mock('@/components/LanguageToggle', ...)` (const) — stubs `LanguageToggle` with a `data-testid="language-toggle"` button
- `vi.mock('@/components/ThemeToggle', ...)` (const) — stubs `ThemeToggle` with a `data-testid="theme-toggle"` button
- `vi.mock('react-i18next', ...)` (const) — stubs `useTranslation` so `t(key)` returns the key string verbatim
- `describe('PrivacyPolicyPage', ...)` (const) — test suite covering header elements, h1 title, all 13 section h2 headings, the mailto contact link, and footer navigation links

### Exports

- _(none — test file, no exports)_
