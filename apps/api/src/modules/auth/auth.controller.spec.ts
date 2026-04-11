import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole } from '@chamuco/shared-types';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import type { AuthenticatedUser } from '@/types/express';
import type { Request } from 'express';
import type { RegisterResponseDto } from './dto/register-response.dto';

const mockUser: RegisterResponseDto = {
  id: 'user-uuid',
  email: 'test@example.com',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: null,
  authProvider: AuthProvider.GOOGLE,
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  agencyId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
};

const buildRequest = (authorization?: string): Request =>
  ({ headers: { authorization } }) as unknown as Request;

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegister: jest.Mock;
  let mockLogout: jest.Mock;

  beforeEach(async () => {
    mockRegister = jest.fn().mockResolvedValue(mockUser);
    mockLogout = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: mockRegister,
            logout: mockLogout,
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should delegate to AuthService and return the created user', async () => {
      const req = buildRequest('Bearer valid-token');
      const dto = { username: 'john_doe', displayName: 'John Doe' };

      const result = await controller.register(req, dto);

      expect(mockRegister).toHaveBeenCalledWith('Bearer valid-token', dto);
      expect(result).toEqual(mockUser);
    });

    it('should pass undefined authorization header when absent', async () => {
      const req = buildRequest(undefined);
      const dto = { username: 'john_doe', displayName: 'John Doe' };

      await controller.register(req, dto);

      expect(mockRegister).toHaveBeenCalledWith(undefined, dto);
    });

    it('should propagate exceptions thrown by AuthService', async () => {
      mockRegister.mockRejectedValue({ status: HttpStatus.CONFLICT });
      const req = buildRequest('Bearer valid-token');

      await expect(
        controller.register(req, { username: 'john_doe', displayName: 'John Doe' }),
      ).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    const mockAuthUser = { firebaseUid: 'firebase-uid-123' } as AuthenticatedUser;

    it('should delegate to AuthService.logout with the current user firebaseUid', async () => {
      await controller.logout(mockAuthUser);

      expect(mockLogout).toHaveBeenCalledWith('firebase-uid-123');
    });

    it('should propagate errors thrown by AuthService', async () => {
      mockLogout.mockRejectedValue(new Error('Firebase unavailable'));

      await expect(controller.logout(mockAuthUser)).rejects.toThrow('Firebase unavailable');
    });
  });
});
