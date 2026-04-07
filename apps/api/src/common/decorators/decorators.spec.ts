import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@chamuco/shared-types';

import { AuditTarget, AUDIT_TARGET_KEY } from '@/common/decorators/audit-target.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { IS_PUBLIC_KEY, Public } from '@/common/decorators/public.decorator';
import { ROLES_KEY, Roles } from '@/common/decorators/roles.decorator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a stub handler class so Reflect metadata can be retrieved with
 * NestJS's Reflector (which reads from method + class targets).
 */
function applyToHandler(decoratorFn: MethodDecorator) {
  class StubController {
    handler() {}
  }
  decoratorFn(
    StubController.prototype,
    'handler',
    Object.getOwnPropertyDescriptor(StubController.prototype, 'handler')!,
  );
  return StubController;
}

// ---------------------------------------------------------------------------
// @Public
// ---------------------------------------------------------------------------

describe('@Public', () => {
  it('sets IS_PUBLIC_KEY metadata to true on the handler', () => {
    const ctrl = applyToHandler(Public());
    const reflector = new Reflector();
    const value = reflector.get<boolean>(IS_PUBLIC_KEY, ctrl.prototype.handler);
    expect(value).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// @Roles
// ---------------------------------------------------------------------------

describe('@Roles', () => {
  it('sets ROLES_KEY metadata to the provided roles on the handler', () => {
    const ctrl = applyToHandler(Roles(PlatformRole.USER, PlatformRole.SUPPORT_ADMIN));
    const reflector = new Reflector();
    const value = reflector.get<PlatformRole[]>(ROLES_KEY, ctrl.prototype.handler);
    expect(value).toEqual([PlatformRole.USER, PlatformRole.SUPPORT_ADMIN]);
  });

  it('works with a single role', () => {
    const ctrl = applyToHandler(Roles(PlatformRole.SUPPORT_ADMIN));
    const reflector = new Reflector();
    const value = reflector.get<PlatformRole[]>(ROLES_KEY, ctrl.prototype.handler);
    expect(value).toEqual([PlatformRole.SUPPORT_ADMIN]);
  });
});

// ---------------------------------------------------------------------------
// @AuditTarget
// ---------------------------------------------------------------------------

describe('@AuditTarget', () => {
  it('sets AUDIT_TARGET_KEY metadata with table and default idParam="id"', () => {
    const ctrl = applyToHandler(AuditTarget('users'));
    const reflector = new Reflector();
    const value = reflector.get(AUDIT_TARGET_KEY, ctrl.prototype.handler);
    expect(value).toEqual({ table: 'users', idParam: 'id' });
  });

  it('sets AUDIT_TARGET_KEY metadata with a custom idParam', () => {
    const ctrl = applyToHandler(AuditTarget('trips', 'tripId'));
    const reflector = new Reflector();
    const value = reflector.get(AUDIT_TARGET_KEY, ctrl.prototype.handler);
    expect(value).toEqual({ table: 'trips', idParam: 'tripId' });
  });
});

// ---------------------------------------------------------------------------
// @CurrentUser
// ---------------------------------------------------------------------------

/**
 * NestJS stores the factory for custom param decorators in Reflect metadata
 * under `__routeArguments__` with key `${RouteParamtypes.CUSTOM}:${paramIndex}`.
 * We apply the decorator to a dummy class, read the factory back out, and invoke
 * it directly — this is the only way to exercise the factory body in a unit test
 * without spinning up a full HTTP pipeline.
 */
function extractCurrentUserFactory(): (_: unknown, ctx: ExecutionContext) => unknown {
  const ROUTE_ARGS_METADATA = '__routeArguments__';

  class TestController {
    handler(@CurrentUser() _user: unknown) {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler') as Record<
    string,
    { factory: (_: unknown, ctx: ExecutionContext) => unknown }
  >;

  // NestJS prefixes the key with an internal hash — use Object.values() to avoid
  // depending on the exact key format which may change across NestJS versions.
  const entry = Object.values(args ?? {})[0];
  if (!entry?.factory) throw new Error('CurrentUser factory not found in Reflect metadata');
  return entry.factory;
}

describe('@CurrentUser', () => {
  // Extract once — defining a new TestController class per test is wasteful.
  const factory = extractCurrentUserFactory();

  it('returns request.user from the HTTP context', () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => ({ user: mockUser }) }),
    } as unknown as ExecutionContext;

    expect(factory(undefined, mockContext)).toBe(mockUser);
  });

  it('returns undefined when no user is attached to the request', () => {
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => ({ user: undefined }) }),
    } as unknown as ExecutionContext;

    expect(factory(undefined, mockContext)).toBeUndefined();
  });
});
