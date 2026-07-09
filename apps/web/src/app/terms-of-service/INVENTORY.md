# Inventory: terms-of-service

---

## page.tsx

### Imports

- `next/link` — `Link`: client-side navigation component
- `react-i18next` — `useTranslation`: hook for accessing i18n translation function
- `@/config/app.constants` — `CONTACT_EMAIL`: app-level constant for the contact email address
- `@/components/header/Logo` — `Logo`: branded logo component for the minimal header
- `@/components/LanguageToggle` — `LanguageToggle`: UI control to switch app language
- `@/components/ThemeToggle` — `ThemeToggle`: UI control to toggle dark/light theme

### Definitions

- `TermsOfServicePage` (component) — Full-page Terms of Service document with a sticky minimal header (Logo, LanguageToggle, ThemeToggle), 15 translated sections (Acceptance, Service, Eligibility, Account, Acceptable Use, Expenses, IP, Gamification, Notifications, Privacy, Liability, Termination, Modifications, Governing Law, Contact), and a footer with links back to `/sign-in` and `/privacy-policy`; uses `legal` and `common` i18n namespaces

### Exports

- `TermsOfServicePage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`: renders the component into a test DOM and queries elements
- `react` — `ReactNode` (type): type used in the `next/link` mock
- `@/config/app.constants` — `CONTACT_EMAIL`: asserts the mailto link uses the correct address

### Definitions

- `vi.mock('next/link', ...)` (const) — replaces `next/link` with a plain `<a>` element passthrough for testing
- `vi.mock('@/components/header/Logo', ...)` (const) — stubs `Logo` as a `<div data-testid="logo">`
- `vi.mock('@/components/LanguageToggle', ...)` (const) — stubs `LanguageToggle` as a `<button data-testid="language-toggle">`
- `vi.mock('@/components/ThemeToggle', ...)` (const) — stubs `ThemeToggle` as a `<button data-testid="theme-toggle">`
- `vi.mock('react-i18next', ...)` (const) — stubs `useTranslation` to return the key string as the translation value
- `TermsOfServicePage` test suite (function) — Vitest `describe` block covering: header chrome (logo, language toggle, theme toggle), h1 page title, all 15 section h2 headings, the contact mailto link, and footer navigation links to `/sign-in` and `/privacy-policy`

### Exports

- none (test file, no exports)
