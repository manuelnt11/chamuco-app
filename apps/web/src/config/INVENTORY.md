# Inventory: config

---

## app.constants.ts

### Imports

- (none)

### Definitions

- `CONTACT_EMAIL` (const) — Static contact email address for Chamuco Travel support.

### Exports

- `CONTACT_EMAIL` — named

---

## env.constants.ts

### Imports

- (none)

### Definitions

- `REQUIRED_VARS` (const) — `as const` tuple listing all required `NEXT_PUBLIC_` environment variable names used for startup validation and type derivation.
- `EnvKey` (type) — Union type of every string literal in `REQUIRED_VARS`; used to key the validated env record.

### Exports

- `REQUIRED_VARS` — named
- `EnvKey` — named

---

## env.test.ts

### Imports

- `@/config/env.constants` — `REQUIRED_VARS` for iterating over keys in helpers

### Definitions

- `setEnv` (function) — Helper that sets or deletes individual `process.env` keys from a partial overrides map; used to arrange test environment state.
- `setAllEnv` (function) — Sets all required env vars to fixed test values; call before each test that expects a valid env.
- `clearAllEnv` (function) — Deletes all required env vars from `process.env`; used in `beforeEach`/`afterEach` cleanup.

### Exports

- (none — test file, no exports)

---

## env.ts

### Imports

- `@/config/env.constants` — `EnvKey` type for return-type annotation of `validateEnv`

### Definitions

- `validateEnv` (function) — Reads every `NEXT_PUBLIC_` var via explicit literal access (required for Next.js static replacement), collects missing/empty keys, and throws a descriptive `Error` listing them; returns a fully-typed `Record<EnvKey, string>` on success.

### Exports

- `env` — named (singleton result of `validateEnv()`, evaluated at module load time)
