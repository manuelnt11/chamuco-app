import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TripVisibility } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { TripsGroupsService } from './trips-groups.service';
import { TripsService } from '@/modules/trips/trips.service';
import { makeAuthenticatedUser } from '@/test/fixtures/user.fixture';

const mockUser = makeAuthenticatedUser();

const mockTripRow = {
  id: 'trip-uuid',
  name: 'Cancún 2026',
  status: 'DRAFT',
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CIUDAD DE MEXICO',
  landingCountry: 'MX',
  landingCity: 'CANCUN',
  createdBy: 'user-uuid',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockGroupRow = {
  id: 'group-uuid',
  name: 'Aventureros MX',
  deletedAt: null,
};

const mockGroupTripRow = {
  tripId: 'trip-uuid',
  groupId: 'group-uuid',
  addedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TripsGroupsService', () => {
  let service: TripsGroupsService;
  let mockTripsFindFirst: jest.Mock;
  let mockGroupsFindFirst: jest.Mock;
  let mockGroupsFindMany: jest.Mock;
  let mockGroupTripsFindFirst: jest.Mock;
  let mockAssetsFindMany: jest.Mock;
  let mockSelectWhere: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;
  let mockInsertOnConflictDoNothing: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;
  let mockAssertOrganizerRole: jest.Mock;
  let mockAssetResolve: jest.Mock;

  const mockAssetRow = {
    id: 'asset-uuid',
    type: 'EMOJI' as const,
    source: 'emoji',
    target: '🏔️',
    fileSize: null,
    isPublic: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockTripRow);
    mockGroupsFindFirst = jest.fn().mockResolvedValue(mockGroupRow);
    mockGroupsFindMany = jest.fn().mockResolvedValue([{ ...mockGroupRow, cover: 'asset-uuid' }]);
    mockGroupTripsFindFirst = jest.fn().mockResolvedValue(mockGroupTripRow);
    mockAssetsFindMany = jest.fn().mockResolvedValue([mockAssetRow]);
    mockAssetResolve = jest.fn().mockResolvedValue({ url: 'https://cdn/emoji.svg' });

    mockSelectWhere = jest.fn().mockResolvedValue([mockGroupTripRow]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertOnConflictDoNothing = jest.fn().mockResolvedValue(undefined);
    mockInsertValues = jest.fn().mockReturnValue({
      onConflictDoNothing: mockInsertOnConflictDoNothing,
    });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    mockAssertOrganizerRole = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsGroupsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findFirst: mockTripsFindFirst },
              groups: { findFirst: mockGroupsFindFirst, findMany: mockGroupsFindMany },
              groupTrips: { findFirst: mockGroupTripsFindFirst },
              assets: { findMany: mockAssetsFindMany },
            },
            select: mockSelect,
            insert: mockInsert,
            delete: mockDelete,
          },
        },
        {
          provide: TripsService,
          useValue: { assertOrganizerRole: mockAssertOrganizerRole },
        },
        {
          provide: AssetResolverService,
          useValue: { resolve: mockAssetResolve },
        },
      ],
    }).compile();

    service = module.get<TripsGroupsService>(TripsGroupsService);
  });

  describe('listLinkedGroups', () => {
    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValueOnce(null);

      await expect(service.listLinkedGroups('trip-uuid')).rejects.toThrow(NotFoundException);
    });

    it('returns groups with id, name, and coverUrl', async () => {
      const result = await service.listLinkedGroups('trip-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'group-uuid',
        name: 'Aventureros MX',
        coverUrl: 'https://cdn/emoji.svg',
      });
    });

    it('returns empty array when no groups are linked', async () => {
      mockSelectWhere.mockResolvedValue([]);

      const result = await service.listLinkedGroups('trip-uuid');

      expect(result).toEqual([]);
    });

    it('returns empty array when all linked groups are soft-deleted', async () => {
      mockGroupsFindMany.mockResolvedValue([]);

      const result = await service.listLinkedGroups('trip-uuid');

      expect(result).toEqual([]);
    });

    it('returns null coverUrl when group cover asset is orphaned', async () => {
      mockAssetsFindMany.mockResolvedValue([]);

      const result = await service.listLinkedGroups('trip-uuid');

      expect(result).toHaveLength(1);
      expect(result.at(0)?.coverUrl).toBeNull();
    });

    it('returns null coverUrl when group has no cover', async () => {
      mockGroupsFindMany.mockResolvedValue([{ ...mockGroupRow, cover: null }]);

      const result = await service.listLinkedGroups('trip-uuid');

      expect(result).toHaveLength(1);
      expect(result.at(0)?.coverUrl).toBeNull();
    });
  });

  describe('listTripGroups', () => {
    it('returns mapped group-trip rows', async () => {
      const result = await service.listTripGroups(mockUser, 'trip-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tripId: 'trip-uuid',
        groupId: 'group-uuid',
        addedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('returns empty array when no groups are linked', async () => {
      mockSelectWhere.mockResolvedValue([]);

      const result = await service.listTripGroups(mockUser, 'trip-uuid');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(null);

      await expect(service.listTripGroups(mockUser, 'trip-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());

      await expect(service.listTripGroups(mockUser, 'trip-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addTripGroup', () => {
    it('inserts and returns the group-trip row', async () => {
      const result = await service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertOnConflictDoNothing).toHaveBeenCalled();
      expect(result).toEqual({
        tripId: 'trip-uuid',
        groupId: 'group-uuid',
        addedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('is idempotent — no error when group already linked', async () => {
      mockInsertOnConflictDoNothing.mockResolvedValue(undefined);

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).resolves.toBeDefined();
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(null);

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupsFindFirst.mockResolvedValue(null);

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when group is soft-deleted', async () => {
      mockGroupsFindFirst.mockResolvedValue(null); // isNull(deletedAt) filter excludes it

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeTripGroup', () => {
    it('deletes the group-trip row', async () => {
      await service.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(null);

      await expect(service.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when group link does not exist', async () => {
      mockGroupTripsFindFirst.mockResolvedValue(null);

      await expect(service.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());

      await expect(service.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
