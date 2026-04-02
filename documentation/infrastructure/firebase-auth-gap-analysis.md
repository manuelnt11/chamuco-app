# Firebase Authentication Gap Analysis - Chamuco App

**Fecha**: 2026-03-29
**Auditor**: Infrastructure Audit (Issue #45, Phase 5)
**Status**: 📝 DOCUMENTED (NOT IMPLEMENTED)
**Priority**: P1 — Required for MVP but deferred to dedicated epic

---

## Executive Summary

Firebase Authentication is **fully documented but completely unimplemented**. This gap analysis documents the delta between the documented authentication architecture in `documentation/infrastructure/auth.md` and the current codebase reality.

### Key Findings

| Component Category    | Documented | Implemented | Gap Severity |
| --------------------- | ---------- | ----------- | ------------ |
| Firebase Admin SDK    | ✅         | ❌          | CRITICAL     |
| Auth Module           | ✅         | ❌          | CRITICAL     |
| Guards & Decorators   | ✅         | ❌          | CRITICAL     |
| Database Schema       | ✅         | ❌          | CRITICAL     |
| User Provisioning     | ✅         | ❌          | CRITICAL     |
| Support Admin Audit   | ✅         | ❌          | HIGH         |
| Environment Variables | ✅         | ❌          | HIGH         |
| GCP Secrets           | ✅         | ❌          | HIGH         |

**Gap Summary**: 100% documentation, 0% implementation

**Recommendation**: Create a dedicated epic issue (e.g., "Epic: Firebase Authentication — MVP") to implement all authentication components before production launch.

---

## Detailed Gap Matrix

### Backend Components

#### 1. Firebase Admin SDK Integration

**Documentation**: `documentation/infrastructure/auth.md` lines 72-93

**Documented Behavior**:

- Backend integrates Firebase via `firebase-admin` npm package
- `AuthModule` initializes Firebase Admin SDK with service account credentials
- Token verification via `admin.auth().verifyIdToken(token)`
- Token revocation via `admin.auth().revokeRefreshTokens(uid)`

**Current Implementation**:

```bash
$ grep -i "firebase" apps/api/package.json
(no output — firebase-admin is not installed)

$ find apps/api/src -type d -name "*auth*"
(no output — AuthModule does not exist)
```

**Gap**: ❌ CRITICAL

- `firebase-admin` not in `package.json`
- No `AuthModule` in `apps/api/src/modules/`
- No Firebase initialization code

**Effort to Implement**: 2-3 hours

- Install `firebase-admin`
- Create `AuthModule`
- Initialize SDK with service account credentials from Secret Manager

---

#### 2. FirebaseAuthGuard

**Documentation**: `documentation/infrastructure/auth.md` lines 74-82

**Documented Behavior**:

```typescript
// Conceptual structure (documented, not implemented)
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request);
    const decodedToken = await admin.auth().verifyIdToken(token);
    request.firebaseUser = decodedToken;
    // Resolve internal user record
    const user = await this.usersService.findByFirebaseUid(decodedToken.uid);
    request.user = user;
    return true;
  }
}
```

**Current Implementation**:

```bash
$ find apps/api/src -name "*guard*"
(no output — no guards exist)
```

**Gap**: ❌ CRITICAL

- `FirebaseAuthGuard` does not exist
- No token extraction logic
- No `req.firebaseUser` or `req.user` attachment

**Effort to Implement**: 3-4 hours

- Create `FirebaseAuthGuard` in `src/modules/auth/guards/`
- Implement `CanActivate` interface
- Add token extraction and verification
- Add error handling (401 Unauthorized)
- Write unit tests

---

#### 3. RolesGuard and @Roles() Decorator

**Documentation**: `documentation/infrastructure/auth.md` lines 98-110

**Documented Behavior**:

```typescript
// @Roles() decorator usage (documented)
@Controller('trips')
export class TripsController {
  @Post()
  @Roles('ORGANIZER')
  async createTrip() { ... }
}

// RolesGuard (documented)
@Injectable()
export class RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user.roles.some(role => requiredRoles.includes(role));
  }
}
```

**Current Implementation**:

```bash
$ find apps/api/src -name "*decorator*" -o -name "*guard*"
(no output — no decorators or guards)
```

**Gap**: ❌ CRITICAL

- `RolesGuard` does not exist
- `@Roles()` decorator does not exist
- `@Public()` decorator does not exist (mentioned in docs)
- No role resolution logic (platform/trip/group scopes)

**Effort to Implement**: 4-5 hours

- Create `RolesGuard` in `src/modules/auth/guards/`
- Create `@Roles()` decorator in `src/modules/auth/decorators/`
- Create `@Public()` decorator
- Implement multi-scope role resolution (platform/trip/group)
- Write unit tests

---

#### 4. SupportAdminAuditInterceptor

**Documentation**: `documentation/infrastructure/auth.md` lines 113-122

**Documented Behavior**:

```typescript
// SupportAdminAuditInterceptor (documented)
@Injectable()
export class SupportAdminAuditInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    if (request.user.platform_role !== 'SUPPORT_ADMIN') {
      return next.handle();
    }
    const beforeState = await this.captureState(...);
    const result = await next.handle().toPromise();
    const afterState = await this.captureState(...);
    await this.auditLogRepository.create({ admin_user_id, action, before_state, after_state, ... });
    return result;
  }
}
```

**Current Implementation**:

```bash
$ find apps/api/src -name "*interceptor*"
(no output — no interceptors exist)
```

**Gap**: ❌ HIGH

- `SupportAdminAuditInterceptor` does not exist
- No audit log capture logic
- Database table `support_admin_audit_log` not defined

**Effort to Implement**: 3-4 hours

- Create interceptor in `src/modules/auth/interceptors/`
- Implement before/after state capture
- Create `support_admin_audit_log` table schema
- Write migration for audit log table
- Write unit tests

---

### Database Schema

#### 5. Users Table

**Documentation**: `features/users.md` (referenced in auth.md lines 84-92)

**Documented Schema** (from users feature doc):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  auth_provider VARCHAR(20) NOT NULL CHECK (auth_provider IN ('GOOGLE', 'FACEBOOK')),
  email VARCHAR(255) NOT NULL,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  platform_role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (platform_role IN ('USER', 'SUPPORT_ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Current Implementation**:

```bash
$ cat apps/api/src/database/schema/index.ts
// No schemas yet - this will be populated as features are built
export {};
```

**Gap**: ❌ CRITICAL

- `users` table schema not defined in Drizzle
- No `users.schema.ts` file
- No migration file generated
- Fields `firebase_uid`, `auth_provider`, `platform_role` do not exist

**Effort to Implement**: 2-3 hours

- Create `apps/api/src/database/schema/users.schema.ts`
- Define Drizzle schema with all fields
- Generate migration: `pnpm --filter api db:generate`
- Apply migration to Cloud SQL (via CI/CD or manual)
- Write integration tests

---

#### 6. Support Admin Audit Log Table

**Documentation**: `documentation/infrastructure/auth.md` lines 117-122

**Documented Schema** (inferred from documentation):

```sql
CREATE TABLE support_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,  -- e.g., 'UPDATE', 'DELETE'
  target_table VARCHAR(100) NOT NULL,  -- e.g., 'trips', 'users'
  target_id VARCHAR(255) NOT NULL,  -- ID of affected record
  before_state JSONB,  -- Snapshot before change
  after_state JSONB,   -- Snapshot after change
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_support_admin_audit_log_admin_user_id ON support_admin_audit_log(admin_user_id);
CREATE INDEX idx_support_admin_audit_log_performed_at ON support_admin_audit_log(performed_at DESC);
```

**Current Implementation**:

```bash
$ grep -ri "audit_log" apps/api/src/database/schema/
(no output — table not defined)
```

**Gap**: ❌ HIGH

- `support_admin_audit_log` table not defined
- No audit log schema file
- No migration generated

**Effort to Implement**: 1-2 hours

- Create `apps/api/src/database/schema/support-admin-audit-log.schema.ts`
- Define Drizzle schema
- Generate and apply migration
- Add indexes for performance

---

### Environment Configuration

#### 7. Environment Variables

**Documentation**: `documentation/infrastructure/auth.md` lines 132-133

**Documented Variables**:

- `FIREBASE_PROJECT_ID` — Firebase project ID
- `FIREBASE_CREDENTIALS` — Base64-encoded Firebase service account JSON (or path to JSON file)
- `FACEBOOK_CLIENT_ID` — Facebook App ID (for OAuth)
- `FACEBOOK_CLIENT_SECRET` — Facebook App Secret (for OAuth)

**Current Implementation**:

```typescript
// apps/api/src/config/environment.schema.ts
class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL!: string;

  // ... database pool config ...
  // NO FIREBASE VARIABLES
}
```

**Gap**: ❌ HIGH

- `FIREBASE_PROJECT_ID` not in environment schema
- `FIREBASE_CREDENTIALS` not in environment schema
- `FACEBOOK_CLIENT_ID` not in environment schema
- `FACEBOOK_CLIENT_SECRET` not in environment schema

**Effort to Implement**: 1 hour

- Add Firebase variables to `EnvironmentVariables` class
- Add validation decorators (@IsString, @IsOptional where appropriate)
- Update `.env.example` with placeholders

---

### GCP Secrets

#### 8. Secret Manager Secrets

**Documentation**: `documentation/infrastructure/secrets-management.md`

**Documented Secrets**:

- `FIREBASE_CREDENTIALS` — Firebase service account key JSON (base64-encoded or file path)
- `FACEBOOK_CLIENT_ID` — Facebook OAuth App ID
- `FACEBOOK_CLIENT_SECRET` — Facebook OAuth App Secret

**Current Implementation**:

```bash
$ gcloud secrets list --project=chamuco-app-mn

NAME               CREATED
DATABASE_POOL_MAX  2026-03-29T02:21:51
DATABASE_POOL_MIN  2026-03-29T02:21:48
DATABASE_URL       2026-03-29T02:21:25
NODE_ENV           2026-03-29T02:21:54
SWAGGER_ENABLED    2026-03-29T02:21:57

# Firebase secrets DO NOT EXIST
```

**Gap**: ❌ HIGH

- `FIREBASE_CREDENTIALS` secret not created
- `FACEBOOK_CLIENT_ID` secret not created
- `FACEBOOK_CLIENT_SECRET` secret not created
- No IAM policies for these secrets

**Effort to Implement**: 30 minutes

```bash
# Create secrets (values need to be obtained from Firebase Console)
echo -n "BASE64_ENCODED_SERVICE_ACCOUNT_JSON" | \
  gcloud secrets create FIREBASE_CREDENTIALS --data-file=- --project=chamuco-app-mn

echo -n "FACEBOOK_APP_ID" | \
  gcloud secrets create FACEBOOK_CLIENT_ID --data-file=- --project=chamuco-app-mn

echo -n "FACEBOOK_APP_SECRET" | \
  gcloud secrets create FACEBOOK_CLIENT_SECRET --data-file=- --project=chamuco-app-mn

# Grant access to chamuco-api-sa
for secret in FIREBASE_CREDENTIALS FACEBOOK_CLIENT_ID FACEBOOK_CLIENT_SECRET; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=chamuco-app-mn
done
```

---

### Frontend Components (Brief Overview)

While this audit focuses on backend infrastructure, the frontend also requires Firebase Authentication integration:

**Frontend Gap** (Not Detailed Here):

- `firebase` npm package not installed in `apps/web/package.json`
- No Firebase initialization in frontend
- No `signInWithGoogle()` or `signInWithFacebook()` integration
- No token management or `Authorization` header attachment
- No auth context provider

**Estimated Frontend Effort**: 4-6 hours (separate from backend epic)

---

## Dependency Tree

The following shows implementation dependencies — later items depend on earlier ones:

```
1. Firebase Admin SDK Setup
   ↓
2. Environment Schema Updates + GCP Secrets
   ↓
3. Database Schema (users table)
   │
   ├─→ 4. FirebaseAuthGuard
   │      ↓
   ├─→ 5. RolesGuard + @Roles() Decorator
   │      ↓
   └─→ 6. User Provisioning Logic
          ↓
       7. Support Admin Audit (audit_log table + interceptor)
```

**Critical Path**: 1 → 2 → 3 → 4 → 5 (all are blocking)

---

## Implementation Roadmap

### Phase 1: Setup & Infrastructure (2-3 hours)

**Goal**: Install dependencies, configure Firebase, create secrets

**Tasks**:

1. Install `firebase-admin` in `apps/api/package.json`
2. Add Firebase environment variables to `environment.schema.ts`
3. Create Firebase project (if not already created)
4. Generate Firebase service account key JSON
5. Create GCP secrets: `FIREBASE_CREDENTIALS`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`
6. Grant `roles/secretmanager.secretAccessor` to `chamuco-api-sa` on these secrets
7. Update `.env.example` with Firebase placeholders

**Acceptance Criteria**:

- `firebase-admin` installed
- Environment variables validate correctly
- Secrets exist in GCP Secret Manager
- Service account has access to secrets

---

### Phase 2: Database Schema (2-3 hours)

**Goal**: Create `users` table with Firebase UID mapping

**Tasks**:

1. Create `apps/api/src/database/schema/users.schema.ts`
2. Define Drizzle schema:
   - `id` (UUID primary key)
   - `firebase_uid` (unique, not null)
   - `auth_provider` (enum: GOOGLE, FACEBOOK)
   - `email`, `username`, `display_name`
   - `platform_role` (enum: USER, SUPPORT_ADMIN)
   - Timestamps
3. Generate migration: `pnpm --filter api db:generate`
4. Review migration SQL
5. Apply migration to Cloud SQL test database
6. Create `users.repository.ts` with `findByFirebaseUid()` method
7. Write integration tests for repository

**Acceptance Criteria**:

- `users` table exists in database
- Migration committed to Git
- Repository methods tested and working
- Can insert and query users by `firebase_uid`

---

### Phase 3: Guards & Decorators (4-5 hours)

**Goal**: Implement authentication and authorization guards

**Tasks**:

1. Create `AuthModule` in `src/modules/auth/`
2. Initialize Firebase Admin SDK in `AuthModule.onModuleInit()`
3. Create `FirebaseAuthGuard`:
   - Extract Bearer token from `Authorization` header
   - Verify token with `admin.auth().verifyIdToken(token)`
   - Attach `req.firebaseUser` (decoded token)
   - Resolve user record via `usersRepository.findByFirebaseUid()`
   - Attach `req.user` (internal user record)
   - Return 401 if token invalid
4. Create `RolesGuard`:
   - Read required roles from `@Roles()` metadata
   - Check `req.user.platform_role` and trip/group roles
   - Allow or deny based on role match
5. Create `@Roles()` decorator
6. Create `@Public()` decorator (bypass FirebaseAuthGuard)
7. Apply `FirebaseAuthGuard` globally in `main.ts`
8. Write unit tests for guards and decorators
9. Write E2E tests for protected endpoints

**Acceptance Criteria**:

- Requests with valid Firebase token succeed
- Requests without token return 401
- Expired tokens return 401
- `@Roles()` correctly enforces role requirements
- `@Public()` bypasses authentication
- 100% test coverage on guards

---

### Phase 4: User Provisioning (2-3 hours)

**Goal**: Auto-create user record on first login

**Tasks**:

1. Create `AuthService` in `src/modules/auth/`
2. Implement `AuthService.provisionUser(firebaseUser)`:
   - Check if user exists by `firebase_uid`
   - If not, create `users` record with:
     - `firebase_uid` from token
     - `auth_provider` from token (Google/Facebook)
     - `email` from token
     - `display_name` from token
     - Generate temporary `username` (to be set in onboarding)
   - Return user record
3. Integrate provisioning into `FirebaseAuthGuard`:
   - If `findByFirebaseUid()` returns null, call `provisionUser()`
4. Write unit tests
5. Write E2E test for first-time login flow

**Acceptance Criteria**:

- First login creates user record
- Subsequent logins reuse existing record
- `email`, `display_name`, `firebase_uid` correctly populated
- Tests cover both first-time and returning users

---

### Phase 5: Support Admin Audit (2-3 hours)

**Goal**: Log all SUPPORT_ADMIN write actions

**Tasks**:

1. Create `apps/api/src/database/schema/support-admin-audit-log.schema.ts`
2. Define Drizzle schema (fields listed in section 6 above)
3. Generate and apply migration
4. Create `SupportAdminAuditInterceptor` in `src/modules/auth/interceptors/`
5. Implement before/after state capture
6. Write audit log record on write actions (POST, PUT, PATCH, DELETE)
7. Skip audit for read actions (GET)
8. Apply interceptor globally or to specific controllers
9. Write unit tests
10. Write E2E test: login as SUPPORT_ADMIN, modify record, verify audit log entry

**Acceptance Criteria**:

- All write actions by SUPPORT_ADMIN are logged
- Read actions are NOT logged
- Audit log contains before/after state (JSONB)
- Tests verify audit log entries are created

---

## Testing Strategy

### Unit Tests

| Component                    | Test File                                 | Key Test Cases                                                             |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| FirebaseAuthGuard            | `firebase-auth.guard.spec.ts`             | Valid token, expired token, missing token, invalid signature               |
| RolesGuard                   | `roles.guard.spec.ts`                     | User has role, user lacks role, SUPPORT_ADMIN bypass                       |
| @Roles() Decorator           | `roles.decorator.spec.ts`                 | Metadata correctly attached to handler                                     |
| AuthService.provisionUser()  | `auth.service.spec.ts`                    | First-time user creation, returning user, provider distinction             |
| SupportAdminAuditInterceptor | `support-admin-audit.interceptor.spec.ts` | Audit log created on write, skipped on read, skipped for non-SUPPORT_ADMIN |

**Target Coverage**: 100% (lines, statements, functions, branches)

### Integration Tests

| Test Name               | Scenario                                                                    |
| ----------------------- | --------------------------------------------------------------------------- |
| `auth.e2e-spec.ts`      | Full login flow: Firebase token → user provisioning → authenticated request |
| `roles.e2e-spec.ts`     | Role enforcement: USER vs ORGANIZER vs SUPPORT_ADMIN access                 |
| `audit-log.e2e-spec.ts` | SUPPORT_ADMIN modifies a record, audit log entry created                    |

### Manual Testing Checklist

Before marking implementation complete:

- [ ] Login with Google (dev environment)
- [ ] Login with Facebook (dev environment)
- [ ] First-time user creates profile with auto-populated `display_name`
- [ ] Returning user skips provisioning, retrieves existing record
- [ ] Protected endpoint returns 401 without token
- [ ] Protected endpoint succeeds with valid token
- [ ] Role-protected endpoint denies USER, allows ORGANIZER
- [ ] SUPPORT_ADMIN can access all endpoints regardless of role
- [ ] SUPPORT_ADMIN write action creates audit log entry
- [ ] Token expiry (> 1 hour) correctly returns 401
- [ ] Logout revokes refresh token, user cannot access protected endpoints

---

## Estimated Total Effort

| Phase                  | Hours           | Priority |
| ---------------------- | --------------- | -------- |
| Setup & Infrastructure | 2-3             | P0       |
| Database Schema        | 2-3             | P0       |
| Guards & Decorators    | 4-5             | P0       |
| User Provisioning      | 2-3             | P0       |
| Support Admin Audit    | 2-3             | P1       |
| Testing (unit + E2E)   | 3-4             | P0       |
| **Total Backend**      | **15-21 hours** | —        |
| Frontend Integration   | 4-6             | P0       |
| **Grand Total**        | **19-27 hours** | —        |

**Recommendation**: Allocate 3-4 developer days for a single developer to implement the complete authentication system (backend + frontend).

---

## Risks & Mitigations

### Risk 1: Firebase Service Account Credentials Leakage

**Likelihood**: LOW
**Impact**: CRITICAL (full database access)

**Mitigation**:

- Store credentials in GCP Secret Manager (not in code or `.env`)
- Grant `secretAccessor` only to `chamuco-api-sa`
- Never log the credentials value
- Rotate credentials quarterly (set calendar reminder)

### Risk 2: Token Verification Performance Overhead

**Likelihood**: MEDIUM
**Impact**: MEDIUM (increased latency per request)

**Mitigation**:

- Firebase Admin SDK caches public keys (JWKS), verification is fast (~1-2ms)
- Consider adding in-memory cache for user lookups by `firebase_uid` (Redis or in-process cache)
- Monitor P95 latency after auth implementation

### Risk 3: SUPPORT_ADMIN Abuse

**Likelihood**: LOW
**Impact**: HIGH (unauthorized data access/modification)

**Mitigation**:

- Limit SUPPORT_ADMIN role to 2-3 trusted individuals
- All write actions logged immutably in `support_admin_audit_log`
- Set up Cloud Monitoring alert for SUPPORT_ADMIN login (notify security team)
- Quarterly audit of support admin activity

### Risk 4: Facebook OAuth Deprecation

**Likelihood**: LOW
**Impact**: HIGH (authentication method unavailable)

**Mitigation**:

- Firebase abstracts OAuth flow, SDK updates handle deprecation
- Monitor Firebase release notes for breaking changes
- Keep `firebase-admin` and `firebase` (frontend) up to date
- Users can link multiple providers (Google + Facebook) — if Facebook fails, Google still works

---

## Post-Implementation Checklist

Once authentication is implemented, verify:

- [ ] All backend components in gap matrix are ✅ (0% → 100%)
- [ ] Database migrations applied to production Cloud SQL
- [ ] GCP secrets populated with real values (not placeholders)
- [ ] Firebase Console configured:
  - [ ] Google Sign-In enabled
  - [ ] Facebook Sign-In enabled (App ID + Secret configured)
  - [ ] Authorized domains include Cloud Run URLs
- [ ] Environment variables deployed to Cloud Run via Secret Manager
- [ ] `chamuco-api-sa` has `secretmanager.secretAccessor` on Firebase secrets
- [ ] Frontend can login with Google and Facebook
- [ ] Protected endpoints return 401 without token
- [ ] Role enforcement works (USER vs ORGANIZER vs SUPPORT_ADMIN)
- [ ] Audit log entries created for SUPPORT_ADMIN writes
- [ ] E2E tests pass (auth.e2e, roles.e2e, audit-log.e2e)
- [ ] Manual testing checklist 100% complete
- [ ] Update CLAUDE.md with any new conventions or rules learned during implementation

---

## Conclusion

Firebase Authentication is **fully designed but not yet built**. All architectural decisions are sound, and the documentation is comprehensive. The implementation path is clear and can be completed in 3-4 developer days.

**Recommendation**: Create a new epic issue titled **"Epic: Firebase Authentication — MVP"** with the 5 phases above as sub-issues. Assign to a backend developer before the MVP production launch.

**Security Posture**: Once implemented, the authentication system will follow industry best practices:

- Delegated token issuance and verification (Firebase)
- Least privilege IAM (service account roles)
- Encrypted secrets (Secret Manager)
- Audit logging for privileged actions (SUPPORT_ADMIN)

**No Blockers Identified**: All dependencies (GCP project, Cloud SQL, Cloud Run) are already in place. Firebase project creation and OAuth setup are the only external prerequisites.

---

**Document Status**: FINAL
**Last Updated**: 2026-03-29 23:00
**Next Steps**: Create epic issue, prioritize in backlog, proceed to Phase 6 (Documentation Validation)
