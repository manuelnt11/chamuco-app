# Inventory: store

---

## auth.tsx

### Imports

- `react` — `createContext`, `useCallback`, `useEffect`, `useRef`, `useState`, `ReactNode` for React primitives and context creation
- `firebase/auth` — `User` type, `onAuthStateChanged`, `signInWithPopup`, `signOut` (as `firebaseSignOut`) for Firebase auth state and sign-in flows
- `axios` — `isAxiosError` for distinguishing Axios errors during logout
- `@/lib/firebase` — `auth`, `googleProvider`, `facebookProvider` Firebase instances
- `@/lib/auth-cookies` — `COOKIE_CHAMUCO_AUTH_SET`, `COOKIE_CHAMUCO_AUTH_CLEAR`, `COOKIE_CHAMUCO_REGISTERED_NAME`, `COOKIE_CHAMUCO_REGISTERED_SET`, `COOKIE_CHAMUCO_REGISTERED_CLEAR` cookie string constants
- `@/services/api-client` — `setTokenProvider` to register the token getter with the Axios client
- `@/services/auth.service` — `checkMe`, `logout` for server-side session management

### Definitions

- `AuthContextValue` (interface) — shape of the auth context: `currentUser`, `idToken`, `isLoading`, `getIdToken`, `signInWithGoogle`, `signInWithFacebook`, `signOut`
- `AuthContext` (const) — React context holding `AuthContextValue | null`
- `beforeSignOutCallbacks` (const) — module-level `Set` of async callbacks invoked before every sign-out
- `registerBeforeSignOut` (function) — registers a cleanup callback to run before sign-out; returns an unregister function
- `AuthProvider` (component) — context provider that subscribes to Firebase auth state, manages `currentUser` / `idToken` / `isLoading`, syncs auth cookies, registers the token provider, and exposes sign-in/sign-out methods

### Exports

- `AuthContextValue` — named
- `AuthContext` — named
- `registerBeforeSignOut` — named
- `AuthProvider` — named

---

## auth.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `act`, `waitFor` for rendering and async assertions
- `firebase/auth` — `User` type used in mock helper
- `@/store/auth` — `AuthContext`, `AuthProvider` under test

### Definitions

- `firebaseMocks` (const) — hoisted vi mocks for `onAuthStateChanged`, `signInWithPopup`, `signOut`
- `makeUser` (function) — factory that returns a partial `User` with a mocked `getIdToken`
- `mockAuthWith` (function) — configures `onAuthStateChanged` to fire with the given user after a microtask tick

### Exports

- _(no exports; test file)_

---

## group-invitations.tsx

### Imports

- `react` — `createContext`, `useCallback`, `useContext`, `useEffect`, `useMemo`, `useState`, `ReactNode` for context and state management
- `@/hooks/useAuth` — `useAuth` to gate fetching on auth state
- `@/services/groups.service` — `getMyGroupInvitations` API call
- `@/types/group` — `GroupInvitation` response type

### Definitions

- `GroupInvitationsContextValue` (interface) — shape of the context: `invitations`, `count`, `isLoading`, `refresh`
- `GroupInvitationsContext` (const) — React context holding `GroupInvitationsContextValue | null`
- `GroupInvitationsProvider` (component) — fetches the authenticated user's group invitations on mount and when auth changes; exposes a `refresh` callback; skips fetch when unauthenticated
- `useGroupInvitations` (hook) — reads `GroupInvitationsContext`; throws if used outside the provider

### Exports

- `GroupInvitationsContextValue` — named
- `GroupInvitationsContext` — named
- `GroupInvitationsProvider` — named
- `useGroupInvitations` — named

---

## group-invitations.test.tsx

### Imports

- `react` — `ReactNode` for wrapper typing
- `@testing-library/react` — `renderHook`, `waitFor`, `act` for hook testing
- `firebase/auth` — `User` type used in mock helper
- `@/store/auth` — `AuthContextValue` type used in mock helper
- `@/hooks/useAuth` — `useAuth` (mocked)
- `@/store/group-invitations` — `GroupInvitationsProvider`, `useGroupInvitations` under test
- `@/types/group` — `GroupInvitation` for fixture typing

### Definitions

- `mocks` (const) — hoisted `mockApiGet` vi mock for the Axios client
- `makeAuth` (function) — factory returning a full `AuthContextValue` with overridable fields
- `makeFirebaseUser` (function) — factory returning a partial `User`
- `wrapper` (function) — React wrapper that wraps children in `GroupInvitationsProvider`
- `mockInvitation` (const) — fixture `GroupInvitation` object used across tests

### Exports

- _(no exports; test file)_

---

## trip-invitations.tsx

### Imports

- `react` — `createContext`, `useCallback`, `useContext`, `useEffect`, `useMemo`, `useState`, `ReactNode` for context and state management
- `@/hooks/useAuth` — `useAuth` to gate fetching on auth state
- `@/services/trips.service` — `getMyTripInvitations` API call
- `@/services/trips.types` — `MyTripInvitationResponse` response type

### Definitions

- `TripInvitationsContextValue` (interface) — shape of the context: `invitations`, `count`, `isLoading`, `refresh`
- `TripInvitationsContext` (const) — React context holding `TripInvitationsContextValue | null`
- `TripInvitationsProvider` (component) — fetches the authenticated user's trip invitations on mount and when auth changes; exposes a `refresh` callback; skips fetch when unauthenticated
- `useTripInvitations` (hook) — reads `TripInvitationsContext`; throws if used outside the provider

### Exports

- `TripInvitationsContextValue` — named
- `TripInvitationsContext` — named
- `TripInvitationsProvider` — named
- `useTripInvitations` — named

---

## trip-invitations.test.tsx

### Imports

- `react` — `ReactNode` for wrapper typing
- `@testing-library/react` — `renderHook`, `waitFor`, `act` for hook testing
- `firebase/auth` — `User` type used in mock helper
- `@/store/auth` — `AuthContextValue` type used in mock helper
- `@/hooks/useAuth` — `useAuth` (mocked)
- `@/store/trip-invitations` — `TripInvitationsProvider`, `useTripInvitations` under test
- `@/services/trips.types` — `MyTripInvitationResponse` for fixture typing

### Definitions

- `mocks` (const) — hoisted `mockApiGet` vi mock for the Axios client
- `makeAuth` (function) — factory returning a full `AuthContextValue` with overridable fields
- `makeFirebaseUser` (function) — factory returning a partial `User`
- `wrapper` (function) — React wrapper that wraps children in `TripInvitationsProvider`
- `mockInvitation` (const) — fixture `MyTripInvitationResponse` object used across tests

### Exports

- _(no exports; test file)_

---

## user.tsx

### Imports

- `react` — `createContext`, `useCallback`, `useEffect`, `useMemo`, `useState`, `ReactNode` for context and state management
- `react-dom` — `preload` to eagerly preload the user avatar image during render
- `@chamuco/shared-types` — `ProfileVisibility`, `ResolvedAsset` shared enums/types
- `@/hooks/useAuth` — `useAuth` to gate fetching on auth state
- `@/services/users.service` — `getMe` API call to fetch the current user's profile

### Definitions

- `AppUser` (interface) — application-level user shape: `id`, `username`, `displayName`, `avatar`, `timezone`, `profileVisibility`
- `UserContextValue` (interface) — shape of the context: `appUser`, `isLoading`, `refresh`
- `UserContext` (const) — React context holding `UserContextValue | null`
- `UserProvider` (component) — fetches the authenticated user's profile on mount; synchronously calls `preload` when an avatar URL is available; exposes `refresh` to re-fetch; clears `appUser` on sign-out

### Exports

- `AppUser` — named
- `UserContextValue` — named
- `UserContext` — named
- `UserProvider` — named

---

## user.test.tsx

### Imports

- `@testing-library/react` — `renderHook`, `waitFor` for hook testing
- `firebase/auth` — `User` type used in mock helper
- `@chamuco/shared-types` — `ProfileVisibility` enum used in API fixtures
- `@/store/auth` — `AuthContextValue` type used in mock helper
- `react` — `useContext`, `ReactNode` for context reading and wrapper typing
- `@/hooks/useAuth` — `useAuth` (mocked)
- `@/store/user` — `UserContext`, `UserProvider` under test

### Definitions

- `mocks` (const) — hoisted `mockApiGet` vi mock for the Axios client
- `makeAuth` (function) — factory returning a full `AuthContextValue` with overridable fields
- `makeFirebaseUser` (function) — factory returning a partial `User`
- `wrapper` (function) — React wrapper that wraps children in `UserProvider`

### Exports

- _(no exports; test file)_
