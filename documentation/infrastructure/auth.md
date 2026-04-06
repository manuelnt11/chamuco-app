# Infrastructure: Authentication & Authorization

**Status:** Defined
**Last Updated:** 2026-04-06

---

## Authentication Provider: Firebase Authentication

All authentication is handled by **Firebase Authentication** (part of Google Cloud / Firebase). The app does not implement its own identity system — token issuance, signing, refresh, revocation, and provider management are fully delegated to Firebase.

This choice eliminates an entire category of implementation and maintenance risk (token key management, refresh rotation, brute force protection, provider SDK updates) and is free at any scale for social sign-in providers.

---

## Supported Authentication Methods

Both providers are supported at launch. Users may link multiple providers to the same account via Firebase's account linking feature.

### Google Sign-In

Firebase handles the full OAuth 2.0 / OpenID Connect flow natively.

**Frontend flow:**

1. User clicks "Sign in with Google".
2. Firebase SDK (`firebase/auth`) opens the Google OAuth consent screen.
3. On success, Firebase issues a **Firebase ID token** to the client.
4. The client sends the ID token to the backend on the first request to establish a session.

**Backend flow:**

1. Backend receives the Firebase ID token in the `Authorization: Bearer <token>` header.
2. Backend verifies it using the **Firebase Admin SDK** (`admin.auth().verifyIdToken(token)`).
3. On first login, backend creates the `users` record using the verified `uid`, `email`, and `display_name` from the decoded token. See [User Provisioning](#user-provisioning) below.
4. On subsequent logins, backend retrieves the existing user by `firebase_uid`.
5. All subsequent API calls are authenticated by verifying the Firebase ID token — no separate Chamuco-issued JWT is needed.

### Facebook Sign-In

Firebase Authentication supports Facebook Login natively via the Facebook OAuth flow. The integration is symmetric with Google Sign-In from the backend's perspective — Firebase abstracts the provider difference.

**Frontend flow:**

1. User clicks "Sign in with Facebook".
2. Firebase SDK (`firebase/auth`) opens the Facebook OAuth consent dialog.
3. On success, Firebase issues a **Firebase ID token** to the client.
4. Identical to Google from this point forward.

**Backend flow:** Identical to Google Sign-In. The `auth_provider` field on the `users` record distinguishes the source.

**Requirement:** A Facebook App must be registered and configured in the Firebase Console. The App ID and App Secret are stored in GCP Secret Manager.

---

## Session Management

Firebase ID tokens are short-lived (1 hour by default). The Firebase client SDK handles token refresh automatically and transparently — the client always sends a valid, non-expired token without any custom refresh logic in the app.

| Concern                      | Handled by                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Token issuance               | Firebase Authentication                                                       |
| Token signing & verification | Firebase (RS256, Google-managed keys)                                         |
| Token refresh                | Firebase SDK (automatic, client-side)                                         |
| Token revocation             | `admin.auth().revokeRefreshTokens(uid)` — called on logout or security events |
| Brute force / rate limiting  | Firebase (built-in)                                                           |

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

On the first successful authentication (either provider):

- The backend creates a `users` record with `auth_provider = GOOGLE | FACEBOOK` and `firebase_uid` from the decoded token.
- The `email` and `display_name` are pre-populated directly from the provider's token — no manual entry required.
  - Google: `display_name` from the Google account name.
  - Facebook: `display_name` from the Facebook profile name.
- The user is directed to the onboarding flow to choose their `username` before proceeding. The `display_name` is pre-filled with the value from the provider but remains editable.

---

## Authorization

Authorization uses **Role-Based Access Control (RBAC)** layered across three scopes:

| Layer    | Roles                                      | Enforced at         |
| -------- | ------------------------------------------ | ------------------- |
| Platform | `USER`, `SUPPORT_ADMIN`                    | Global API guards   |
| Trip     | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT` | Trip-scoped guards  |
| Group    | `OWNER`, `ADMIN`, `MEMBER`                 | Group-scoped guards |

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

## SUPPORT_ADMIN Bootstrap

The first `SUPPORT_ADMIN` user cannot be created from within the app — the role is not assignable through the UI. It must be seeded manually via a one-time script after Firebase is configured and the database is running.

### Prerequisites

1. Firebase project is set up and Authentication is enabled (Google Sign-In and/or Facebook Sign-In configured).

2. The `chamuco-api-sa` service account has permission to read the Firebase service account secret:

   ```bash
   gcloud secrets add-iam-policy-binding FIREBASE_SERVICE_ACCOUNT_JSON \
     --member="serviceAccount:chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=chamuco-app-mn
   ```

3. The designated admin account has **signed in via Google or Facebook OAuth** at least once so that Firebase Authentication has created a UID for them.

   > **Important:** Being a Firebase project owner or GCP IAM collaborator does NOT create a Firebase Authentication user. The admin must complete an actual OAuth sign-in (Google or Facebook) through a Firebase-enabled client — such as the deployed app — before a UID is generated.

4. The `firebase_uid` of that account is available from **Firebase Console → Authentication → Users** (the "User UID" column).

### Environment variables

| Variable                   | Required | Description                                           |
| -------------------------- | -------- | ----------------------------------------------------- |
| `DATABASE_URL`             | Yes      | PostgreSQL connection string                          |
| `SEED_ADMIN_FIREBASE_UID`  | Yes      | UID from Firebase Console → Authentication → Users    |
| `SEED_ADMIN_EMAIL`         | Yes      | Admin email address                                   |
| `SEED_ADMIN_USERNAME`      | Yes      | Unique username (3–30 chars, lowercase `a-z 0-9 _ -`) |
| `SEED_ADMIN_DISPLAY_NAME`  | Yes      | Display name shown in the app                         |
| `SEED_ADMIN_AUTH_PROVIDER` | No       | `GOOGLE` (default) or `FACEBOOK`                      |

### Running the seed

**Local / staging:**

```bash
SEED_ADMIN_FIREBASE_UID="<uid_from_firebase_console>" \
SEED_ADMIN_EMAIL="admin@chamucotravel.com" \
SEED_ADMIN_USERNAME="chamuco_admin" \
SEED_ADMIN_DISPLAY_NAME="Chamuco Admin" \
pnpm --filter api db:seed-admin
```

**Production (via Cloud SQL Auth Proxy):**

```bash
# 1. Start the Cloud SQL Auth Proxy (port 5433 to avoid conflict with local Docker)
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433

# 2. In a second terminal, run the seed against prod
DATABASE_URL="postgresql://postgres:<password>@localhost:5433/chamuco_prod" \
SEED_ADMIN_FIREBASE_UID="<uid_from_firebase_console>" \
SEED_ADMIN_EMAIL="admin@chamucotravel.com" \
SEED_ADMIN_USERNAME="chamuco_admin" \
SEED_ADMIN_DISPLAY_NAME="Chamuco Admin" \
pnpm --filter api db:seed-admin
```

Replace `<password>` with the `postgres` user password retrieved from GCP Secret Manager.

### Implementation notes

- The seed script is idempotent — running it multiple times is safe (upsert on `firebase_uid`).
- The script also creates the corresponding `user_preferences` record with default values (`language: ES`, `currency: COP`, `theme: SYSTEM`).
- Environment variables are never committed. Pass them inline as shown above or store them in a local `.env.seed` file (gitignored) and source it before running.
- This script is a one-time operational step, **not** part of the CI/CD pipeline.

### Timing

Run this script after:

1. The Firebase Admin SDK (`AuthModule`) is deployed and the app is running — see issue #69.
2. The admin has completed their first Google or Facebook sign-in through the live app, confirming their UID exists in Firebase Authentication.

---

## Cost

Firebase Authentication is **free for Google Sign-In and Facebook Sign-In** regardless of user volume (Spark and Blaze plans). If email/password auth is added in the future, the free tier covers 10,000 MAU/month; beyond that the cost is $0.0055/MAU — negligible for a travel coordination app.
