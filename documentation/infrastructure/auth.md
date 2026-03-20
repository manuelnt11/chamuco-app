# Infrastructure: Authentication & Authorization

**Status:** Defined
**Last Updated:** 2026-03-15

---

## Authentication Provider: Firebase Authentication

All authentication is handled by **Firebase Authentication** (part of Google Cloud / Firebase). The app does not implement its own identity system — token issuance, signing, refresh, revocation, and provider management are fully delegated to Firebase.

This choice eliminates an entire category of implementation and maintenance risk (token key management, refresh rotation, brute force protection, provider SDK updates) and is free at any scale for Google Sign-In.

---

## Supported Authentication Methods

### Google Sign-In

The primary authentication method at launch. Firebase handles the full OAuth 2.0 / OpenID Connect flow natively.

**Frontend flow:**
1. User clicks "Sign in with Google".
2. Firebase SDK (`firebase/auth`) opens the Google OAuth consent screen.
3. On success, Firebase issues a **Firebase ID token** to the client.
4. The client sends the ID token to the backend on the first request to establish a session.

**Backend flow:**
1. Backend receives the Firebase ID token in the `Authorization: Bearer <token>` header.
2. Backend verifies it using the **Firebase Admin SDK** (`admin.auth().verifyIdToken(token)`).
3. On first login, backend creates the `users` record using the verified `uid`, `email`, and `display_name` from the decoded token.
4. On subsequent logins, backend retrieves the existing user by `auth_provider_id = uid`.
5. All subsequent API calls are authenticated by verifying the Firebase ID token — no separate Chamuco-issued JWT is needed.

### Passkeys (WebAuthn / FIDO2)

Firebase Authentication supports Passkeys natively. Users can enroll a passkey from their account settings after first login. On subsequent logins, they authenticate via device biometrics (Face ID, fingerprint, device PIN) without needing Google.

**Planned for a post-launch release.** The architecture fully supports it — no structural changes are needed when it is enabled.

---

## Session Management

Firebase ID tokens are short-lived (1 hour by default). The Firebase client SDK handles token refresh automatically and transparently — the client always sends a valid, non-expired token without any custom refresh logic in the app.

| Concern | Handled by |
|---|---|
| Token issuance | Firebase Authentication |
| Token signing & verification | Firebase (RS256, Google-managed keys) |
| Token refresh | Firebase SDK (automatic, client-side) |
| Token revocation | `admin.auth().revokeRefreshTokens(uid)` — called on logout or security events |
| Brute force / rate limiting | Firebase (built-in) |

---

## Backend Integration (NestJS)

The `AuthModule` in NestJS integrates Firebase via the **Firebase Admin SDK** (`firebase-admin`).

### `FirebaseAuthGuard`

A custom NestJS guard that replaces the generic `JwtAuthGuard`. On each request:

1. Extracts the Bearer token from the `Authorization` header.
2. Calls `admin.auth().verifyIdToken(token)`.
3. If valid, attaches the decoded token (including `uid` and `email`) to the request object as `req.firebaseUser`.
4. A subsequent step resolves the internal `users` record from `auth_provider_id = uid` and attaches it as `req.user`.
5. If the token is invalid or expired, returns `401 Unauthorized`.

### User provisioning

On the first successful authentication:
- The backend creates a `users` record with `auth_provider = GOOGLE` and `auth_provider_id = firebase_uid`.
- The `email` and a provisional `display_name` are pre-populated from the Firebase token.
- The user is directed to the onboarding flow to choose their `username` before proceeding.

---

## Authorization

Authorization uses **Role-Based Access Control (RBAC)** layered across three scopes:

| Layer | Roles | Enforced at |
|---|---|---|
| Platform | `USER`, `SUPPORT_ADMIN` | Global API guards |
| Trip | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT` | Trip-scoped guards |
| Group | `OWNER`, `ADMIN`, `MEMBER` | Group-scoped guards |

NestJS implementation:
- A custom `@Roles()` decorator declares required roles on controller methods.
- A `RolesGuard` reads the current user's roles from `req.user` and compares against the declared requirements.
- For trip/group-scoped roles, the guard resolves the user's role within the specific resource being accessed (trip participant record or group member record).

### Support Admin Bypass

When `req.user.platform_role === 'SUPPORT_ADMIN'`, all trip-scoped and group-scoped guards short-circuit and allow the request through regardless of membership, status, or permission checks. The `FirebaseAuthGuard` still runs — support admins must authenticate with a valid Firebase token. Authentication is never bypassed; only authorization is.

Every write request from a `SUPPORT_ADMIN` is intercepted by a `SupportAdminAuditInterceptor` that:

1. Captures the before-state of the affected record(s) before the handler runs.
2. Lets the handler execute normally.
3. Captures the after-state and writes an immutable entry to `support_admin_audit_log`.

The audit log records: `admin_user_id`, `action`, `target_table`, `target_id`, `before_state` (JSONB), `after_state` (JSONB), `performed_at`. Read-only requests by a support admin are not logged.

---

## Security Considerations

- All communication is over **HTTPS** (enforced at GCP load balancer / Cloud Run level).
- Firebase ID tokens are verified against Google's public JWKS endpoint on every request — no local secret to manage or rotate.
- Token revocation is enforced on logout by calling `admin.auth().revokeRefreshTokens(uid)`.
- CSRF protection is applied on state-mutating endpoints.
- The Firebase Admin SDK credentials (service account key) are stored in **GCP Secret Manager** and injected at runtime via environment variables — never committed to the repository.

---

## Cost

Firebase Authentication is **free for Google Sign-In** regardless of user volume (Spark and Blaze plans). Passkeys are also free. If email/password auth is added in the future, the free tier covers 10,000 MAU/month; beyond that the cost is $0.0055/MAU — negligible for a travel coordination app.
