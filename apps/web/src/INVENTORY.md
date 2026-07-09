# Inventory: src

---

## proxy.ts

### Imports

- `next/server` — `NextResponse` (HTTP response builder), `NextRequest` (type for incoming middleware request)
- `@/lib/auth-cookies` — `COOKIE_CHAMUCO_AUTH_NAME`, `COOKIE_CHAMUCO_REGISTERED_NAME` (cookie name constants for auth state)

### Definitions

- `proxy` (function) — Route-level auth guard implementing three-state logic (unauthenticated / auth+unregistered / fully authenticated); handles special routing for `/sign-in`, `/onboarding`, public legal pages, and all other protected routes
- `config` (const) — Next.js middleware matcher config that excludes `_next/static`, `_next/image`, `favicon.ico`, `icons/`, `api/`, and files with extensions from middleware processing

### Exports

- `proxy` — default
- `config` — named

---

## proxy.test.ts

### Imports

- `./proxy` — `proxy` (the function under test)
- `next/server` (via `vi.mock`) — `NextResponse` mocked with `next` and `redirect` spy functions

### Definitions

- `makeRequest` (function) — Test helper (>5 lines) that constructs a minimal mock `NextRequest`-compatible object with a URL and optional cookie store; used to build inputs for `proxy` across all test cases

### Exports

- _(none — test file, no exports)_

---
