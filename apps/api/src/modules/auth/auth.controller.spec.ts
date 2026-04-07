import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole } from '@chamuco/shared-types';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
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
  let mockCheckUsernameAvailability: jest.Mock;

  beforeEach(async () => {
    mockRegister = jest.fn().mockResolvedValue(mockUser);
    mockCheckUsernameAvailability = jest
      .fn()
      .mockResolvedValue({ available: true, username: 'john_doe' });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: mockRegister,
            checkUsernameAvailability: mockCheckUsernameAvailability,
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should delegate to AuthService and return the created user', async () => {
      const req = buildRequest('Bearer valid-token');
      const dto = { username: 'john_doe' };

      const result = await controller.register(req, dto);

      expect(mockRegister).toHaveBeenCalledWith('Bearer valid-token', dto);
      expect(result).toEqual(mockUser);
    });

    it('should pass undefined authorization header when absent', async () => {
      const req = buildRequest(undefined);
      const dto = { username: 'john_doe' };

      await controller.register(req, dto);

      expect(mockRegister).toHaveBeenCalledWith(undefined, dto);
    });

    it('should propagate exceptions thrown by AuthService', async () => {
      mockRegister.mockRejectedValue({ status: HttpStatus.CONFLICT });
      const req = buildRequest('Bearer valid-token');

      await expect(controller.register(req, { username: 'john_doe' })).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
    });
  });

  describe('GET /api/v1/auth/username/:username/available', () => {
    it('should delegate to AuthService and return availability result', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({ available: true, username: 'john_doe' });

      const result = await controller.checkUsernameAvailability('john_doe');

      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('john_doe');
      expect(result).toEqual({ available: true, username: 'john_doe' });
    });

    it('should normalize username to lowercase before querying', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({ available: true, username: 'john_doe' });

      await controller.checkUsernameAvailability('John_Doe');

      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('john_doe');
    });

    it('should throw BadRequestException for a username that is too short', () => {
      expect(() => controller.checkUsernameAvailability('ab')).toThrow(BadRequestException);
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for a username that is too long', () => {
      expect(() => controller.checkUsernameAvailability('a'.repeat(31))).toThrow(
        BadRequestException,
      );
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for a username with disallowed characters', () => {
      expect(() => controller.checkUsernameAvailability('john doe')).toThrow(BadRequestException);
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });
  });
});
