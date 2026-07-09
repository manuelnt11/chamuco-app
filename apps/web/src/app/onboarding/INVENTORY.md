# Inventory: onboarding

---

## `page.tsx`

### Imports

- `react` — `SyntheticEvent`, `useEffect`, `useRef`, `useState`
- `next/link` — `Link`
- `next/navigation` — `useRouter`, `useSearchParams`
- `react-i18next` — `Trans`, `useTranslation`
- `axios` — `isAxiosError`
- `@chamuco/shared-utils` — `computeAge`, `isValidCalendarDay`
- `@/components/ui/date-of-birth-field` — `DateOfBirthField`
- `@/components/ui/phone-input` — `PhoneInput`, `cleanPhoneNumber`, `isPhoneValid`
- `i18next` — `TFunction`
- `next-themes` — `useTheme`
- `@/hooks/useAuth` — `useAuth`
- `@/lib/url-utils` — `sanitizeReturnTo`
- `@/hooks/useUser` — `useUser`
- `@/lib/auth-cookies` — `COOKIE_CHAMUCO_REGISTERED_SET`
- `@chamuco/shared-types` — `AppLanguage`, `AppTheme`, `AppCurrency`
- `@/services/auth.service` — `checkMe`, `register`
- `@/services/users.service` — `checkUsernameAvailable`, `updateMyPreferences`
- `@/components/header/Logo` — `Logo`
- `@/components/ui/button` — `Button`
- `@/components/ui/input` — `Input`
- `@/components/ui/label` — `Label`
- `@/components/ui/spinner` — `Spinner`
- `@/components/ui/toast` — `toast`
- `@/components/LanguageToggle` — `LanguageToggle`
- `@/components/ThemeToggle` — `ThemeToggle`
- `@/components/ui/country-combobox` — `CountryCombobox`, `getCallingCode`
- `@/components/ui/city-combobox` — `CityCombobox`
- `@/components/ui/field-message` — `FieldMessage`
- `@/lib/name-utils` — `NAME_REGEX`, `normalizeName`

### Definitions

- `USERNAME_RE` (const) — regex enforcing valid username format: 3–30 chars, lowercase alphanumeric, `_`, `-`
- `CURRENT_YEAR` (const) — current calendar year used as DOB picker upper bound
- `TOTAL_STEPS` (const) — total number of onboarding wizard steps (3)
- `STEP_KEYS` (const) — readonly tuple of i18n step key names used for step header translations
- `toUsernameSlug` (function) — converts a display name to a normalized, diacritic-stripped, snake_case username slug
- `USD_COUNTRIES` (const) — set of ISO-2 country codes whose primary currency is USD
- `deriveCurrency` (function) — maps a country code to `'COP'` or `'USD'` for default currency preference
- `resolveTheme` (function) — normalizes a `next-themes` raw value to an uppercase app theme string
- `resolveLanguage` (function) — normalizes an i18n language code to an uppercase app language string
- `UsernameStatus` (type) — union of username availability states: `'idle' | 'checking' | 'available' | 'taken' | 'invalid'`
- `validateStep1` (function) — returns field error map for step 1 (username status, display name)
- `validateStep2` (function) — returns field error map for step 2 (first/last name, DOB, phone, email)
- `validateStep3` (function) — returns field error map for step 3 (home country, terms acceptance)
- `OnboardingPage` (component) — 3-step registration wizard for Firebase-authenticated users without a Chamuco account
- `Step1Props` (interface) — props contract for the Step1 account sub-component
- `Step1` (component) — renders display name and username fields with real-time availability feedback for step 1
- `Step2Props` (interface) — props contract for the Step2 personal info sub-component
- `Step2` (component) — renders first/last name, date of birth, notification email, and phone fields for step 2
- `Step3Props` (interface) — props contract for the Step3 location and terms sub-component
- `Step3` (component) — renders home country, home city, and terms-of-service acceptance checkbox for step 3
- `UsernameStatusMessageProps` (interface) — props contract for the inline username status indicator
- `UsernameStatusMessage` (component) — renders an inline status message reflecting current username availability state

### Exports

- `OnboardingPage` — default

---

## `page.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `act`
- `@testing-library/user-event` — `userEvent`
- `react` — `ReactNode`
- `firebase/auth` — `User`
- `@/store/auth` — `AuthContextValue`
- `@/hooks/useAuth` — `useAuth`
- `./page` — `OnboardingPage`

### Definitions

- `mocks` (const) — hoisted vi mock functions for router replace, API get/post/patch, toast error/info, signOut, and refreshUser
- `NOT_FOUND_ERROR` (const) — Axios-shaped 404 error fixture used to simulate an unregistered user
- `CONFLICT_ERROR` (const) — Axios-shaped 409 error fixture used to simulate a taken username on submit
- `makeUser` (function) — factory returning a partial Firebase `User` with sensible test defaults
- `makeAuth` (function) — factory returning a partial `AuthContextValue` with sensible test defaults
- `mockGetByUrl` (function) — configures `apiClient.get` to respond by URL pattern (`/users/me` and `/username-available`)
- `renderForm` (function) — renders `OnboardingPage`, applies auth mock, and waits for step 1 to be visible
- `renderFormAtStep3` (function) — renders the page and navigates through steps 1 and 2 to arrive at step 3
- `renderFormWithAvailableUsername` (function) — renders and fills all 3 steps with fake-timer control, ends on step 3 ready to submit

### Exports

- none
