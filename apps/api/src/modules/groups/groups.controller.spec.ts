import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  GroupVisibility,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsDiscoveryService } from './discovery/groups-discovery.service';
import { GroupJoinRequestsService } from './join-requests/group-join-requests.service';
import type { CreateGroupDto } from './dto/create-group.dto';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { GroupResponseDto } from './dto/group-response.dto';
import type { GroupSearchResponseDto } from './dto/group-search-result.dto';
import type { SearchGroupsQueryDto } from './dto/search-groups-query.dto';
import type { MyGroupJoinRequestResponseDto } from './join-requests/dto/my-group-join-request-response.dto';
import type { AuthenticatedUser } from '@/types/express';

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

const mockGroupResponse: GroupResponseDto = {
  id: 'group-uuid',
  name: 'Mountain Crew',
  description: null,
  coverUrl: 'https://twemoji.cdn/emoji.svg',
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-uuid',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

let mockCreateGroup: jest.Mock;
let mockGetGroup: jest.Mock;
let mockUpdateGroup: jest.Mock;
let mockDeleteGroup: jest.Mock;
let mockListMyGroups: jest.Mock;
let mockSearchGroups: jest.Mock;
let mockListMyPendingRequests: jest.Mock;

describe('GroupsController', () => {
  let controller: GroupsController;

  beforeEach(async () => {
    mockCreateGroup = jest.fn().mockResolvedValue(mockGroupResponse);
    mockGetGroup = jest.fn().mockResolvedValue(mockGroupResponse);
    mockUpdateGroup = jest.fn().mockResolvedValue(mockGroupResponse);
    mockDeleteGroup = jest.fn().mockResolvedValue(undefined);
    mockListMyGroups = jest.fn().mockResolvedValue([mockGroupResponse]);
    mockSearchGroups = jest
      .fn()
      .mockResolvedValue({ data: [mockGroupResponse], total: 1 } as GroupSearchResponseDto);
    mockListMyPendingRequests = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: {
            createGroup: mockCreateGroup,
            getGroup: mockGetGroup,
            updateGroup: mockUpdateGroup,
            deleteGroup: mockDeleteGroup,
          },
        },
        {
          provide: GroupsDiscoveryService,
          useValue: {
            listMyGroups: mockListMyGroups,
            searchGroups: mockSearchGroups,
          },
        },
        {
          provide: GroupJoinRequestsService,
          useValue: { listMyPendingRequests: mockListMyPendingRequests },
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
  });

  describe('POST /v1/groups', () => {
    it('delegates to GroupsService.createGroup and returns the result', async () => {
      const dto: CreateGroupDto = {
        name: 'Mountain Crew',
        visibility: GroupVisibility.PUBLIC,
        cover: { source: 'emoji', target: '🏔️' },
      };

      const result = await controller.createGroup(mockAuthUser, dto);

      expect(mockCreateGroup).toHaveBeenCalledWith(mockAuthUser, dto);
      expect(result).toEqual(mockGroupResponse);
    });
  });

  describe('GET /v1/groups', () => {
    it('delegates to GroupsDiscoveryService.listMyGroups and returns the list', async () => {
      const result = await controller.listMyGroups(mockAuthUser);

      expect(mockListMyGroups).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockGroupResponse]);
    });
  });

  describe('GET /v1/groups/search', () => {
    it('delegates to GroupsDiscoveryService.searchGroups and returns the result', async () => {
      const query: SearchGroupsQueryDto = { q: 'mountain', limit: 10, offset: 0 };

      const result = await controller.searchGroups(mockAuthUser, query);

      expect(mockSearchGroups).toHaveBeenCalledWith(mockAuthUser.id, query);
      expect(result).toEqual({ data: [mockGroupResponse], total: 1 });
    });
  });

  describe('GET /v1/groups/:id', () => {
    it('delegates to GroupsService.getGroup and returns the group', async () => {
      const result = await controller.getGroup(mockAuthUser, 'group-uuid');

      expect(mockGetGroup).toHaveBeenCalledWith(mockAuthUser.id, 'group-uuid');
      expect(result).toEqual(mockGroupResponse);
    });
  });

  describe('PATCH /v1/groups/:id', () => {
    it('delegates to GroupsService.updateGroup and returns the updated group', async () => {
      const dto: UpdateGroupDto = { name: 'Updated Crew' };

      const result = await controller.updateGroup(mockAuthUser, 'group-uuid', dto);

      expect(mockUpdateGroup).toHaveBeenCalledWith(mockAuthUser, 'group-uuid', dto);
      expect(result).toEqual(mockGroupResponse);
    });
  });

  describe('DELETE /v1/groups/:id', () => {
    it('delegates to GroupsService.deleteGroup and returns void', async () => {
      await controller.deleteGroup(mockAuthUser, 'group-uuid');

      expect(mockDeleteGroup).toHaveBeenCalledWith(mockAuthUser, 'group-uuid');
    });
  });

  describe('GET /v1/groups/join-requests/mine', () => {
    it('delegates to GroupJoinRequestsService.listMyPendingRequests and returns the list', async () => {
      const mockJoinRequest: MyGroupJoinRequestResponseDto = {
        groupId: 'group-uuid',
        name: 'Mountain Crew',
        coverUrl: 'https://twemoji.cdn/emoji.svg',
        visibility: GroupVisibility.PUBLIC,
        initiatedAt: '2026-01-01T00:00:00.000Z',
      };
      mockListMyPendingRequests.mockResolvedValueOnce([mockJoinRequest]);

      const result = await controller.listMyPendingJoinRequests(mockAuthUser);

      expect(mockListMyPendingRequests).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockJoinRequest]);
    });
  });
});
