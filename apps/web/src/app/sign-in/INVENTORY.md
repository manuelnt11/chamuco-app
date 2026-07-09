# Inventory: sign-in

---

## page.tsx

### Imports

- `react` — `useEffect`, `useRef`, `useState` (state and lifecycle hooks)
- `next/navigation` — `useRouter`, `useSearchParams` (client-side routing and query params)
- `react-i18next` — `useTranslation` (i18n hook for the `auth` namespace)
- `axios` — `isAxiosError` (Axios error type guard)
- `@/hooks/useAuth` — `useAuth` (auth context hook providing currentUser, sign-in methods)
- `@/lib/url-utils` — `sanitizeReturnTo` (sanitizes the `return` query param before redirecting)
- `@/lib/auth-cookies` — `COOKIE_CHAMUCO_REGISTERED_SET` (cookie string set on successful returning-user sign-in)
- `@/services/auth.service` — `checkMe` (API call to determine if the Firebase user is already registered)
- `@/components/header/Logo` — `Logo` (app logo component)
- `@/components/ui/button` — `Button` (UI button component)
- `@/components/ui/spinner` — `Spinner` (loading spinner component)
- `@/components/ui/toast` — `toast` (toast notification utility)
- `@/components/LanguageToggle` — `LanguageToggle` (language switcher component)
- `@/components/ThemeToggle` — `ThemeToggle` (dark/light theme toggle component)

### Definitions

- `GoogleIcon` (component) — Inline SVG rendering the Google "G" brand icon; aria-hidden, used inside the Google sign-in button
- `FacebookIcon` (component) — Inline SVG rendering the Facebook "f" brand icon; aria-hidden, used inside the Facebook sign-in button
- `SigningInProvider` (type) — Union type `'google' | 'facebook' | null` tracking which provider sign-in is in progress
- `SignInPage` (component) — Page-level component that renders the sign-in form; handles auth state guard (redirect if already authenticated), Google and Facebook OAuth flows, new-vs-returning-user detection via `checkMe`, and routes to `/onboarding` (new user) or `sanitizeReturnTo(returnTo)` (returning user)

### Exports

- `SignInPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `act` (React Testing Library utilities)
- `@testing-library/user-event` — `userEvent` (simulates real user interactions)
- `@/store/auth` — `AuthContextValue` (type only; used to type mock auth context overrides)
- `@/hooks/useAuth` — `useAuth` (mocked; controlled via `vi.mocked`)
- `./page` — `SignInPage` (component under test)

### Definitions

- `mocks` (const) — Hoisted `vi.hoisted` object holding all shared mock functions (`mockRouterReplace`, `mockSignInWithGoogle`, `mockSignInWithFacebook`, `mockApiGet`, `mockToastError`, `mockToastInfo`)
- `makeAuth` (function) — Factory that returns a fully-typed `AuthContextValue` with sensible defaults, accepting partial overrides for per-test customization
- `setup` (function) — Configures `useAuth` mock with `makeAuth(overrides)` and returns a `userEvent` instance for interaction

### Exports

- none (test file, no exports)
