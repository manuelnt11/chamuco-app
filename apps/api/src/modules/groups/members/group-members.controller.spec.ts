import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  GroupMemberStatus,
  GroupMemberTier,
  GroupRole,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { GroupMembersController } from './group-members.controller';
import { GroupMembersService } from './group-members.service';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import type { MemberResponseDto } from './dto/member-response.dto';
import type { PendingItemResponseDto } from './dto/pending-item-response.dto';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'admin-uuid',
  username: 'admin',
  displayName: 'Admin',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const mockMemberResponse: MemberResponseDto = {
  userId: 'user-uuid',
  username: 'user',
  displayName: 'User',
  avatarUrl: null,
  role: GroupRole.MEMBER,
  tier: GroupMemberTier.NEWCOMER,
  joinedAt: '2026-01-01T00:00:00.000Z',
};

const mockPendingResponse: PendingItemResponseDto = {
  userId: 'user-uuid',
  username: 'user',
  displayName: 'User',
  avatarUrl: null,
  status: GroupMemberStatus.REQUEST,
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

let mockRemoveMember: jest.Mock;
let mockUpdateMemberRole: jest.Mock;
let mockListActiveMembers: jest.Mock;
let mockListPendingMembers: jest.Mock;
let mockGetMyMembership: jest.Mock;

describe('GroupMembersController', () => {
  let controller: GroupMembersController;

  beforeEach(async () => {
    mockRemoveMember = jest.fn().mockResolvedValue(undefined);
    mockUpdateMemberRole = jest.fn().mockResolvedValue(undefined);
    mockListActiveMembers = jest.fn().mockResolvedValue([mockMemberResponse]);
    mockListPendingMembers = jest.fn().mockResolvedValue([mockPendingResponse]);
    mockGetMyMembership = jest.fn().mockResolvedValue({
      status: GroupMemberStatus.ACTIVE,
      role: GroupRole.MEMBER,
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupMembersController],
      providers: [
        {
          provide: GroupMembersService,
          useValue: {
            removeMember: mockRemoveMember,
            updateMemberRole: mockUpdateMemberRole,
            listActiveMembers: mockListActiveMembers,
            listPendingMembers: mockListPendingMembers,
            getMyMembership: mockGetMyMembership,
          },
        },
      ],
    }).compile();

    controller = module.get<GroupMembersController>(GroupMembersController);
  });

  describe('DELETE /v1/groups/:id/members/:userId', () => {
    it('delegates to GroupMembersService.removeMember', async () => {
      await controller.removeMember(mockAuthUser, 'group-uuid', 'user-uuid');

      expect(mockRemoveMember).toHaveBeenCalledWith('group-uuid', 'user-uuid', mockAuthUser.id);
    });
  });

  describe('PATCH /v1/groups/:id/members/:userId/role', () => {
    it('delegates to GroupMembersService.updateMemberRole', async () => {
      const dto: UpdateMemberRoleDto = { role: GroupRole.ADMIN };

      await controller.updateMemberRole(mockAuthUser, 'group-uuid', 'user-uuid', dto);

      expect(mockUpdateMemberRole).toHaveBeenCalledWith(
        'group-uuid',
        'user-uuid',
        dto,
        mockAuthUser.id,
      );
    });
  });

  describe('GET /v1/groups/:id/members', () => {
    it('delegates to GroupMembersService.listActiveMembers and returns the list', async () => {
      const result = await controller.listActiveMembers(mockAuthUser, 'group-uuid');

      expect(mockListActiveMembers).toHaveBeenCalledWith('group-uuid', mockAuthUser.id);
      expect(result).toEqual([mockMemberResponse]);
    });
  });

  describe('GET /v1/groups/:id/pending', () => {
    it('delegates to GroupMembersService.listPendingMembers and returns the list', async () => {
      const result = await controller.listPendingMembers(mockAuthUser, 'group-uuid');

      expect(mockListPendingMembers).toHaveBeenCalledWith('group-uuid', mockAuthUser.id);
      expect(result).toEqual([mockPendingResponse]);
    });
  });

  describe('GET /v1/groups/:id/me/membership', () => {
    it('delegates to GroupMembersService.getMyMembership and returns the result', async () => {
      const result = await controller.getMyMembership(mockAuthUser, 'group-uuid');

      expect(mockGetMyMembership).toHaveBeenCalledWith('group-uuid', mockAuthUser.id);
      expect(result).toEqual({ status: GroupMemberStatus.ACTIVE, role: GroupRole.MEMBER });
    });

    it('propagates NotFoundException when service throws', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      mockGetMyMembership.mockRejectedValue(new NotFoundException('Membership not found'));

      await expect(controller.getMyMembership(mockAuthUser, 'group-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
