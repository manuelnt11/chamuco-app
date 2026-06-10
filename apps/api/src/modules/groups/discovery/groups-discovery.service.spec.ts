import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GroupMemberStatus, GroupVisibility } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { GroupsDiscoveryService } from './groups-discovery.service';
import type { SearchGroupsQueryDto } from '@/modules/groups/dto/search-groups-query.dto';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

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

const mockOwnerMembership = {
  groupId: 'group-uuid',
  userId: 'user-uuid',
  status: GroupMemberStatus.ACTIVE,
  role: 'OWNER',
  initiatedAt: new Date('2026-01-01T00:00:00.000Z'),
  respondedAt: new Date('2026-01-01T00:00:00.000Z'),
  initiatedBy: 'user-uuid',
  decidedBy: 'user-uuid',
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

describe('GroupsDiscoveryService', () => {
  let service: GroupsDiscoveryService;
  let mockGroupsFindMany: jest.Mock;
  let mockGroupMembersFindMany: jest.Mock;
  let mockAssetsFindMany: jest.Mock;
  let mockGroupsSelectWhere: jest.Mock;
  let mockGroupsSelectFrom: jest.Mock;
  let mockGroupsSelect: jest.Mock;
  let mockAssetResolverResolve: jest.Mock;

  beforeEach(async () => {
    mockGroupsFindMany = jest.fn().mockResolvedValue([]);
    mockGroupMembersFindMany = jest.fn().mockResolvedValue([]);
    mockAssetsFindMany = jest.fn().mockResolvedValue([]);
    mockGroupsSelectWhere = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockGroupsSelectFrom = jest.fn().mockReturnValue({ where: mockGroupsSelectWhere });
    mockGroupsSelect = jest.fn().mockReturnValue({ from: mockGroupsSelectFrom });
    mockAssetResolverResolve = jest.fn().mockResolvedValue(mockResolvedCover);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsDiscoveryService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              groups: { findMany: mockGroupsFindMany },
              assets: { findMany: mockAssetsFindMany },
              groupMembers: { findMany: mockGroupMembersFindMany },
            },
            select: mockGroupsSelect,
          },
        },
        {
          provide: AssetResolverService,
          useValue: { resolve: mockAssetResolverResolve },
        },
      ],
    }).compile();

    service = module.get<GroupsDiscoveryService>(GroupsDiscoveryService);
  });

  // ─── listMyGroups ─────────────────────────────────────────────────────────────

  describe('listMyGroups', () => {
    it('returns empty array when user has no active memberships', async () => {
      mockGroupMembersFindMany.mockResolvedValue([]);

      const result = await service.listMyGroups('user-uuid');

      expect(result).toEqual([]);
    });

    it('returns groups for active memberships', async () => {
      mockGroupMembersFindMany.mockResolvedValue([mockOwnerMembership]);
      mockGroupsFindMany.mockResolvedValue([mockGroupRow]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow]);

      const result = await service.listMyGroups('user-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('group-uuid');
    });
  });

  // ─── searchGroups ─────────────────────────────────────────────────────────────

  describe('searchGroups', () => {
    const baseQuery: SearchGroupsQueryDto = { limit: 20, offset: 0 };

    const mockGroupRow2 = {
      id: 'group-uuid-2',
      name: 'Beach Crew',
      description: 'Sun and surf',
      cover: 'asset-uuid-2',
      visibility: GroupVisibility.PUBLIC,
      createdBy: 'other-user-uuid',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    const mockCoverAssetRow2 = { ...mockCoverAssetRow, id: 'asset-uuid-2', target: '🏖️' };

    const mockActiveMember = {
      groupId: 'group-uuid',
      userId: 'user-uuid',
      status: GroupMemberStatus.ACTIVE,
    };

    const mockRequestMember = {
      groupId: 'group-uuid-2',
      userId: 'user-uuid',
      status: GroupMemberStatus.REQUEST,
    };

    beforeEach(() => {
      mockAssetResolverResolve.mockResolvedValue(mockResolvedCover);
    });

    it('returns empty result when no public groups match', async () => {
      mockGroupMembersFindMany.mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 0 }]);

      const result = await service.searchGroups('user-uuid', baseQuery);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('returns only PUBLIC non-deleted groups', async () => {
      mockGroupMembersFindMany
        .mockResolvedValueOnce([]) // active memberships
        .mockResolvedValueOnce([]) // active member counts
        .mockResolvedValueOnce([]); // user membership status
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

      const result = await service.searchGroups('user-uuid', baseQuery);

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe('group-uuid-2');
    });

    it('excludes groups where user is already an active member', async () => {
      mockGroupMembersFindMany
        .mockResolvedValueOnce([mockActiveMember]) // active memberships → exclude group-uuid
        .mockResolvedValueOnce([]) // active member counts
        .mockResolvedValueOnce([]); // user membership status
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

      const result = await service.searchGroups('user-uuid', baseQuery);

      expect(result.data.every((g) => g.id !== 'group-uuid')).toBe(true);
    });

    it('returns membershipStatus "none" when user has no row', async () => {
      mockGroupMembersFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

      const result = await service.searchGroups('user-uuid', baseQuery);

      expect(result.data[0]?.membershipStatus).toBe('none');
    });

    it('returns membershipStatus "pending" when user has a REQUEST row', async () => {
      mockGroupMembersFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockRequestMember]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

      const result = await service.searchGroups('user-uuid', baseQuery);

      expect(result.data[0]?.membershipStatus).toBe('pending');
    });

    it('returns membershipStatus "pending" when user has an INVITED row', async () => {
      const invitedMember = { ...mockRequestMember, status: GroupMemberStatus.INVITED };
      mockGroupMembersFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([invitedMember]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

      const result = await service.searchGroups('user-uuid', baseQuery);

      expect(result.data[0]?.membershipStatus).toBe('pending');
    });

    it.each([GroupMemberStatus.REMOVED, GroupMemberStatus.LEFT, GroupMemberStatus.REJECTED])(
      'returns membershipStatus "none" when user has a %s row',
      async (status) => {
        const staleMember = { groupId: 'group-uuid-2', userId: 'user-uuid', status };
        mockGroupMembersFindMany
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([staleMember]);
        mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
        mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
        mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

        const result = await service.searchGroups('user-uuid', baseQuery);

        expect(result.data[0]?.membershipStatus).toBe('none');
      },
    );

    it('returns correct memberCount based on active members', async () => {
      const memberRow1 = { groupId: 'group-uuid-2' };
      const memberRow2 = { groupId: 'group-uuid-2' };
      mockGroupMembersFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([memberRow1, memberRow2])
        .mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

      const result = await service.searchGroups('user-uuid', baseQuery);

      expect(result.data[0]?.memberCount).toBe(2);
    });

    it('returns memberCount 0 when group has no active members', async () => {
      mockGroupMembersFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

      const result = await service.searchGroups('user-uuid', baseQuery);

      expect(result.data[0]?.memberCount).toBe(0);
    });

    it('respects limit and offset pagination', async () => {
      const paginatedQuery: SearchGroupsQueryDto = { limit: 1, offset: 1 };
      mockGroupMembersFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 2 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);

      const result = await service.searchGroups('user-uuid', paginatedQuery);

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(1);
    });

    it('returns empty data array when page is beyond total', async () => {
      const farQuery: SearchGroupsQueryDto = { limit: 20, offset: 100 };
      mockGroupMembersFindMany.mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([]);

      const result = await service.searchGroups('user-uuid', farQuery);

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(0);
    });

    it('throws NotFoundException when cover asset is missing for a result', async () => {
      mockGroupMembersFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([]);

      await expect(service.searchGroups('user-uuid', baseQuery)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when cover resolution fails', async () => {
      mockGroupMembersFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 1 }]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow2]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAssetRow2]);
      mockAssetResolverResolve.mockResolvedValue(null);

      await expect(service.searchGroups('user-uuid', baseQuery)).rejects.toThrow(NotFoundException);
    });

    it('uses default limit 20 and offset 0 when not provided', async () => {
      const queryWithDefaults: SearchGroupsQueryDto = {};
      mockGroupMembersFindMany.mockResolvedValueOnce([]);
      mockGroupsSelectWhere.mockResolvedValueOnce([{ total: 0 }]);

      const result = await service.searchGroups('user-uuid', queryWithDefaults);

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });
});
