# Infrastructure: Authentication & Authorization

**Status:** Design Phase
**Last Updated:** 2026-03-14

---

## Authentication Methods

### Primary: Google SSO

Users authenticate using their Google account via **OAuth 2.0 / OpenID Connect**. This is the primary and required authentication method at launch.

Flow:
1. User clicks "Sign in with Google" on the Chamuco web/app.
2. Redirected to Google's OAuth consent screen.
3. On success, Google returns an authorization code.
4. Backend exchanges the code for `id_token` and `access_token`.
5. Backend validates the `id_token`, extracts the Google user ID and email.
6. Backend creates or retrieves the matching `user` record.
7. Backend issues a **Chamuco session token** (JWT) to the client.
8. All subsequent API requests use the Chamuco JWT — not the Google token.

### Secondary (Planned): Passkeys

**Passkeys** (WebAuthn / FIDO2) provide a phishing-resistant, passwordless login option using device biometrics (face ID, fingerprint, device PIN).

- A registered user can enroll a passkey from their device settings.
- On subsequent logins, they authenticate via biometrics without needing Google.
- This is planned for a later release. The architecture should not block its addition.

---

## Session Management

- **Token type:** JWT (JSON Web Tokens)
- **Access token TTL:** Short-lived (e.g., 15–60 minutes). Configurable.
- **Refresh token:** Long-lived (e.g., 30 days), stored securely (HTTP-only cookie or secure storage).
- **Token rotation:** Refresh tokens are rotated on each use.
- **Revocation:** Refresh tokens can be revoked on logout or security events.

Token payload (claims):
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["USER"],
  "iat": 1700000000,
  "exp": 1700003600
}
```

---

## Authorization

Authorization uses **Role-Based Access Control (RBAC)** with three role layers:

| Layer | Roles | Enforced at |
|---|---|---|
| Platform | `USER`, `MODERATOR`, `ADMIN` | Global API guards |
| Trip | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT` | Trip-scoped guards |
| Group | `OWNER`, `ADMIN`, `MEMBER` | Group-scoped guards |

NestJS implementation:
- A custom `@Roles()` decorator declares required roles on controller methods.
- A `RolesGuard` reads the current user's roles from the JWT and compares against the required roles.
- For trip/group-scoped roles, the guard resolves the user's role within the specific resource being accessed.

---

## Security Considerations

- All communication is over **HTTPS** (enforced via GCP load balancer / Cloud Run).
- JWT signing uses **RS256** (asymmetric) — private key on server, public key verifiable externally.
- Google `id_token` is validated against Google's public JWKS endpoint on every login.
- CSRF protection is applied on state-mutating endpoints.
- Rate limiting on auth endpoints to prevent brute force (NestJS `ThrottlerModule` or a GCP-level WAF rule).

---

## Google Cloud Identity Platform (Optional)

GCP's **Identity Platform** (Firebase Auth) is an alternative worth evaluating. It provides:
- Managed Google SSO flow
- Passkeys support out of the box
- Built-in token management
- Easy integration with other GCP services

Tradeoff: introduces a dependency on Firebase's auth service, adding cost and vendor lock-in. The custom JWT approach gives more control.

> **Decision pending:** Custom JWT flow vs. GCP Identity Platform. To be resolved before implementation starts.
