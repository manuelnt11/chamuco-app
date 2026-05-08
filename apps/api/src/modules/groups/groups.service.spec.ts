import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  GroupVisibility,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import { GroupsService } from './groups.service';
import type { CreateGroupDto } from './dto/create-group.dto';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { AuthenticatedUser } from '@/types/express';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

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
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastActiveAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockCoverAssetRow = {
  id: 'asset-uuid',
  type: 'image' as const,
  source: 'emoji' as const,
  target: '🏔️',
  fileSize: null,
  isPublic: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockGroupRow = {
  id: 'group-uuid',
  name: 'Mountain Crew',
  description: null,
  cover: 'asset-uuid',
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-uuid',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockResolvedCover = {
  id: 'asset-uuid',
  type: 'image' as const,
  source: 'emoji' as const,
  target: '🏔️',
  fileSize: undefined,
  isPublic: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  url: 'https://twemoji.cdn/emoji.svg',
};

describe('GroupsService', () => {
  let service: GroupsService;
  let mockGroupsFindFirst: jest.Mock;
  let mockAssetsFindFirst: jest.Mock;
  let mockReturning: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockTransaction: jest.Mock;
  let mockAssetResolverResolve: jest.Mock;
  let mockCloudStorageDelete: jest.Mock;
  let mockCloudStorageMakePublic: jest.Mock;

  beforeEach(async () => {
    mockGroupsFindFirst = jest.fn();
    mockAssetsFindFirst = jest.fn();
    mockReturning = jest.fn();
    mockInsertReturning = jest.fn();
    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockAssetResolverResolve = jest.fn().mockResolvedValue(mockResolvedCover);
    mockCloudStorageDelete = jest.fn().mockResolvedValue(undefined);
    mockCloudStorageMakePublic = jest.fn().mockResolvedValue(undefined);

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
    mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning });
    const mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });
    const mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              groups: { findFirst: mockGroupsFindFirst },
              assets: { findFirst: mockAssetsFindFirst },
            },
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            transaction: (mockTransaction = jest
              .fn()
              .mockImplementation(async (callback: (trx: unknown) => Promise<unknown>) =>
                callback({
                  update: mockUpdate,
                  insert: mockInsert,
                  delete: mockDelete,
                  query: { assets: { findFirst: mockAssetsFindFirst } },
                }),
              )),
          },
        },
        {
          provide: AssetResolverService,
          useValue: { resolve: mockAssetResolverResolve },
        },
        {
          provide: CloudStorageService,
          useValue: {
            deleteObject: mockCloudStorageDelete,
            makePublic: mockCloudStorageMakePublic,
            getPublicUrl: jest.fn().mockReturnValue('https://storage.googleapis.com/bucket/key'),
            generateSignedDownloadUrl: jest.fn().mockResolvedValue('https://signed-url'),
          },
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  describe('createGroup', () => {
    const createDto: CreateGroupDto = {
      name: 'Mountain Crew',
      visibility: GroupVisibility.PUBLIC,
      cover: { source: 'emoji', target: '🏔️' },
    };

    beforeEach(() => {
      mockInsertReturning
        .mockResolvedValueOnce([mockCoverAssetRow])
        .mockResolvedValueOnce([mockGroupRow]);
      mockGroupsFindFirst.mockResolvedValue(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(mockCoverAssetRow);
    });

    it('creates group and returns response DTO', async () => {
      const result = await service.createGroup(mockUser, createDto);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('group-uuid');
      expect(result.name).toBe('Mountain Crew');
      expect(result.visibility).toBe(GroupVisibility.PUBLIC);
      expect(result.cover).toEqual(mockResolvedCover);
      expect(result.createdBy).toBe('user-uuid');
    });

    it('does not call makePublic for emoji cover', async () => {
      await service.createGroup(mockUser, createDto);

      expect(mockCloudStorageMakePublic).not.toHaveBeenCalled();
    });

    it('calls makePublic for gcs cover with public prefix', async () => {
      const gcsDto: CreateGroupDto = {
        ...createDto,
        cover: { source: 'gcs', target: 'group-covers/group-uuid/cover.jpg', fileSize: 512000 },
      };
      mockInsertReturning
        .mockResolvedValueOnce([
          { ...mockCoverAssetRow, source: 'gcs', target: 'group-covers/group-uuid/cover.jpg' },
        ])
        .mockResolvedValueOnce([mockGroupRow]);

      await service.createGroup(mockUser, gcsDto);

      expect(mockCloudStorageMakePublic).toHaveBeenCalledWith('group-covers/group-uuid/cover.jpg');
    });

    it('does not call makePublic for gcs cover with non-public prefix', async () => {
      const gcsDto: CreateGroupDto = {
        ...createDto,
        cover: { source: 'gcs', target: 'private/cover.jpg', fileSize: 512000 },
      };
      mockInsertReturning
        .mockReset()
        .mockResolvedValueOnce([
          { ...mockCoverAssetRow, source: 'gcs', target: 'private/cover.jpg' },
        ])
        .mockResolvedValueOnce([mockGroupRow]);

      await service.createGroup(mockUser, gcsDto);

      expect(mockCloudStorageMakePublic).not.toHaveBeenCalled();
    });

    it('throws when cover asset insert fails in transaction', async () => {
      mockInsertReturning.mockReset().mockResolvedValueOnce([]);

      await expect(service.createGroup(mockUser, createDto)).rejects.toThrow(
        'Failed to create cover asset',
      );
    });

    it('throws when group insert fails in transaction', async () => {
      mockInsertReturning
        .mockReset()
        .mockResolvedValueOnce([mockCoverAssetRow])
        .mockResolvedValueOnce([]);

      await expect(service.createGroup(mockUser, createDto)).rejects.toThrow(
        'Failed to create group',
      );
    });
  });

  describe('findById', () => {
    it('returns the group when found', async () => {
      mockGroupsFindFirst.mockResolvedValue(mockGroupRow);

      const result = await service.findById('group-uuid');

      expect(result).toEqual(mockGroupRow);
    });

    it('returns null when group is not found', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      const result = await service.findById('missing-uuid');

      expect(result).toBeNull();
    });
  });

  describe('getGroup', () => {
    it('returns the group response DTO', async () => {
      mockGroupsFindFirst.mockResolvedValue(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(mockCoverAssetRow);

      const result = await service.getGroup('group-uuid');

      expect(result.id).toBe('group-uuid');
      expect(result.cover).toEqual(mockResolvedCover);
    });

    it('throws NotFoundException when group is missing', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      await expect(service.getGroup('missing-uuid')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when cover asset is not found', async () => {
      mockGroupsFindFirst.mockResolvedValue(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(undefined);

      await expect(service.getGroup('group-uuid')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when cover resolution fails', async () => {
      mockGroupsFindFirst.mockResolvedValue(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(mockCoverAssetRow);
      mockAssetResolverResolve.mockResolvedValue(null);

      await expect(service.getGroup('group-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listMyGroups', () => {
    it('returns empty array (stub until group_members is implemented)', async () => {
      const result = await service.listMyGroups('user-uuid');

      expect(result).toEqual([]);
    });
  });

  describe('updateGroup', () => {
    const updateDto: UpdateGroupDto = { name: 'Updated Crew' };

    it('updates group metadata and returns response DTO', async () => {
      mockGroupsFindFirst.mockResolvedValueOnce(mockGroupRow).mockResolvedValueOnce(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(mockCoverAssetRow);
      mockReturning.mockResolvedValue([{ ...mockGroupRow, name: 'Updated Crew' }]);

      const result = await service.updateGroup(mockUser, 'group-uuid', updateDto);

      expect(result).toBeDefined();
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      await expect(service.updateGroup(mockUser, 'missing-uuid', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not the owner', async () => {
      mockGroupsFindFirst.mockResolvedValue({ ...mockGroupRow, createdBy: 'other-user-uuid' });

      await expect(service.updateGroup(mockUser, 'group-uuid', updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('replaces cover asset and deletes old asset when cover is updated', async () => {
      const coverUpdateDto: UpdateGroupDto = {
        cover: { source: 'emoji', target: '🌴' },
      };
      const newAssetRow = { ...mockCoverAssetRow, id: 'new-asset-uuid', target: '🌴' };

      mockGroupsFindFirst
        .mockResolvedValueOnce(mockGroupRow)
        .mockResolvedValueOnce({ ...mockGroupRow, cover: 'new-asset-uuid' });
      mockAssetsFindFirst
        .mockResolvedValueOnce(mockCoverAssetRow)
        .mockResolvedValueOnce(newAssetRow);
      mockInsertReturning.mockResolvedValue([newAssetRow]);

      await service.updateGroup(mockUser, 'group-uuid', coverUpdateDto);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
    });

    it('calls deleteObject and deletes asset record when replacing gcs cover', async () => {
      const gcsCoverRow = {
        ...mockCoverAssetRow,
        id: 'old-gcs-asset',
        source: 'gcs' as const,
        target: 'group-covers/group-uuid/old.jpg',
      };
      const coverUpdateDto: UpdateGroupDto = {
        cover: { source: 'emoji', target: '🌴' },
      };
      const newAssetRow = { ...mockCoverAssetRow, id: 'new-asset-uuid', target: '🌴' };

      mockGroupsFindFirst
        .mockResolvedValueOnce({ ...mockGroupRow, cover: 'old-gcs-asset' })
        .mockResolvedValueOnce({ ...mockGroupRow, cover: 'new-asset-uuid' });
      mockAssetsFindFirst.mockResolvedValueOnce(gcsCoverRow).mockResolvedValueOnce(newAssetRow);
      mockInsertReturning.mockResolvedValue([newAssetRow]);

      await service.updateGroup(mockUser, 'group-uuid', coverUpdateDto);

      expect(mockCloudStorageDelete).toHaveBeenCalledWith('group-covers/group-uuid/old.jpg');
    });

    it('does not throw when gcs delete fails during updateGroup', async () => {
      const gcsCoverRow = {
        ...mockCoverAssetRow,
        id: 'old-gcs-asset',
        source: 'gcs' as const,
        target: 'group-covers/group-uuid/old.jpg',
      };
      const coverUpdateDto: UpdateGroupDto = {
        cover: { source: 'emoji', target: '🌴' },
      };
      const newAssetRow = { ...mockCoverAssetRow, id: 'new-asset-uuid', target: '🌴' };

      mockGroupsFindFirst
        .mockResolvedValueOnce({ ...mockGroupRow, cover: 'old-gcs-asset' })
        .mockResolvedValueOnce({ ...mockGroupRow, cover: 'new-asset-uuid' });
      mockAssetsFindFirst.mockResolvedValueOnce(gcsCoverRow).mockResolvedValueOnce(newAssetRow);
      mockInsertReturning.mockResolvedValue([newAssetRow]);
      mockCloudStorageDelete.mockRejectedValue(new Error('GCS unavailable'));

      await expect(
        service.updateGroup(mockUser, 'group-uuid', coverUpdateDto),
      ).resolves.toBeDefined();
    });

    it('updates description and visibility fields', async () => {
      const dto: UpdateGroupDto = { description: 'New desc', visibility: GroupVisibility.PRIVATE };
      mockGroupsFindFirst.mockResolvedValueOnce(mockGroupRow).mockResolvedValueOnce(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(mockCoverAssetRow);

      const result = await service.updateGroup(mockUser, 'group-uuid', dto);

      expect(result).toBeDefined();
    });

    it('does nothing when dto has no fields', async () => {
      const dto: UpdateGroupDto = {};
      mockGroupsFindFirst.mockResolvedValueOnce(mockGroupRow).mockResolvedValueOnce(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(mockCoverAssetRow);

      const result = await service.updateGroup(mockUser, 'group-uuid', dto);

      expect(result).toBeDefined();
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('throws when new cover asset insert fails in updateGroup transaction', async () => {
      const coverUpdateDto: UpdateGroupDto = { cover: { source: 'emoji', target: '🌴' } };
      mockGroupsFindFirst.mockResolvedValueOnce(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValueOnce(mockCoverAssetRow);
      mockInsertReturning.mockResolvedValueOnce([]);

      await expect(service.updateGroup(mockUser, 'group-uuid', coverUpdateDto)).rejects.toThrow(
        'Failed to create cover asset',
      );
    });

    it('does not call makePublic when new gcs cover has non-public prefix', async () => {
      const gcsUpdateDto: UpdateGroupDto = {
        cover: { source: 'gcs', target: 'private/cover.jpg', fileSize: 512000 },
      };
      const newAssetRow = {
        ...mockCoverAssetRow,
        id: 'new-asset-uuid',
        source: 'gcs' as const,
        target: 'private/cover.jpg',
      };

      mockGroupsFindFirst
        .mockResolvedValueOnce(mockGroupRow)
        .mockResolvedValueOnce({ ...mockGroupRow, cover: 'new-asset-uuid' });
      mockAssetsFindFirst
        .mockResolvedValueOnce(mockCoverAssetRow)
        .mockResolvedValueOnce(newAssetRow);
      mockInsertReturning.mockResolvedValue([newAssetRow]);

      await service.updateGroup(mockUser, 'group-uuid', gcsUpdateDto);

      expect(mockCloudStorageMakePublic).not.toHaveBeenCalled();
    });

    it('skips old asset cleanup when old asset is not found', async () => {
      const coverUpdateDto: UpdateGroupDto = { cover: { source: 'emoji', target: '🌴' } };
      const newAssetRow = { ...mockCoverAssetRow, id: 'new-asset-uuid', target: '🌴' };

      mockGroupsFindFirst
        .mockResolvedValueOnce(mockGroupRow)
        .mockResolvedValueOnce({ ...mockGroupRow, cover: 'new-asset-uuid' });
      mockAssetsFindFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(newAssetRow);
      mockInsertReturning.mockResolvedValue([newAssetRow]);

      await service.updateGroup(mockUser, 'group-uuid', coverUpdateDto);

      expect(mockDeleteWhere).not.toHaveBeenCalled();
      expect(mockCloudStorageDelete).not.toHaveBeenCalled();
    });

    it('calls makePublic when new cover is gcs with public prefix', async () => {
      const gcsUpdateDto: UpdateGroupDto = {
        cover: { source: 'gcs', target: 'group-covers/group-uuid/cover.jpg', fileSize: 512000 },
      };
      const newAssetRow = {
        ...mockCoverAssetRow,
        id: 'new-asset-uuid',
        source: 'gcs' as const,
        target: 'group-covers/group-uuid/cover.jpg',
      };

      mockGroupsFindFirst
        .mockResolvedValueOnce(mockGroupRow)
        .mockResolvedValueOnce({ ...mockGroupRow, cover: 'new-asset-uuid' });
      mockAssetsFindFirst
        .mockResolvedValueOnce(mockCoverAssetRow)
        .mockResolvedValueOnce(newAssetRow);
      mockInsertReturning.mockResolvedValue([newAssetRow]);

      await service.updateGroup(mockUser, 'group-uuid', gcsUpdateDto);

      expect(mockCloudStorageMakePublic).toHaveBeenCalledWith('group-covers/group-uuid/cover.jpg');
    });
  });

  describe('deleteGroup', () => {
    it('deletes group and cover asset in a single transaction', async () => {
      mockGroupsFindFirst.mockResolvedValue(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(mockCoverAssetRow);

      await service.deleteGroup(mockUser, 'group-uuid');

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockDeleteWhere).toHaveBeenCalledTimes(2);
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteGroup(mockUser, 'missing-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not the owner', async () => {
      mockGroupsFindFirst.mockResolvedValue({ ...mockGroupRow, createdBy: 'other-user-uuid' });

      await expect(service.deleteGroup(mockUser, 'group-uuid')).rejects.toThrow(ForbiddenException);
    });

    it('skips asset cleanup and transaction when cover asset is not found', async () => {
      mockGroupsFindFirst.mockResolvedValue(mockGroupRow);
      mockAssetsFindFirst.mockResolvedValue(undefined);

      await service.deleteGroup(mockUser, 'group-uuid');

      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
      expect(mockCloudStorageDelete).not.toHaveBeenCalled();
    });

    it('calls deleteObject for gcs cover before deleting asset record', async () => {
      const gcsGroup = { ...mockGroupRow, cover: 'gcs-asset-uuid' };
      const gcsCoverRow = {
        ...mockCoverAssetRow,
        id: 'gcs-asset-uuid',
        source: 'gcs' as const,
        target: 'group-covers/group-uuid/cover.jpg',
      };
      mockGroupsFindFirst.mockResolvedValue(gcsGroup);
      mockAssetsFindFirst.mockResolvedValue(gcsCoverRow);

      await service.deleteGroup(mockUser, 'group-uuid');

      expect(mockCloudStorageDelete).toHaveBeenCalledWith('group-covers/group-uuid/cover.jpg');
    });

    it('does not throw when gcs delete fails during deleteGroup', async () => {
      const gcsGroup = { ...mockGroupRow, cover: 'gcs-asset-uuid' };
      const gcsCoverRow = {
        ...mockCoverAssetRow,
        id: 'gcs-asset-uuid',
        source: 'gcs' as const,
        target: 'group-covers/group-uuid/cover.jpg',
      };
      mockGroupsFindFirst.mockResolvedValue(gcsGroup);
      mockAssetsFindFirst.mockResolvedValue(gcsCoverRow);
      mockCloudStorageDelete.mockRejectedValue(new Error('GCS unavailable'));

      await expect(service.deleteGroup(mockUser, 'group-uuid')).resolves.toBeUndefined();
    });
  });
});
