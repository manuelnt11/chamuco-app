import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  GroupVisibility,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import type { CreateGroupDto } from './dto/create-group.dto';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { GroupResponseDto } from './dto/group-response.dto';
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

const mockGroupResponse: GroupResponseDto = {
  id: 'group-uuid',
  name: 'Mountain Crew',
  description: null,
  cover: {
    id: 'asset-uuid',
    type: 'image',
    source: 'emoji',
    target: '🏔️',
    isPublic: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    url: 'https://twemoji.cdn/emoji.svg',
  },
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-uuid',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

let mockCreateGroup: jest.Mock;
let mockListMyGroups: jest.Mock;
let mockGetGroup: jest.Mock;
let mockUpdateGroup: jest.Mock;
let mockDeleteGroup: jest.Mock;

describe('GroupsController', () => {
  let controller: GroupsController;

  beforeEach(async () => {
    mockCreateGroup = jest.fn().mockResolvedValue(mockGroupResponse);
    mockListMyGroups = jest.fn().mockResolvedValue([mockGroupResponse]);
    mockGetGroup = jest.fn().mockResolvedValue(mockGroupResponse);
    mockUpdateGroup = jest.fn().mockResolvedValue(mockGroupResponse);
    mockDeleteGroup = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: {
            createGroup: mockCreateGroup,
            listMyGroups: mockListMyGroups,
            getGroup: mockGetGroup,
            updateGroup: mockUpdateGroup,
            deleteGroup: mockDeleteGroup,
          },
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
    it('delegates to GroupsService.listMyGroups and returns the list', async () => {
      const result = await controller.listMyGroups(mockAuthUser);

      expect(mockListMyGroups).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockGroupResponse]);
    });
  });

  describe('GET /v1/groups/:id', () => {
    it('delegates to GroupsService.getGroup and returns the group', async () => {
      const result = await controller.getGroup('group-uuid');

      expect(mockGetGroup).toHaveBeenCalledWith('group-uuid');
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
});
