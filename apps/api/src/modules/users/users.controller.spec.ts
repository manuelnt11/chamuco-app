import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { UpdateAvatarDto } from './dto/update-avatar.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import type { AuthenticatedUser } from '@/types/express';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'john_doe',
  displayName: 'John Doe',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const { firebaseUid: _, ...mockUser } = mockAuthUser;

const mockPublicProfileResponse: PublicProfileResponseDto = {
  username: 'john_doe',
  displayName: 'John Doe',
  avatar: null,
  bio: null,
  profileVisibility: ProfileVisibility.PRIVATE,
  travelerScore: null,
  achievements: null,
  recognitions: null,
  keyStats: null,
  discoveryMap: null,
};

describe('UsersController', () => {
  let controller: UsersController;
  let mockGetMe: jest.Mock;
  let mockUpdateMe: jest.Mock;
  let mockUpdateAvatar: jest.Mock;
  let mockCheckUsernameAvailability: jest.Mock;
  let mockGetPublicProfile: jest.Mock;
  let mockSearchUsers: jest.Mock;

  beforeEach(async () => {
    mockGetMe = jest.fn().mockResolvedValue(mockUser);
    mockUpdateMe = jest.fn().mockResolvedValue(mockUser);
    mockUpdateAvatar = jest.fn().mockResolvedValue(mockUser);
    mockCheckUsernameAvailability = jest
      .fn()
      .mockResolvedValue({ available: true, username: 'john_doe' });
    mockGetPublicProfile = jest.fn().mockResolvedValue(mockPublicProfileResponse);
    mockSearchUsers = jest.fn().mockResolvedValue({ data: [], total: 0 });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getMe: mockGetMe,
            updateMe: mockUpdateMe,
            updateAvatar: mockUpdateAvatar,
            checkUsernameAvailability: mockCheckUsernameAvailability,
            getPublicProfile: mockGetPublicProfile,
            searchUsers: mockSearchUsers,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('GET /v1/users/me', () => {
    it('delegates to UsersService.getMe and returns the result', async () => {
      const result = await controller.getMe(mockAuthUser);

      expect(mockGetMe).toHaveBeenCalledWith(mockAuthUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('PATCH /v1/users/me/avatar', () => {
    it('delegates to UsersService.updateAvatar and returns the result', async () => {
      const dto: UpdateAvatarDto = { source: 'emoji', target: '😀' };
      const result = await controller.updateAvatar(mockAuthUser, dto);

      expect(mockUpdateAvatar).toHaveBeenCalledWith(mockAuthUser, dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('GET /v1/users/username-available', () => {
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
      expect(() => controller.checkUsernameAvailability(undefined as unknown as string)).toThrow(
        BadRequestException,
      );
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /v1/users/me', () => {
    it('delegates to usersService.updateMe with the authenticated user and dto', async () => {
      const dto: UpdateUserDto = { displayName: 'Jane Doe' };
      const updated = { ...mockUser, displayName: 'Jane Doe' };
      mockUpdateMe.mockResolvedValue(updated);

      const result = await controller.updateMe(mockAuthUser, dto);

      expect(mockUpdateMe).toHaveBeenCalledWith(mockAuthUser, dto);
      expect(result).toEqual(updated);
    });

    it('delegates profileVisibility update to service', async () => {
      const dto: UpdateUserDto = { profileVisibility: ProfileVisibility.PUBLIC };
      const updated = { ...mockUser, profileVisibility: ProfileVisibility.PUBLIC };
      mockUpdateMe.mockResolvedValue(updated);

      const result = await controller.updateMe(mockAuthUser, dto);

      expect(mockUpdateMe).toHaveBeenCalledWith(mockAuthUser, dto);
      expect(result.profileVisibility).toBe(ProfileVisibility.PUBLIC);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateMe.mockRejectedValue(new NotFoundException());

      await expect(controller.updateMe(mockAuthUser, {} as UpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /v1/users/:username/profile', () => {
    it('delegates to usersService.getPublicProfile with the username param', async () => {
      const result = await controller.getPublicProfile('john_doe');

      expect(mockGetPublicProfile).toHaveBeenCalledWith('john_doe');
      expect(result).toEqual(mockPublicProfileResponse);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetPublicProfile.mockRejectedValue(new NotFoundException());

      await expect(controller.getPublicProfile('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /v1/users/search', () => {
    const mockSearchResponse = {
      data: [{ id: 'user-b', username: 'janedoe', displayName: 'Jane Doe', avatar: null }],
      total: 1,
    };

    it('delegates to usersService.searchUsers with user id and query', async () => {
      mockSearchUsers.mockResolvedValue(mockSearchResponse);
      const query = { q: 'jane', limit: 10 };

      const result = await controller.searchUsers(mockAuthUser, query);

      expect(mockSearchUsers).toHaveBeenCalledWith(mockAuthUser.id, query);
      expect(result).toEqual(mockSearchResponse);
    });

    it('returns empty result when no users match', async () => {
      mockSearchUsers.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.searchUsers(mockAuthUser, { q: 'zzz' });

      expect(result).toEqual({ data: [], total: 0 });
    });

    it('passes groupId to the service when provided', async () => {
      const query = { q: 'jane', groupId: 'group-uuid' };

      await controller.searchUsers(mockAuthUser, query);

      expect(mockSearchUsers).toHaveBeenCalledWith(mockAuthUser.id, query);
    });
  });
});
