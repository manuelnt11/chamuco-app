import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole } from '@chamuco/shared-types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

// mockUser is the expected shape after getMe strips firebaseUid
const { firebaseUid: _, ...mockUser } = mockAuthUser;

describe('UsersController', () => {
  let controller: UsersController;
  let mockFindByFirebaseUid: jest.Mock;
  let mockCheckUsernameAvailability: jest.Mock;

  beforeEach(async () => {
    mockFindByFirebaseUid = jest.fn().mockResolvedValue(mockUser);
    mockCheckUsernameAvailability = jest
      .fn()
      .mockResolvedValue({ available: true, username: 'john_doe' });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findByFirebaseUid: mockFindByFirebaseUid,
            checkUsernameAvailability: mockCheckUsernameAvailability,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('GET /api/v1/users/me', () => {
    it('returns the authenticated user without the firebaseUid field', () => {
      const result = controller.getMe(mockAuthUser);

      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('firebaseUid');
      // Must NOT call the service — the user is already in request.user from the guard
      expect(mockFindByFirebaseUid).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/username-available', () => {
    it('delegates to UsersService and returns the availability result', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({ available: true, username: 'john_doe' });

      const result = await controller.checkUsernameAvailability('john_doe');

      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('john_doe');
      expect(result).toEqual({ available: true, username: 'john_doe' });
    });

    it('normalizes the username to lowercase before delegating', async () => {
      await controller.checkUsernameAvailability('John_Doe');

      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('john_doe');
    });

    it('returns available: false when the username is taken', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({ available: false, username: 'taken_user' });

      const result = await controller.checkUsernameAvailability('taken_user');

      expect(result).toEqual({ available: false, username: 'taken_user' });
    });

    it('throws BadRequestException for a username that is too short', () => {
      expect(() => controller.checkUsernameAvailability('ab')).toThrow(BadRequestException);
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for a username that is too long', () => {
      expect(() => controller.checkUsernameAvailability('a'.repeat(31))).toThrow(
        BadRequestException,
      );
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for a username with disallowed characters', () => {
      expect(() => controller.checkUsernameAvailability('john doe')).toThrow(BadRequestException);
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the username query param is absent', () => {
      // @Query returns undefined when the param is missing
      expect(() => controller.checkUsernameAvailability(undefined as unknown as string)).toThrow(
        BadRequestException,
      );
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });
  });
});
