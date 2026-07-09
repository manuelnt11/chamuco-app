# Inventory: account-deletion

---

## page.tsx

### Imports

- `next/link` — `Link` for client-side navigation between routes
- `react-i18next` — `useTranslation` for accessing i18n translation function
- `@/config/app.constants` — `CONTACT_EMAIL` constant for the support email address
- `@/components/header/Logo` — `Logo` branded logo component rendered in the header
- `@/components/LanguageToggle` — `LanguageToggle` component for switching app language
- `@/components/ThemeToggle` — `ThemeToggle` component for switching dark/light theme

### Definitions

- `AccountDeletionPage` (component) — Full-page layout for the account deletion information page; renders a sticky header with logo and toggles, and a main content area with four sections (What Gets Deleted, How to Request, Retention, Contact) plus footer navigation links back to sign-in and privacy policy

### Exports

- `AccountDeletionPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` for rendering and querying the component under test
- `react` — `ReactNode` type used in the `next/link` mock
- `@/config/app.constants` — `CONTACT_EMAIL` for asserting mailto link values

### Definitions

- `AccountDeletionPage` test suite (const) — Vitest `describe` block covering header rendering, page title (h1), all four section headings (h2), contact mailto links, and footer navigation links; uses `vi.mock` to stub `next/link`, `Logo`, `LanguageToggle`, `ThemeToggle`, and `react-i18next`

### Exports

- _(none — test file, no exports)_
