import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersService } from './users.service';
import type { AuthenticatedUser } from '@/types/express';

const mockUser: AuthenticatedUser = {
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
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let mockFindFirst: jest.Mock;

  beforeEach(async () => {
    mockFindFirst = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: { users: { findFirst: mockFindFirst } },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByFirebaseUid', () => {
    it('returns the user when found', async () => {
      mockFindFirst.mockResolvedValue(mockUser);

      const result = await service.findByFirebaseUid('firebase-uid-123');

      expect(result).toEqual(mockUser);
      expect(mockFindFirst).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when no user matches the firebaseUid', async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(service.findByFirebaseUid('unknown-uid')).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockFindFirst.mockRejectedValue(dbError);

      await expect(service.findByFirebaseUid('firebase-uid-123')).rejects.toThrow(dbError);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('returns available: true when no user has that username', async () => {
      mockFindFirst.mockResolvedValue(undefined);

      const result = await service.checkUsernameAvailability('free_name');

      expect(result).toEqual({ available: true, username: 'free_name' });
    });

    it('returns available: false when the username is already taken', async () => {
      mockFindFirst.mockResolvedValue(mockUser);

      const result = await service.checkUsernameAvailability('john_doe');

      expect(result).toEqual({ available: false, username: 'john_doe' });
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockFindFirst.mockRejectedValue(dbError);

      await expect(service.checkUsernameAvailability('some_user')).rejects.toThrow(dbError);
    });
  });
});
