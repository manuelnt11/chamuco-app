# Inventory: join

---

## page.tsx

### Imports

- `react` — `useEffect`, `useRef`, `useState` (state and side-effect hooks)
- `next/navigation` — `useRouter`, `useSearchParams` (client-side routing and URL query access)
- `react-i18next` — `useTranslation` (i18n hook for translated strings)
- `@/hooks/useAuth` — `useAuth` (current user and auth loading state)
- `@/components/header/Logo` — `Logo` (brand logo component)
- `@/components/ui/button` — `Button` (UI button component)
- `@/components/ui/spinner` — `Spinner` (loading spinner component)
- `@/components/ui/toast` — `toast` (toast notification utility)
- `@/components/LanguageToggle` — `LanguageToggle` (language switcher component)
- `@/components/ThemeToggle` — `ThemeToggle` (dark/light theme toggle component)
- `@chamuco/shared-types` — `InvitationTokenContext` (enum of invitation contexts: TRIP, GROUP, REFERRAL), `InvitationTokenResolveResponse` (type for resolved token data)
- `@/services/invitation-tokens.service` — `resolveInvitationToken`, `redeemInvitationToken` (API calls for token resolution and redemption)

### Definitions

- `PageState` (type) — union of loading states: `'loading' | 'not-found' | 'inactive' | 'preview' | 'redeeming' | 'done'`
- `redirectForContext` (function) — maps an `InvitationTokenContext` enum value to the post-redeem redirect path (`/trips`, `/groups`, or `/`)
- `JoinPage` (component) — page component that resolves an invitation token from the `?token` query param, auto-redeems if the user is already authenticated, or shows a sign-in prompt for unauthenticated users; renders state-specific UI for loading, not-found, inactive, redeeming, and preview states

### Exports

- `JoinPage` — default
