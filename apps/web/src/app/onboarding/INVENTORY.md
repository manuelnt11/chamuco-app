# Inventory: onboarding

---

## page.tsx

### Imports

- `react` — `SyntheticEvent`, `useEffect`, `useRef`, `useState` (React hooks and event type)
- `next/link` — `Link` (client-side navigation component)
- `next/navigation` — `useRouter`, `useSearchParams` (Next.js routing hooks)
- `react-i18next` — `Trans`, `useTranslation` (i18n hooks and interpolated translation component)
- `axios` — `isAxiosError` (Axios error type guard)
- `@/components/ui/date-of-birth-field` — `DateOfBirthField` (DOB input group component)
- `@/components/ui/phone-input` — `PhoneInput`, `cleanPhoneNumber`, `isPhoneValid` (phone number input and utilities)
- `i18next` — `TFunction` (TypeScript type for translation function)
- `next-themes` — `useTheme` (theme detection hook)
- `@/hooks/useAuth` — `useAuth` (Firebase auth context hook)
- `@/lib/url-utils` — `sanitizeReturnTo` (safe redirect URL sanitizer)
- `@/hooks/useUser` — `useUser` (user context refresh hook)
- `@/lib/auth-cookies` — `COOKIE_CHAMUCO_REGISTERED_SET` (cookie string constant)
- `@chamuco/shared-types` — `AppLanguage`, `AppTheme`, `AppCurrency` (shared enum types)
- `@/services/auth.service` — `checkMe`, `register` (registration and auth check API calls)
- `@/services/users.service` — `checkUsernameAvailable`, `updateMyPreferences` (username check and preferences update)
- `@/components/header/Logo` — `Logo` (brand logo component)
- `@/components/ui/button` — `Button` (button component)
- `@/components/ui/input` — `Input` (text input component)
- `@/components/ui/label` — `Label` (form label component)
- `@/components/ui/spinner` — `Spinner` (loading spinner component)
- `@/components/ui/toast` — `toast` (toast notification utility)
- `@/components/LanguageToggle` — `LanguageToggle` (language switcher component)
- `@/components/ThemeToggle` — `ThemeToggle` (theme switcher component)
- `@/components/ui/country-combobox` — `CountryCombobox`, `getCallingCode` (country selector and calling code helper)
- `@/components/ui/city-combobox` — `CityCombobox` (city selector component)
- `@/components/ui/field-message` — `FieldMessage` (field-level error/hint message component)
- `@/lib/name-utils` — `NAME_REGEX`, `normalizeName` (name validation regex and normalizer)

### Definitions

- `USERNAME_RE` (const) — regex enforcing `a-z0-9_-`, 3–30 chars for usernames
- `CURRENT_YEAR` (const) — current calendar year used as DOB upper bound
- `TOTAL_STEPS` (const) — total number of onboarding steps (3)
- `STEP_KEYS` (const) — tuple of i18n step key prefixes `['step1', 'step2', 'step3']`
- `toUsernameSlug` (function) — converts a display name to a valid lowercase username slug
- `computeAge` (function) — computes age from day/month/year; mirrors backend minimum-age validator
- `USD_COUNTRIES` (const) — Set of country ISO codes whose primary currency is USD
- `deriveCurrency` (function) — returns `'COP'` or `'USD'` based on a country code
- `resolveTheme` (function) — maps raw `next-themes` value to uppercase enum string (`'LIGHT'|'DARK'|'SYSTEM'`)
- `resolveLanguage` (function) — maps i18n language code to uppercase enum string (`'EN'|'ES'`)
- `UsernameStatus` (type) — union `'idle' | 'checking' | 'available' | 'taken' | 'invalid'`
- `validateStep1` (function) — returns field error map for step 1 (username + display name)
- `isValidCalendarDay` (function) — checks that a day/month/year combination is a real calendar date
- `validateStep2` (function) — returns field error map for step 2 (name, DOB, phone, email)
- `validateStep3` (function) — returns field error map for step 3 (home country, terms)
- `OnboardingPage` (component) — 3-step registration wizard; guards unauthenticated and already-registered users; calls `register` on submit
- `Step1Props` (interface) — props for the Step1 sub-component
- `Step1` (component) — step 1 UI: display name + username inputs with live availability feedback
- `Step2Props` (interface) — props for the Step2 sub-component
- `Step2` (component) — step 2 UI: first/last name, DOB, email, phone fields
- `Step3Props` (interface) — props for the Step3 sub-component
- `Step3` (component) — step 3 UI: home country/city comboboxes and terms acceptance checkbox
- `UsernameStatusMessageProps` (interface) — props for the UsernameStatusMessage sub-component
- `UsernameStatusMessage` (component) — renders inline status feedback (idle/invalid/checking/available/taken) below the username field

### Exports

- `OnboardingPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `act` (React Testing Library utilities)
- `@testing-library/user-event` — `userEvent` (user interaction simulation)
- `react` — `ReactNode` (type for mock component children)
- `firebase/auth` — `User` (type for mock Firebase user)
- `@/store/auth` — `AuthContextValue` (type for mock auth context)
- `next/navigation` (vi mock) — `useRouter`, `usePathname`, `useSearchParams`
- `@/hooks/useAuth` (vi mock) — `useAuth`
- `@/hooks/useUser` (vi mock) — `useUser`
- `@/services/api-client` (vi mock) — `apiClient` (`get`, `post`, `patch`)
- `next-themes` (vi mock) — `useTheme`
- `@/components/ui/toast` (vi mock) — `toast`
- `@/components/header/Logo` (vi mock) — `Logo`
- `@/components/LanguageToggle` (vi mock) — `LanguageToggle`
- `@/components/ThemeToggle` (vi mock) — `ThemeToggle`
- `react-i18next` (vi mock) — `useTranslation`, `Trans`
- `libphonenumber-js` (vi mock) — `isValidPhoneNumber`, `getCountries`, `getCountryCallingCode`
- `@/components/ui/country-combobox` (vi mock) — `CountryCombobox`, `getCallingCode`
- `@/components/ui/city-combobox` (vi mock) — `CityCombobox`
- `./page` — `OnboardingPage` (component under test)

### Definitions

- `NOT_FOUND_ERROR` (const) — pre-built Axios-shaped 404 error object used in mock stubs
- `CONFLICT_ERROR` (const) — pre-built Axios-shaped 409 error object used in mock stubs
- `makeUser` (function) — factory that returns a partial `User` object for test setup
- `makeAuth` (function) — factory that returns a full `AuthContextValue` mock for `useAuth`
- `mockGetByUrl` (function) — configures `apiClient.get` mock to route `/users/me` and `/username-available` responses
- `renderForm` (function) — renders `OnboardingPage`, waits for the registration guard to pass, returns `userEvent` instance
- `renderFormAtStep3` (function) — renders the page and navigates through steps 1 and 2, leaving the form on step 3
- `renderFormWithAvailableUsername` (function, inside `form submission` describe) — renders and fills all 3 steps with fake-timer control, ends ready to submit

### Exports

- none (test file, no exports)
