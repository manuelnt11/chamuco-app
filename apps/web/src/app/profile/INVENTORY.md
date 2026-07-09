# Inventory: profile

---

## layout.tsx

### Imports

- `react` — `Suspense`, `ReactNode` (Suspense boundary wrapper and children prop type)
- `@/components/ui/spinner` — `Spinner` (loading indicator component)

### Definitions

- `ProfileLayout` (component) — Wraps the profile route subtree in a `Suspense` boundary with a centered full-page spinner fallback

### Exports

- `ProfileLayout` — default

---

## page.tsx

### Imports

- `react` — `useState`, `useEffect`, `useLayoutEffect`, `useCallback`, `useRef`, `KeyboardEvent` (core React hooks and keyboard event type)
- `next/navigation` — `useRouter`, `useSearchParams` (client-side navigation and URL search param access)
- `react-i18next` — `useTranslation` (i18n hook; uses `profile` namespace)
- `@/components/ui/button` — `Button` (generic button component)
- `@/components/ui/spinner` — `Spinner` (loading indicator)
- `@/components/profile/BasicInfoSection` — `BasicInfoSection` (profile bio and avatar section)
- `@/components/invitation-tokens/InvitationLinkWidget` — `InvitationLinkWidget` (referral link widget)
- `@/components/profile/PersonalDetailsSection` — `PersonalDetailsSection` (name, DOB, phone, address section)
- `@/components/profile/PreferencesSection` — `PreferencesSection` (language, currency, theme preferences)
- `@/components/profile/NotificationPreferencesSection` — `NotificationPreferencesSection` (FCM opt-out settings)
- `@/components/profile/LoyaltyProgramsSection` — `LoyaltyProgramsSection` (airline/hotel loyalty programs)
- `@/components/profile/HealthSection` — `HealthSection` (blood type, dietary, allergies, medical notes)
- `@/components/profile/EmergencyContactsSection` — `EmergencyContactsSection` (emergency contact list)
- `@/components/profile/NationalitiesSection` — `NationalitiesSection` (passports and nationalities)
- `@/services/users.types` — `BasicInfoProfile`, `EmergencyContactDto`, `HealthData`, `LoyaltyProgramDto`, `NationalityDto`, `NotificationPreferencesData`, `PersonalDetailsProfile`, `PreferencesData` (local DTO types for profile sections)
- `@/hooks/useAuth` — `useAuth` (Firebase auth state hook)
- `@/hooks/useUser` — `useUser` (app-level user record hook)
- `@/services/users.service` — `getMyProfile`, `getMyPreferences`, `getMyLoyaltyPrograms`, `getMyHealth`, `getMyEmergencyContacts`, `getMyNationalities`, `getMyNotificationPreferences` (API fetch functions for all profile sections)
- `@/components/ui/toast` — `toast` (toast notification helper)
- `@chamuco/shared-types` — `AppLanguage`, `AppCurrency`, `AppTheme`, `InvitationTokenContext` (shared enums for preference defaults and invitation context)
- `@/lib/utils` — `cn` (Tailwind class merge utility)

### Definitions

- `VALID_TABS` (const) — Tuple of valid tab key strings: `basic`, `personal`, `nationalities`, `loyalty`, `health`, `emergency`, `preferences`
- `Tab` (type) — Union type derived from `VALID_TABS` elements
- `DEFAULT_PERSONAL_DETAILS` (const) — Fallback `PersonalDetailsProfile` object used when the profile API call fails
- `DEFAULT_HEALTH_DATA` (const) — Fallback `HealthData` object used when the health API call fails
- `ProfileData` (interface) — Shape of the aggregated data state holding all profile sections
- `ProfilePage` (component) — Client component rendering the full profile page with an accessible tab navigation (keyboard arrow-key support, ARIA roles) and lazy-loaded section panels; fetches all profile data in parallel via `Promise.allSettled` and handles loading, error, and retry states

### Exports

- `ProfilePage` — default
