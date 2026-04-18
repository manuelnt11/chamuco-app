import { ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import { FirebaseAuthGuard } from '@/modules/auth/firebase-auth.guard';
import { UsersService } from '@/modules/users/users.service';
import type { AuthenticatedUser } from '@/types/express.d';

const mockUser: AuthenticatedUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
};

const mockDecodedToken = {
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  name: 'Test User',
};

const buildContext = (
  authHeader?: string,
  handlerMetadata: Record<string, unknown> = {},
): ExecutionContext => {
  const mockRequest = {
    headers: authHeader ? { authorization: authHeader } : {},
  };

  return {
    getHandler: jest.fn().mockReturnValue(handlerMetadata),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
  } as unknown as ExecutionContext;
};

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let reflector: Reflector;
  let mockVerifyIdToken: jest.Mock;
  let mockFindByFirebaseUid: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(async () => {
    mockVerifyIdToken = jest.fn();
    mockFindByFirebaseUid = jest.fn();
    mockUpdate = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: FirebaseAdminService,
          useValue: {
            auth: jest.fn().mockReturnValue({ verifyIdToken: mockVerifyIdToken }),
          },
        },
        {
          provide: UsersService,
          useValue: { findByFirebaseUid: mockFindByFirebaseUid },
        },
        {
          provide: DRIZZLE_CLIENT,
          useValue: { update: mockUpdate },
        },
      ],
    }).compile();

    guard = module.get<FirebaseAuthGuard>(FirebaseAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('public routes', () => {
    it('should allow access without a token when @Public() is set', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const ctx = buildContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
      expect(mockFindByFirebaseUid).not.toHaveBeenCalled();
    });
  });

  describe('protected routes — valid token', () => {
    it('should authenticate, set req.firebaseUser and req.user, and return true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindByFirebaseUid.mockResolvedValue(mockUser);

      const ctx = buildContext('Bearer valid-token');
      const request = ctx.switchToHttp().getRequest();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(mockFindByFirebaseUid).toHaveBeenCalledWith('firebase-uid-123');
      expect(request.firebaseUser).toEqual(mockDecodedToken);
      expect(request.user).toEqual(mockUser);
    });

    it('should fire-and-forget last_active_at update without blocking the response', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindByFirebaseUid.mockResolvedValue(mockUser);

      const ctx = buildContext('Bearer valid-token');
      await guard.canActivate(ctx);

      expect(mockUpdate).toHaveBeenCalledWith(expect.anything());
    });

    it('should still return true when last_active_at update fails', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindByFirebaseUid.mockResolvedValue(mockUser);
      mockUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('DB write failed')),
        }),
      });

      const ctx = buildContext('Bearer valid-token');
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  describe('protected routes — missing / malformed token', () => {
    it('should throw UnauthorizedException when Authorization header is absent', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const ctx = buildContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when header does not start with "Bearer "', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const ctx = buildContext('Token some-token');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });
  });

  describe('protected routes — invalid / expired token', () => {
    it('should throw UnauthorizedException when verifyIdToken rejects', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

      const ctx = buildContext('Bearer expired-token');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      expect(mockFindByFirebaseUid).not.toHaveBeenCalled();
    });
  });

  describe('protected routes — user not found in DB', () => {
    it('should throw NotFoundException when Firebase token is valid but user has not registered with Chamuco', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      // UsersService.findByFirebaseUid throws NotFoundException when user is not found.
      // The guard's catch block re-throws it so the client receives 404, not 401.
      mockFindByFirebaseUid.mockRejectedValue(new NotFoundException('User not found'));

      const ctx = buildContext('Bearer valid-token');

      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
