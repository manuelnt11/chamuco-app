# Inventory: firebase

---

## firebase.ts

### Imports

- `firebase/app` — `getApp`, `getApps`, `initializeApp`: app lifecycle helpers to initialize or retrieve the Firebase app singleton
- `firebase/auth` — `getAuth`: returns the Auth instance for the app
- `firebase/messaging` — `getMessaging`, `Messaging` type: lazy FCM messaging instance and its type
- `@/config/env` — `env`: validated environment variable object supplying all `NEXT_PUBLIC_FIREBASE_*` keys

### Definitions

- `firebaseConfig` (const) — read-only object mapping Firebase client SDK config keys from `env`
- `app` (const) — Firebase app singleton: calls `initializeApp` only when no app exists yet, otherwise returns the existing app via `getApp`
- `_messaging` (const) — module-level cache variable holding the lazy `Messaging` instance (initialized on first browser call)
- `getFirebaseMessaging` (function) — returns the FCM `Messaging` instance; returns `null` on server (SSR guard); initializes lazily on first call

### Exports

- `auth` — named (Auth instance from `getAuth(app)`)
- `getFirebaseMessaging` — named
- `app` — default

---

## firebase.test.ts

### Imports

- `firebase/app` — `FirebaseApp` type: used to type the mock app object
- `firebase/auth` — `Auth` type: used to type the mock auth object

### Definitions

- `mockApp` (const) — stub `FirebaseApp` object used as the return value across all test scenarios
- `mockAuth` (const) — stub `Auth` object with `currentUser: null`
- `mockInitializeApp`, `mockGetApp`, `mockGetApps`, `mockGetAuth` (const) — Vitest mock functions replacing `firebase/app` and `firebase/auth` exports
- `describe('firebase')` test suite — covers: singleton initialization (no prior app vs. existing app), `auth` export correctness, default export correctness

### Exports

- _(none — test file, no exports)_

---

## providers.ts

### Imports

- `firebase/auth` — `FacebookAuthProvider`, `GoogleAuthProvider`: OAuth provider classes for Google and Facebook sign-in

### Definitions

- `googleProvider` (const) — singleton `GoogleAuthProvider` instance used for Google Sign-In flows
- `facebookProvider` (const) — singleton `FacebookAuthProvider` instance used for Facebook Sign-In flows

### Exports

- `googleProvider` — named
- `facebookProvider` — named

---

## providers.test.ts

### Imports

- `vitest` — `Mock` type: used to type the constructor mocks

### Definitions

- `mockGoogleAuthProvider`, `mockFacebookAuthProvider` (const) — Vitest mock constructor functions replacing `GoogleAuthProvider` and `FacebookAuthProvider`
- `describe('providers')` test suite — verifies `googleProvider` and `facebookProvider` are instances of their respective provider classes, and that each constructor is called exactly once per module evaluation

### Exports

- _(none — test file, no exports)_

---

## index.ts

### Imports

- `./firebase` — `auth`, default `app`: re-exported to consumers
- `./providers` — `facebookProvider`, `googleProvider`: re-exported to consumers

### Definitions

- _(none — barrel file only)_

### Exports

- `auth` — named (barrel re-export from `./firebase`)
- `app` — named, aliased from default export of `./firebase` (barrel re-export)
- `facebookProvider` — named (barrel re-export from `./providers`)
- `googleProvider` — named (barrel re-export from `./providers`)
