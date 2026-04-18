import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { RolesGuard } from '@/common/guards/roles.guard';
import type { AuthenticatedUser } from '@/types/express.d';

const buildUser = (role: PlatformRole): AuthenticatedUser => ({
  id: 'user-uuid',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: role,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
});

const buildContext = (user: AuthenticatedUser | undefined): ExecutionContext => {
  const mockRequest = { user };

  return {
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('no @Roles() metadata', () => {
    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = buildContext(buildUser(PlatformRole.USER));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow access when @Roles() is called with an empty array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const ctx = buildContext(buildUser(PlatformRole.USER));

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('SUPPORT_ADMIN short-circuit', () => {
    it('should allow SUPPORT_ADMIN on a route requiring SUPPORT_ADMIN', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PlatformRole.SUPPORT_ADMIN]);
      const ctx = buildContext(buildUser(PlatformRole.SUPPORT_ADMIN));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow SUPPORT_ADMIN even on routes that only require USER', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PlatformRole.USER]);
      const ctx = buildContext(buildUser(PlatformRole.SUPPORT_ADMIN));

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('USER role', () => {
    it('should allow USER on a route requiring USER', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PlatformRole.USER]);
      const ctx = buildContext(buildUser(PlatformRole.USER));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny USER on a route requiring SUPPORT_ADMIN', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PlatformRole.SUPPORT_ADMIN]);
      const ctx = buildContext(buildUser(PlatformRole.USER));

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('unauthenticated request with @Roles()', () => {
    it('should deny when req.user is undefined and roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PlatformRole.SUPPORT_ADMIN]);
      const ctx = buildContext(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
