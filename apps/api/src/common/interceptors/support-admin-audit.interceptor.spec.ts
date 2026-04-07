import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';

import { DrizzleClient } from '@/database/drizzle.provider';
import { PlatformRole } from '@chamuco/shared-types';

import { SupportAdminAuditInterceptor } from './support-admin-audit.interceptor';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(platformRole: PlatformRole) {
  return {
    id: 'admin-uuid-1234',
    platformRole,
    email: 'admin@test.com',
    username: 'admin',
    displayName: 'Admin',
    avatarUrl: null,
    authProvider: 'GOOGLE',
    firebaseUid: 'firebase-uid',
    timezone: 'UTC',
    agencyId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };
}

function makeContext(overrides: {
  method?: string;
  user?: ReturnType<typeof makeUser> | null;
  params?: Record<string, string>;
  path?: string;
}): ExecutionContext {
  const request = {
    method: overrides.method ?? 'GET',
    user: overrides.user !== undefined ? overrides.user : makeUser(PlatformRole.SUPPORT_ADMIN),
    params: overrides.params ?? {},
    path: overrides.path ?? '/api/v1/users',
  };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function makeCallHandler(returnValue: unknown = { id: 'new-record' }) {
  return { handle: () => of(returnValue) };
}

function makeThrowingCallHandler(error = new Error('handler error')) {
  return { handle: () => throwError(() => error) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SupportAdminAuditInterceptor', () => {
  let interceptor: SupportAdminAuditInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let db: {
    insert: jest.Mock;
    execute: jest.Mock;
  };
  let insertValues: jest.Mock;

  beforeEach(() => {
    // `writeAuditLog` is called with `void` (fire-and-forget). Assertions on `db.insert`
    // and `insertValues` are still reliable because both calls happen synchronously before
    // the first `await` inside `writeAuditLog` — the Observable's `tap`/`catchError`
    // callback returns before any async suspension occurs.
    insertValues = jest.fn().mockResolvedValue(undefined);
    db = {
      insert: jest.fn().mockReturnValue({ values: insertValues }),
      execute: jest.fn().mockResolvedValue([]),
    };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<Reflector>;

    // Cast to DrizzleClient — the @Inject(DRIZZLE_CLIENT) token is irrelevant in unit tests
    // since we're constructing the interceptor directly without the DI container.
    interceptor = new SupportAdminAuditInterceptor(db as unknown as DrizzleClient, reflector);
  });

  // -------------------------------------------------------------------------
  // Short-circuit cases
  // -------------------------------------------------------------------------

  describe('short-circuit (no audit log)', () => {
    it('passes through GET requests for SUPPORT_ADMIN without logging', (done) => {
      const ctx = makeContext({ method: 'GET' });
      const handler = makeCallHandler('some data');

      interceptor.intercept(ctx, handler).subscribe({
        next: (value) => {
          expect(value).toBe('some data');
          expect(db.insert).not.toHaveBeenCalled();
        },
        complete: () => done(),
      });
    });

    it('passes through HEAD requests for SUPPORT_ADMIN without logging', (done) => {
      const ctx = makeContext({ method: 'HEAD' });
      const handler = makeCallHandler();

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          expect(db.insert).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('passes through POST for regular USER without logging', (done) => {
      const ctx = makeContext({ method: 'POST', user: makeUser(PlatformRole.USER) });
      const handler = makeCallHandler();

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          expect(db.insert).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('passes through when user is not attached to request', (done) => {
      const ctx = makeContext({ method: 'PATCH', user: null });
      const handler = makeCallHandler();

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          expect(db.insert).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // Write method + SUPPORT_ADMIN — happy paths
  // -------------------------------------------------------------------------

  describe('audit logging for SUPPORT_ADMIN writes', () => {
    it('logs a POST with action=CREATE, no before_state, after_state from response', (done) => {
      reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });
      const ctx = makeContext({ method: 'POST', path: '/api/v1/users' });
      const responseBody = { id: 'created-uuid', email: 'x@test.com' };
      const handler = makeCallHandler(responseBody);

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          expect(db.insert).toHaveBeenCalledTimes(1);
          const entry = insertValues.mock.calls[0][0];
          expect(entry.action).toBe('CREATE');
          expect(entry.beforeState).toBeNull();
          expect(entry.afterState).toEqual(responseBody);
          expect(entry.adminUserId).toBe('admin-uuid-1234');
          expect(entry.targetTable).toBe('users');
          done();
        },
      });
    });

    it('logs a PATCH with action=UPDATE, fetches before_state, sets after_state', (done) => {
      const existingRecord = { id: 'target-uuid', email: 'old@test.com' };
      db.execute.mockResolvedValue([existingRecord]);
      reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });

      const ctx = makeContext({
        method: 'PATCH',
        params: { id: 'target-uuid' },
        path: '/api/v1/users/target-uuid',
      });
      const responseBody = { id: 'target-uuid', email: 'new@test.com' };
      const handler = makeCallHandler(responseBody);

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          expect(db.execute).toHaveBeenCalledTimes(1);
          const entry = insertValues.mock.calls[0][0];
          expect(entry.action).toBe('UPDATE');
          expect(entry.targetTable).toBe('users');
          expect(entry.targetId).toBe('target-uuid');
          expect(entry.beforeState).toEqual(existingRecord);
          expect(entry.afterState).toEqual(responseBody);
          done();
        },
      });
    });

    it('logs a PUT with action=UPDATE', (done) => {
      reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });
      db.execute.mockResolvedValue([{ id: 'target-uuid' }]);

      const ctx = makeContext({
        method: 'PUT',
        params: { id: 'target-uuid' },
        path: '/api/v1/users/target-uuid',
      });

      interceptor.intercept(ctx, makeCallHandler({ id: 'target-uuid' })).subscribe({
        complete: () => {
          const entry = insertValues.mock.calls[0][0];
          expect(entry.action).toBe('UPDATE');
          done();
        },
      });
    });

    it('logs a DELETE with action=DELETE, fetches before_state, after_state from response', (done) => {
      const existingRecord = { id: 'target-uuid', email: 'to-delete@test.com' };
      db.execute.mockResolvedValue([existingRecord]);
      reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });

      const ctx = makeContext({
        method: 'DELETE',
        params: { id: 'target-uuid' },
        path: '/api/v1/users/target-uuid',
      });
      const handler = makeCallHandler(null);

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          const entry = insertValues.mock.calls[0][0];
          expect(entry.action).toBe('DELETE');
          expect(entry.beforeState).toEqual(existingRecord);
          expect(entry.afterState).toBeNull();
          done();
        },
      });
    });

    it('sets before_state=null when target record is not found', (done) => {
      db.execute.mockResolvedValue([]);
      reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });

      const ctx = makeContext({
        method: 'PATCH',
        params: { id: 'ghost-uuid' },
        path: '/api/v1/users/ghost-uuid',
      });

      interceptor.intercept(ctx, makeCallHandler({ id: 'ghost-uuid' })).subscribe({
        complete: () => {
          const entry = insertValues.mock.calls[0][0];
          expect(entry.beforeState).toBeNull();
          done();
        },
      });
    });

    it('uses NIL_UUID as target_id when POST has no id param and handler fails', (done) => {
      reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });
      const ctx = makeContext({ method: 'POST', params: {}, path: '/api/v1/users' });
      const error = new Error('validation error');

      interceptor.intercept(ctx, makeThrowingCallHandler(error)).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          const entry = insertValues.mock.calls[0][0];
          expect(entry.targetId).toBe('00000000-0000-0000-0000-000000000000');
          expect(entry.afterState).toBeNull();
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('handler throws', () => {
    it('logs attempt with after_state=null and re-throws the original error', (done) => {
      reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });
      db.execute.mockResolvedValue([{ id: 'target-uuid' }]);

      const ctx = makeContext({
        method: 'PATCH',
        params: { id: 'target-uuid' },
        path: '/api/v1/users/target-uuid',
      });
      const originalError = new Error('something broke');

      interceptor.intercept(ctx, makeThrowingCallHandler(originalError)).subscribe({
        error: (err) => {
          expect(err).toBe(originalError);
          // Audit log was still written
          expect(db.insert).toHaveBeenCalledTimes(1);
          const entry = insertValues.mock.calls[0][0];
          expect(entry.afterState).toBeNull();
          done();
        },
      });
    });

    it('still re-throws even if the audit log insert itself fails', (done) => {
      insertValues.mockRejectedValueOnce(new Error('DB insert failed'));
      reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });
      db.execute.mockResolvedValue([{ id: 'target-uuid' }]);

      const ctx = makeContext({
        method: 'DELETE',
        params: { id: 'target-uuid' },
        path: '/api/v1/users/target-uuid',
      });
      const originalError = new Error('handler blew up');

      interceptor.intercept(ctx, makeThrowingCallHandler(originalError)).subscribe({
        error: (err) => {
          expect(err).toBe(originalError);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // URL-based fallback (no @AuditTarget decorator)
  // -------------------------------------------------------------------------

  describe('URL-based target resolution (no @AuditTarget)', () => {
    it('extracts table and id from URL when no decorator is present', (done) => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const ctx = makeContext({
        method: 'PATCH',
        params: { id: 'abc12345-0000-0000-0000-000000000001' },
        path: '/api/v1/users/abc12345-0000-0000-0000-000000000001',
      });
      db.execute.mockResolvedValue([{ id: 'abc12345-0000-0000-0000-000000000001' }]);

      interceptor.intercept(ctx, makeCallHandler({ id: 'x' })).subscribe({
        complete: () => {
          const entry = insertValues.mock.calls[0][0];
          expect(entry.targetTable).toBe('users');
          expect(entry.targetId).toBe('abc12345-0000-0000-0000-000000000001');
          done();
        },
      });
    });

    it('uses table name as targetTable when URL has no id segment', (done) => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const ctx = makeContext({ method: 'POST', params: {}, path: '/api/v1/trips' });

      interceptor.intercept(ctx, makeCallHandler({ id: 'new-trip' })).subscribe({
        complete: () => {
          const entry = insertValues.mock.calls[0][0];
          expect(entry.targetTable).toBe('trips');
          done();
        },
      });
    });

    it('falls back to URL id segment when no req.params are present', (done) => {
      // Covers the `looksLikeId ? last : null` branch in resolveTarget when params is empty.
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const urlId = 'abc12345-0000-0000-0000-000000000002';
      db.execute.mockResolvedValue([{ id: urlId }]);

      const ctx = makeContext({
        method: 'PATCH',
        params: {},
        path: `/api/v1/agencies/${urlId}`,
      });

      interceptor.intercept(ctx, makeCallHandler({ id: urlId })).subscribe({
        complete: () => {
          const entry = insertValues.mock.calls[0][0];
          expect(entry.targetTable).toBe('agencies');
          expect(entry.targetId).toBe(urlId);
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // before_state fetch failure is silent
  // -------------------------------------------------------------------------

  it('proceeds with before_state=null if the DB fetch throws', (done) => {
    db.execute.mockRejectedValue(new Error('table not found'));
    reflector.getAllAndOverride.mockReturnValue({ table: 'unknown_table', idParam: 'id' });

    const ctx = makeContext({
      method: 'DELETE',
      params: { id: 'some-id' },
      path: '/api/v1/unknown_table/some-id',
    });

    interceptor.intercept(ctx, makeCallHandler(null)).subscribe({
      complete: () => {
        const entry = insertValues.mock.calls[0][0];
        expect(entry.beforeState).toBeNull();
        done();
      },
    });
  });

  it('skips before_state fetch and sets null when table name fails validation', (done) => {
    // URL-derived table names are untrusted. If a path segment contains characters outside
    // the TABLE_NAME_RE allowlist (e.g. uppercase, $, dots) the fetch is skipped so that
    // sql.raw() is never called with an attacker-controlled string.
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const suspiciousId = 'abc12345-0000-0000-0000-000000000001';
    const ctx = makeContext({
      method: 'DELETE',
      params: { id: suspiciousId },
      path: `/api/v1/User$Table/${suspiciousId}`, // "User$Table" is invalid per TABLE_NAME_RE
    });

    interceptor.intercept(ctx, makeCallHandler(null)).subscribe({
      complete: () => {
        expect(db.execute).not.toHaveBeenCalled();
        const entry = insertValues.mock.calls[0][0];
        expect(entry.beforeState).toBeNull();
        done();
      },
    });
  });

  // -------------------------------------------------------------------------
  // Audit log write failure is silent (never surfaces to caller)
  // -------------------------------------------------------------------------

  it('does not propagate a successful response even if audit log write fails', (done) => {
    insertValues.mockRejectedValueOnce(new Error('audit table write failed'));
    reflector.getAllAndOverride.mockReturnValue({ table: 'users', idParam: 'id' });

    const ctx = makeContext({ method: 'POST', params: {}, path: '/api/v1/users' });
    const response = { id: 'new-user' };

    interceptor.intercept(ctx, makeCallHandler(response)).subscribe({
      next: (value) => {
        expect(value).toEqual(response);
      },
      complete: () => done(),
      error: () => done(new Error('should not error')),
    });
  });

  // -------------------------------------------------------------------------
  // Custom idParam
  // -------------------------------------------------------------------------

  it('reads the custom idParam from @AuditTarget metadata', (done) => {
    reflector.getAllAndOverride.mockReturnValue({ table: 'trips', idParam: 'tripId' });
    db.execute.mockResolvedValue([{ id: 'trip-uuid' }]);

    const ctx = makeContext({
      method: 'PATCH',
      params: { tripId: 'trip-uuid' },
      path: '/api/v1/trips/trip-uuid',
    });

    interceptor.intercept(ctx, makeCallHandler({ id: 'trip-uuid' })).subscribe({
      complete: () => {
        const entry = insertValues.mock.calls[0][0];
        expect(entry.targetTable).toBe('trips');
        expect(entry.targetId).toBe('trip-uuid');
        done();
      },
    });
  });

  // -------------------------------------------------------------------------
  // @AuditTarget misconfiguration — fail loudly
  // -------------------------------------------------------------------------

  it('throws synchronously when @AuditTarget provides a table name that fails validation', (done) => {
    // Decorator-provided names are developer-authored. An invalid name (e.g. camelCase) is a
    // misconfiguration — it must throw so it's caught at development time rather than silently
    // degrading audit quality in production.
    reflector.getAllAndOverride.mockReturnValue({ table: 'UserPreferences', idParam: 'id' });

    const ctx = makeContext({
      method: 'PATCH',
      params: { id: 'some-uuid' },
      path: '/api/v1/UserPreferences/some-uuid',
    });

    interceptor.intercept(ctx, makeCallHandler({ id: 'some-uuid' })).subscribe({
      error: (err: Error) => {
        expect(err.message).toMatch(/@AuditTarget table name "UserPreferences" is invalid/);
        expect(db.execute).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
