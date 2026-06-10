import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import {
  AuthProvider,
  DietaryPreference,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import { UsersService } from './users.service';
import type { UpdateAvatarDto } from './dto/update-avatar.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { AuthenticatedUser } from '@/types/express';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const mockHealthProfile = {
  userId: 'user-uuid',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: { day: 1, month: 1, year: 1990, year_visible: true },
  birthCountry: null,
  birthCity: null,
  homeCountry: 'CO',
  homeCity: null,
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  phoneVerified: false,
  email: 'test@example.com',
  emailVerified: false,
  bio: null,
  bloodType: null,
  dietaryPreference: DietaryPreference.OMNIVORE,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
  emergencyContacts: [],
  loyaltyPrograms: [],
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockUser: AuthenticatedUser = {
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
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let mockFindFirst: jest.Mock;
  let mockAssetsFindFirst: jest.Mock;
  let mockProfileFindFirst: jest.Mock;
  let mockReturning: jest.Mock;
  let mockSet: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockTransaction: jest.Mock;
  let mockAssetResolverResolve: jest.Mock;
  let mockCloudStorageDelete: jest.Mock;
  let mockCloudStorageMakePublic: jest.Mock;
  let mockUsersFindMany: jest.Mock;
  let mockAssetsFindMany: jest.Mock;
  let mockSelectWhere: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;

  beforeEach(async () => {
    mockFindFirst = jest.fn();
    mockAssetsFindFirst = jest.fn().mockResolvedValue(null);
    mockProfileFindFirst = jest.fn();
    mockReturning = jest.fn();
    mockInsertReturning = jest.fn();
    mockDeleteWhere = jest.fn();
    mockAssetResolverResolve = jest.fn().mockResolvedValue(null);
    mockCloudStorageDelete = jest.fn().mockResolvedValue(undefined);
    mockCloudStorageMakePublic = jest.fn().mockResolvedValue(undefined);
    mockUsersFindMany = jest.fn().mockResolvedValue([]);
    mockAssetsFindMany = jest.fn().mockResolvedValue([]);
    mockSelectWhere = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
    mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning });
    const mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });
    const mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              users: { findFirst: mockFindFirst, findMany: mockUsersFindMany },
              assets: { findFirst: mockAssetsFindFirst, findMany: mockAssetsFindMany },
              userProfiles: { findFirst: mockProfileFindFirst },
            },
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            select: mockSelect,
            transaction: (mockTransaction = jest
              .fn()
              .mockImplementation(async (callback: (trx: unknown) => Promise<unknown>) =>
                callback({ update: mockUpdate, insert: mockInsert, delete: mockDelete }),
              )),
          },
        },
        {
          provide: AssetResolverService,
          useValue: {
            resolve: mockAssetResolverResolve,
            resolveMany: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: CloudStorageService,
          useValue: {
            deleteObject: mockCloudStorageDelete,
            makePublic: mockCloudStorageMakePublic,
            getPublicUrl: jest.fn().mockReturnValue('https://storage.googleapis.com/bucket/key'),
            generateSignedDownloadUrl: jest.fn().mockResolvedValue('https://signed-url'),
            generateSignedUploadUrl: jest.fn(),
            isAllowedContentType: jest.fn().mockReturnValue(true),
            extractObjectKey: jest.fn(),
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

  describe('updateMe', () => {
    it('returns existing user unchanged when dto has no fields', async () => {
      const result = await service.updateMe(mockUser, {} as UpdateUserDto);

      expect(result.displayName).toBe('John Doe');
      expect(result).not.toHaveProperty('firebaseUid');
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('updates and returns the mapped response on success', async () => {
      const updated = { ...mockUser, displayName: 'Jane Doe' };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateMe(mockUser, { displayName: 'Jane Doe' });

      expect(result.displayName).toBe('Jane Doe');
      expect(result).not.toHaveProperty('firebaseUid');
    });

    it('updates timezone and returns the mapped response', async () => {
      const updated = { ...mockUser, timezone: 'America/Bogota' };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateMe(mockUser, { timezone: 'America/Bogota' });

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ timezone: 'America/Bogota' }));
      expect(result.timezone).toBe('America/Bogota');
    });

    it('returns profileVisibility in the response when dto has no fields', async () => {
      const result = await service.updateMe(mockUser, {});

      expect(result.profileVisibility).toBe(ProfileVisibility.PRIVATE);
    });

    it('updates profileVisibility and returns it in the response', async () => {
      const updated = { ...mockUser, profileVisibility: ProfileVisibility.PUBLIC };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateMe(mockUser, {
        profileVisibility: ProfileVisibility.PUBLIC,
      });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ profileVisibility: ProfileVisibility.PUBLIC }),
      );
      expect(result.profileVisibility).toBe(ProfileVisibility.PUBLIC);
    });

    it('throws NotFoundException when user is deleted between check and update', async () => {
      mockReturning.mockResolvedValue([]);

      await expect(service.updateMe(mockUser, { displayName: 'Jane' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(service.updateMe(mockUser, { displayName: 'Jane' })).rejects.toThrow(dbError);
    });
  });

  describe('getMe', () => {
    it('returns mapped user response for the given user', async () => {
      const result = await service.getMe(mockUser);

      expect(result.id).toBe('user-uuid');
      expect(result.avatar).toBeNull();
      expect(result).not.toHaveProperty('firebaseUid');
    });
  });

  describe('updateAvatar', () => {
    const newAssetId = 'new-asset-uuid';
    const newAsset = {
      id: newAssetId,
      type: 'image' as const,
      source: 'gcs' as const,
      target: 'avatars/user-uuid/photo.jpg',
      fileSize: 50000,
      isPublic: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const updatedUser = { ...mockUser, avatar: newAssetId };

    it('creates new gcs asset, updates user, and returns resolved user', async () => {
      mockInsertReturning.mockResolvedValue([newAsset]);
      mockFindFirst.mockResolvedValue(updatedUser);

      const dto: UpdateAvatarDto = {
        source: 'gcs',
        target: 'avatars/user-uuid/photo.jpg',
        fileSize: 50000,
      };
      const result = await service.updateAvatar(mockUser, dto);

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'gcs',
          target: 'avatars/user-uuid/photo.jpg',
          isPublic: true,
        }),
      );
      expect(mockCloudStorageMakePublic).toHaveBeenCalledWith('avatars/user-uuid/photo.jpg');
      expect(result.id).toBe('user-uuid');
      expect(mockCloudStorageDelete).not.toHaveBeenCalled();
    });

    it('deletes old gcs asset from storage and db when replacing gcs avatar', async () => {
      const oldAsset = {
        id: 'old-asset-uuid',
        type: 'image' as const,
        source: 'gcs' as const,
        target: 'avatars/user-uuid/old.jpg',
        fileSize: null,
        isPublic: true,
        createdAt: new Date(),
      };
      const userWithAvatar = { ...mockUser, avatar: 'old-asset-uuid' };
      mockAssetsFindFirst.mockResolvedValueOnce(oldAsset).mockResolvedValue(null);
      mockInsertReturning.mockResolvedValue([newAsset]);
      mockFindFirst.mockResolvedValue(updatedUser);

      await service.updateAvatar(userWithAvatar, {
        source: 'gcs',
        target: 'avatars/user-uuid/photo.jpg',
        fileSize: 50000,
      });

      expect(mockCloudStorageDelete).toHaveBeenCalledWith('avatars/user-uuid/old.jpg');
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('skips storage delete but cleans db record when old avatar is non-gcs', async () => {
      const oldUrlAsset = {
        id: 'old-url-asset-uuid',
        type: 'image' as const,
        source: 'url' as const,
        target: 'https://lh3.googleusercontent.com/photo.jpg',
        fileSize: null,
        isPublic: true,
        createdAt: new Date(),
      };
      const userWithUrlAvatar = { ...mockUser, avatar: 'old-url-asset-uuid' };
      mockAssetsFindFirst.mockResolvedValueOnce(oldUrlAsset).mockResolvedValue(null);
      mockInsertReturning.mockResolvedValue([newAsset]);
      mockFindFirst.mockResolvedValue(updatedUser);

      await service.updateAvatar(userWithUrlAvatar, {
        source: 'gcs',
        target: 'avatars/user-uuid/photo.jpg',
        fileSize: 50000,
      });

      expect(mockCloudStorageDelete).not.toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('does not throw when gcs delete fails during updateAvatar', async () => {
      const oldAsset = {
        id: 'old-asset-uuid',
        type: 'image' as const,
        source: 'gcs' as const,
        target: 'avatars/user-uuid/old.jpg',
        fileSize: null,
        isPublic: true,
        createdAt: new Date(),
      };
      const userWithAvatar = { ...mockUser, avatar: 'old-asset-uuid' };
      mockAssetsFindFirst.mockResolvedValueOnce(oldAsset).mockResolvedValue(null);
      mockInsertReturning.mockResolvedValue([newAsset]);
      mockFindFirst.mockResolvedValue(updatedUser);
      mockCloudStorageDelete.mockRejectedValue(new Error('GCS unavailable'));

      await expect(
        service.updateAvatar(userWithAvatar, {
          source: 'gcs',
          target: 'avatars/user-uuid/photo.jpg',
          fileSize: 50000,
        }),
      ).resolves.toBeDefined();
    });

    it('creates emoji asset and returns resolved user', async () => {
      const emojiAsset = {
        ...newAsset,
        id: 'emoji-asset-uuid',
        source: 'emoji' as const,
        target: '😀',
      };
      mockInsertReturning.mockResolvedValue([emojiAsset]);
      mockFindFirst.mockResolvedValue({ ...mockUser, avatar: 'emoji-asset-uuid' });

      const result = await service.updateAvatar(mockUser, { source: 'emoji', target: '😀' });

      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'emoji', target: '😀', isPublic: true }),
      );
      expect(mockCloudStorageMakePublic).not.toHaveBeenCalled();
      expect(result.id).toBe('user-uuid');
    });

    it('does not call makePublic for gcs asset with private prefix', async () => {
      const privateAsset = {
        ...newAsset,
        source: 'gcs' as const,
        target: 'group-resources/g-uuid/doc.pdf',
      };
      mockInsertReturning.mockResolvedValue([privateAsset]);
      mockFindFirst.mockResolvedValue(updatedUser);

      await service.updateAvatar(mockUser, {
        source: 'gcs',
        target: 'group-resources/g-uuid/doc.pdf',
      });

      expect(mockCloudStorageMakePublic).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user vanishes after transaction', async () => {
      mockInsertReturning.mockResolvedValue([newAsset]);
      mockFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateAvatar(mockUser, { source: 'gcs', target: 'avatars/user-uuid/photo.jpg' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicProfile', () => {
    const mockProfile = {
      ...mockHealthProfile,
      bio: 'Avid traveler',
    };

    it('returns public profile with bio when user and profile exist', async () => {
      mockFindFirst.mockResolvedValue(mockUser);
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result).toMatchObject({
        username: 'john_doe',
        displayName: 'John Doe',
        avatar: null,
        bio: 'Avid traveler',
        profileVisibility: ProfileVisibility.PRIVATE,
      });
    });

    it('returns bio as null when profile row does not exist', async () => {
      mockFindFirst.mockResolvedValue(mockUser);
      mockProfileFindFirst.mockResolvedValue(undefined);

      const result = await service.getPublicProfile('john_doe');

      expect(result.bio).toBeNull();
    });

    it('returns null gamification fields when profileVisibility is PRIVATE', async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        profileVisibility: ProfileVisibility.PRIVATE,
      });
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result.achievements).toBeNull();
      expect(result.recognitions).toBeNull();
      expect(result.discoveryMap).toBeNull();
      expect(result.travelerScore).toBeNull();
      expect(result.keyStats).toBeNull();
    });

    it('returns null gamification fields when profileVisibility is CONNECTIONS_ONLY', async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        profileVisibility: ProfileVisibility.CONNECTIONS_ONLY,
      });
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result.achievements).toBeNull();
      expect(result.recognitions).toBeNull();
      expect(result.discoveryMap).toBeNull();
    });

    it('returns null gamification fields when profileVisibility is MEMBERS_ONLY', async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        profileVisibility: ProfileVisibility.MEMBERS_ONLY,
      });
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result.achievements).toBeNull();
      expect(result.recognitions).toBeNull();
      expect(result.discoveryMap).toBeNull();
    });

    it('returns empty gamification stubs when profileVisibility is PUBLIC', async () => {
      mockFindFirst.mockResolvedValue({ ...mockUser, profileVisibility: ProfileVisibility.PUBLIC });
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result.achievements).toEqual([]);
      expect(result.recognitions).toEqual([]);
      expect(result.discoveryMap).toEqual([]);
      expect(result.travelerScore).toBeNull();
      expect(result.keyStats).toBeNull();
    });

    it('throws NotFoundException when username not found', async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(service.getPublicProfile('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchUsers', () => {
    const mockUserRow = {
      id: 'user-b',
      username: 'janedoe',
      displayName: 'Jane Doe',
      avatar: null,
      authProvider: AuthProvider.GOOGLE,
      firebaseUid: 'firebase-uid-b',
      timezone: 'UTC',
      platformRole: PlatformRole.USER,
      profileVisibility: ProfileVisibility.PRIVATE,
      agencyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };

    it('returns empty when q is not provided', async () => {
      const result = await service.searchUsers('user-uuid', {});
      expect(result).toEqual({ data: [], total: 0 });
      expect(mockSelectWhere).not.toHaveBeenCalled();
    });

    it('returns empty when q is just @ with nothing after', async () => {
      const result = await service.searchUsers('user-uuid', { q: '@' });
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('returns empty when total is 0', async () => {
      mockSelectWhere.mockResolvedValueOnce([{ total: 0 }]);
      const result = await service.searchUsers('user-uuid', { q: 'jane' });
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('returns matched users without avatars', async () => {
      mockSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockUsersFindMany.mockResolvedValueOnce([mockUserRow]);

      const result = await service.searchUsers('user-uuid', { q: 'jane' });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'user-b',
        username: 'janedoe',
        displayName: 'Jane Doe',
        avatar: null,
      });
    });

    it('resolves avatar assets for matched users', async () => {
      const mockAvatarRow = {
        id: 'asset-uuid',
        source: 'emoji',
        target: '😀',
        isPublic: true,
        createdAt: new Date(),
      };
      const resolvedAvatar = {
        source: 'emoji',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/svg/1f600.svg',
      };
      mockSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockUsersFindMany.mockResolvedValueOnce([{ ...mockUserRow, avatar: 'asset-uuid' }]);
      mockAssetsFindMany.mockResolvedValueOnce([mockAvatarRow]);
      mockAssetResolverResolve.mockResolvedValueOnce(resolvedAvatar);

      const result = await service.searchUsers('user-uuid', { q: 'jane' });

      expect(mockAssetResolverResolve).toHaveBeenCalled();
      expect(result.data[0]!.avatar).toEqual(resolvedAvatar);
    });

    it('@-prefix mode searches only by username prefix', async () => {
      mockSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockUsersFindMany.mockResolvedValueOnce([mockUserRow]);

      await service.searchUsers('user-uuid', { q: '@jane' });

      expect(mockSelectWhere).toHaveBeenCalled();
    });

    it('respects the limit parameter', async () => {
      mockSelectWhere.mockResolvedValueOnce([{ total: 5 }]);
      mockUsersFindMany.mockResolvedValueOnce([mockUserRow]);

      await service.searchUsers('user-uuid', { q: 'j', limit: 3 });

      expect(mockUsersFindMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 3 }));
    });
  });

  describe('SearchUsersQueryDto', () => {
    it('transforms string limit to number via @Type', async () => {
      const { SearchUsersQueryDto } = await import('./dto/search-users-query.dto');
      const dto = plainToInstance(SearchUsersQueryDto, { q: 'jane', limit: '5' });
      expect(dto.limit).toBe(5);
      expect(typeof dto.limit).toBe('number');
    });

    it('uses default limit of 10 when not provided', async () => {
      const { SearchUsersQueryDto } = await import('./dto/search-users-query.dto');
      const dto = plainToInstance(SearchUsersQueryDto, { q: 'jane' });
      expect(dto.limit).toBe(10);
    });
  });

  describe('UserSearchResultDto / UserSearchResponseDto', () => {
    it('UserSearchResultDto can be instantiated', async () => {
      const { UserSearchResultDto } = await import('./dto/user-search-result.dto');
      const dto = new UserSearchResultDto();
      dto.id = 'uuid';
      dto.username = 'janedoe';
      dto.displayName = 'Jane Doe';
      dto.avatar = null;
      expect(dto.username).toBe('janedoe');
    });

    it('UserSearchResponseDto can be instantiated', async () => {
      const { UserSearchResponseDto, UserSearchResultDto } =
        await import('./dto/user-search-result.dto');
      const result = new UserSearchResultDto();
      result.id = 'u1';
      result.username = 'janedoe';
      result.displayName = 'Jane Doe';
      result.avatar = null;
      const dto = new UserSearchResponseDto();
      dto.data = [result];
      dto.total = 1;
      expect(dto.total).toBe(1);
    });
  });
});
