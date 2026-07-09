# Inventory: types

---

## express.d.ts

### Imports

- `firebase-admin/auth` — `DecodedIdToken`: type for decoded Firebase ID token payload
- `drizzle-orm` — `InferSelectModel`: utility type that infers the select row type from a Drizzle table schema
- `@/modules/users/schema/users.schema` — `users`: Drizzle table definition used to derive `AuthenticatedUser`

### Definitions

- `AuthenticatedUser` (type) — Row type of the `users` table inferred via Drizzle's `InferSelectModel`; used as the shape of `req.user` on authenticated requests
- `Express.Request` (interface augmentation) — Extends Express's global `Request` interface with `firebaseUser?: DecodedIdToken` (raw Firebase token) and `user?: AuthenticatedUser` (resolved DB user)

### Exports

- `AuthenticatedUser` — named
