# Inventory: hooks

---

## useAuth.ts

### Imports

- `react` — `useContext` for reading the auth context
- `@/store/auth` — `AuthContext` (context object), `AuthContextValue` (type for the returned value)

### Definitions

- `useAuth` (hook) — reads `AuthContext` and throws a descriptive error if called outside `AuthProvider`

### Exports

- `useAuth` — named

---

## useAuth.test.ts

### Imports

- `@testing-library/react` — `renderHook` for mounting hooks in tests
- `react` — `ReactNode` type used in the wrapper component
- `@/store/auth` — `AuthProvider` used as the test wrapper
- `./useAuth` — `useAuth` under test

### Definitions

- No substantial non-test definitions.

### Exports

- None

---

## useCitySearch.ts

### Imports

- `axios` — `axios.isCancel` to silence abort-related rejections
- `react` — `useEffect`, `useState` for state and side-effect management
- `@chamuco/shared-types` — `CityResult` type for the search results array
- `@/services/places.service` — `searchCities` API call

### Definitions

- `useCitySearch` (hook) — debounced (300 ms) city search by `country` + `query`; skips queries shorter than 2 chars; cancels in-flight requests via `AbortController` on dependency change

### Exports

- `useCitySearch` — named

---

## useCitySearch.test.ts

### Imports

- `@testing-library/react` — `act`, `renderHook`
- `axios` — `axios`, `AxiosRequestConfig` (used to inspect abort signals in tests)
- `./useCitySearch` — `useCitySearch` under test
- `@/services/api-client` — `apiClient` (mocked; `get` spy)

### Definitions

- `apiResponse` (function) — test helper that wraps a city array in an Axios-style resolved promise

### Exports

- None

---

## useFileUpload.ts

### Imports

- `react` — `useState`, `useCallback` for state and stable callback references
- `@chamuco/shared-types` — `UploadType` enum for classifying upload destinations
- `@/services/uploads.service` — `getSignedUrl` to request a GCS signed URL from the API
- `@/services/gcs-upload` — `uploadToGcs` for the direct-to-GCS XHR PUT

### Definitions

- `UseFileUploadOptions` (interface) — `{ uploadType: UploadType; contextId: string }`
- `UseFileUploadReturn` (interface) — `{ upload, progress, isUploading, error, reset }`
- `useFileUpload` (hook) — fetches a signed URL from the API then drives a GCS upload with progress tracking; exposes `upload(file)`, progress %, loading flag, error string, and a `reset` callback

### Exports

- `UploadType` — named (re-export from `@chamuco/shared-types`)
- `UseFileUploadOptions` — named
- `UseFileUploadReturn` — named
- `useFileUpload` — named

---

## useFileUpload.test.ts

### Imports

- `@testing-library/react` — `renderHook`, `act`
- `vitest` — `vi`, `describe`, `it`, `expect`, `beforeEach`
- `@chamuco/shared-types` — `UploadType`
- `./useFileUpload` — `useFileUpload` under test
- `@/services/api-client` — `apiClient` (mocked; `post` spy)
- `@/services/gcs-upload` — `uploadToGcs` (mocked)

### Definitions

- No substantial non-test definitions.

### Exports

- None

---

## useGroupPickerSearch.ts

### Imports

- `axios` — `axios.isCancel` to silence abort-related rejections
- `react` — `useEffect`, `useRef`, `useState`
- `@/services/groups.service` — `getGroups` (fetch current user's groups), `searchGroups` (public search)
- `@/types/group` — `Group`, `GroupSearchResult` types

### Definitions

- `GroupPickerSearchResults` (interface) — `{ myGroups: Group[]; publicGroups: GroupSearchResult[]; isLoading: boolean }`
- `useGroupPickerSearch` (hook) — fetches the user's own groups once on mount (cached via `useRef`); debounces public group search (300 ms); returns filtered local groups alongside public search results

### Exports

- `GroupPickerSearchResults` — named
- `useGroupPickerSearch` — named

---

## useGroupSearch.ts

### Imports

- `axios` — `axios.isCancel` to silence abort-related rejections
- `react` — `useEffect`, `useState`
- `@/services/groups.service` — `searchGroups` API call
- `@/types/group` — `GroupSearchResult` type

### Definitions

- `useGroupSearch` (hook) — debounced (300 ms) paginated group search; skips blank queries; cancels in-flight requests on dependency change; returns `{ results, total, isLoading }`

### Exports

- `useGroupSearch` — named

---

## useLanguageCycle.ts

### Imports

- `react` — `useEffect`, `useState`
- `react-i18next` — `useTranslation` for `i18n.language` and the `errors` namespace error toast
- `@chamuco/shared-types` — `AppLanguage` type
- `@/lib/i18n/config` — `SupportedLanguage` type
- `@/lib/i18n/utils` — `getNextLanguage` cycle helper
- `@/lib/i18n/client` — `changeLanguage` to apply the switch
- `@/hooks/useAuth` — `useAuth` to gate persistence on a signed-in user
- `@/services/users.service` — `updateMyPreferences` to persist the choice
- `@/components/ui/toast` — `toast.error` shown when persistence fails

### Definitions

- `useLanguageCycle` (hook) — shared language-cycling behavior for `LanguageToggle` and the `UserAvatar` dropdown; `cycleLanguage()` applies the next language optimistically, persists it for signed-in users, and rolls back + shows an error toast if the persist call fails; returns `{ language, mounted, cycleLanguage }`

### Exports

- `useLanguageCycle` — named

---

## useLanguageCycle.test.ts

### Imports

- `@testing-library/react` — `renderHook`, `act`
- `firebase/auth` — `User` type
- `@/components/ui/toast` — `toast` (mocked)
- `@/lib/i18n/client`, `@/services/api-client`, `@/hooks/useAuth` — mocked dependencies
- `./useLanguageCycle` — hook under test

### Definitions

- No substantial non-test definitions.

### Exports

- None

---

## useNotifications.ts

### Imports

- `react` — `useCallback`, `useEffect`, `useRef`, `useState`
- `axios` — `axios.isCancel` to silence abort-related rejections
- `@chamuco/shared-types` — `NotificationItem` type
- `@/services/notifications.service` — `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`

### Definitions

- `POLL_INTERVAL_MS` (const) — polling interval value (30 000 ms); non-exported but drives hook behavior
- `useNotifications` (hook) — fetches the first 20 notifications on mount; polls every 30 s; re-fetches on `chamuco:notification` window custom event; provides optimistic `markRead(id)` and `markAllRead()`; returns `{ notifications, unreadCount, isLoading, markRead, markAllRead }`

### Exports

- `useNotifications` — named

---

## useNotifications.test.ts

### Imports

- `@testing-library/react` — `act`, `renderHook`, `waitFor`
- `@chamuco/shared-types` — `NotificationType`, `NotificationItem`
- `./useNotifications` — `useNotifications` under test
- `@/services/api-client` — `apiClient` (mocked; `get` and `patch` spies)

### Definitions

- `makeNotification` (function) — test factory that produces a `NotificationItem` with sensible defaults
- `pageResponse` (function) — wraps a notification array and unread count in an Axios-style resolved promise

### Exports

- None

---

## usePendingJoinRequests.ts

### Imports

- `react` — `useCallback`, `useEffect`, `useState`

### Definitions

- `usePendingJoinRequests` (hook, generic `<T>`) — fetch/cancel/error state for a "my pending join requests" list, parameterized by `fetchRequests`, `cancelRequest`, and `getId`; tracks in-flight cancels and per-item errors as `Set<string>` (not a single shared id) so concurrent cancels on different rows track independently; returns `{ requests, isLoading, cancellingIds, errorIds, cancel, refresh }`. Shared by `GroupJoinRequestsSection` and `TripJoinRequestsSection`.

### Exports

- `usePendingJoinRequests` — named

---

## usePendingJoinRequests.test.ts

### Imports

- `@testing-library/react` — `renderHook`, `act`, `waitFor`
- `./usePendingJoinRequests` — `usePendingJoinRequests` under test

### Definitions

- `makeOptions` (function) — builds default hook options with overridable `fetchRequests`/`cancelRequest`

### Exports

- None

---

## usePushNotifications.ts

### Imports

- `react` — `useEffect`, `useRef`
- `firebase/messaging` — `deleteToken`, `getToken`, `onMessage` for FCM token lifecycle and foreground message handling
- `@/hooks/useAuth` — `useAuth` to gate initialization on a signed-in user
- `@/lib/firebase/firebase` — `getFirebaseMessaging` lazy accessor
- `@/store/auth` — `registerBeforeSignOut` to hook cleanup into the sign-out flow
- `@/services/notifications.service` — `registerFcmToken`, `unregisterFcmToken` API calls
- `@/components/ui/toast` — `toast.info` for in-app foreground notification display
- `@/config/env` — `env.NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Definitions

- `usePushNotifications` (hook) — requests `Notification` permission; retrieves an FCM token; registers it with the API; subscribes to foreground messages (shows toast + dispatches `chamuco:notification` event); deregisters token before sign-out; cleans up on unmount

### Exports

- `usePushNotifications` — named

---

## usePushNotifications.test.ts

### Imports

- `@testing-library/react` — `renderHook`, `act`
- `firebase/messaging` — `MessagePayload` type; `getToken`, `onMessage`, `deleteToken` (mocked)
- `@/lib/firebase/firebase` — `getFirebaseMessaging` (mocked)
- `@/store/auth` — `registerBeforeSignOut` (mocked)
- `@/services/api-client` — `apiClient` (mocked; `post` and `delete` spies)
- `@/hooks/useAuth` — `useAuth` (mocked)
- `@/components/ui/toast` — `toast` (mocked)
- `./usePushNotifications` — `usePushNotifications` under test

### Definitions

- `setupBrowserEnv` (function) — test helper that stubs `window.Notification` and `navigator.serviceWorker` with a configurable permission result

### Exports

- None

---

## useThemeCycle.ts

### Imports

- `react` — `useEffect`, `useState`
- `next-themes` — `useTheme` for reading/setting the current theme
- `react-i18next` — `useTranslation` for the `errors` namespace error toast
- `@chamuco/shared-types` — `AppTheme` type
- `@/hooks/useAuth` — `useAuth` to gate persistence on a signed-in user
- `@/services/users.service` — `updateMyPreferences` to persist the choice
- `@/components/ui/toast` — `toast.error` shown when persistence fails

### Definitions

- `THEME_CYCLE` (const) — light → dark → system → light lookup map
- `getNextTheme` (function) — returns the next theme in the cycle for a given current value, defaulting to `'light'`
- `useThemeCycle` (hook) — shared theme-cycling behavior for `ThemeToggle` and the `UserAvatar` dropdown; `cycleTheme()` applies the next theme optimistically, persists it for signed-in users, and rolls back + shows an error toast if the persist call fails; returns `{ theme, mounted, cycleTheme }`

### Exports

- `getNextTheme` — named
- `useThemeCycle` — named

---

## useThemeCycle.test.ts

### Imports

- `@testing-library/react` — `renderHook`, `act`
- `firebase/auth` — `User` type
- `@/components/ui/toast` — `toast` (mocked)
- `next-themes`, `@/services/api-client`, `@/hooks/useAuth` — mocked dependencies
- `./useThemeCycle` — `useThemeCycle`, `getNextTheme` under test

### Definitions

- No substantial non-test definitions.

### Exports

- None

---

## useTripSearch.ts

### Imports

- `axios` — `axios.isCancel` to silence abort-related rejections
- `react` — `useEffect`, `useState`
- `@/services/trips.service` — `searchTrips` API call
- `@/services/trips.types` — `TripSearchResult` type

### Definitions

- `useTripSearch` (hook) — debounced (300 ms) paginated trip search; skips blank queries; cancels in-flight requests on dependency change; returns `{ results, total, isLoading }`

### Exports

- `useTripSearch` — named

---

## useTripSearch.test.ts

### Imports

- `@testing-library/react` — `act`, `renderHook`
- `axios` — `axios`, `AxiosRequestConfig`
- `./useTripSearch` — `useTripSearch` under test
- `@/services/api-client` — `apiClient` (mocked; `get` spy)

### Definitions

- `apiResponse` (function) — test helper wrapping a trip array in an Axios-style resolved promise

### Exports

- None

---

## useUser.ts

### Imports

- `react` — `useContext` for reading the user context
- `@/store/user` — `UserContext` (context object), `UserContextValue` (type for the returned value)

### Definitions

- `useUser` (hook) — reads `UserContext` and throws a descriptive error if called outside `UserProvider`

### Exports

- `useUser` — named

---

## useUser.test.ts

### Imports

- `react` — `createElement` used to wrap the hook in a `UserContext.Provider`
- `@testing-library/react` — `renderHook`
- `@chamuco/shared-types` — `ProfileVisibility` enum used in the mock context value
- `@/store/user` — `UserContext`, `UserContextValue`
- `./useUser` — `useUser` under test

### Definitions

- No substantial non-test definitions.

### Exports

- None

---

## useUserSearch.ts

### Imports

- `axios` — `axios.isCancel` to silence abort-related rejections
- `react` — `useEffect`, `useState`
- `@/services/users.service` — `searchUsers` API call
- `@/types/user` — `UserSearchResult` type

### Definitions

- `useUserSearch` (hook) — debounced (300 ms) user search; skips empty queries and bare `@`; cancels in-flight requests on dependency change; returns `{ results, isLoading }`

### Exports

- `useUserSearch` — named

---

## useUserSearch.test.ts

### Imports

- `@testing-library/react` — `act`, `renderHook`
- `axios` — `axios`, `AxiosRequestConfig`
- `./useUserSearch` — `useUserSearch` under test
- `@/services/api-client` — `apiClient` (mocked; `get` spy)

### Definitions

- `apiResponse` (function) — test helper wrapping a user result array in an Axios-style resolved promise

### Exports

- None
