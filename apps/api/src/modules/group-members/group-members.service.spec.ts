import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GroupMemberStatus,
  GroupMemberTier,
  GroupRole,
  GroupVisibility,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { GroupMembersService } from './group-members.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const NOW = new Date('2026-01-01T00:00:00.000Z');
const GROUP_ID = 'group-uuid';
const ADMIN_ID = 'admin-uuid';
const USER_ID = 'user-uuid';
const TARGET_ID = 'target-uuid';

const mockPublicGroup = {
  id: GROUP_ID,
  name: 'Mountain Crew',
  description: null,
  cover: null,
  visibility: GroupVisibility.PUBLIC,
  createdBy: ADMIN_ID,
  createdAt: NOW,
  updatedAt: NOW,
};

const mockPrivateGroup = { ...mockPublicGroup, visibility: GroupVisibility.PRIVATE };

const makeMembership = (
  userId: string,
  status: GroupMemberStatus,
  role: GroupRole = GroupRole.MEMBER,
) => ({
  groupId: GROUP_ID,
  userId,
  status,
  role,
  initiatedAt: NOW,
  respondedAt: status === GroupMemberStatus.ACTIVE ? NOW : null,
  initiatedBy: ADMIN_ID,
  decidedBy: status === GroupMemberStatus.ACTIVE ? ADMIN_ID : null,
});

const ownerMembership = makeMembership(ADMIN_ID, GroupMemberStatus.ACTIVE, GroupRole.OWNER);
const activeMembership = makeMembership(USER_ID, GroupMemberStatus.ACTIVE, GroupRole.MEMBER);
const requestMembership = makeMembership(USER_ID, GroupMemberStatus.REQUEST);
const invitedMembership = makeMembership(USER_ID, GroupMemberStatus.INVITED);
const rejectedMembership = makeMembership(USER_ID, GroupMemberStatus.REJECTED);
const removedMembership = makeMembership(USER_ID, GroupMemberStatus.REMOVED);

const mockTargetUser = {
  id: TARGET_ID,
  username: 'target_user',
  displayName: 'Target User',
  avatar: null,
};

const mockUserRow = {
  id: USER_ID,
  username: 'user',
  displayName: 'User',
  avatar: null,
};

describe('GroupMembersService', () => {
  let service: GroupMembersService;

  let mockGroupsFindFirst: jest.Mock;
  let mockGroupsFindMany: jest.Mock;
  let mockGroupMembersFindFirst: jest.Mock;
  let mockGroupMembersFindMany: jest.Mock;
  let mockUsersFindFirst: jest.Mock;
  let mockUsersFindMany: jest.Mock;
  let mockGroupMemberStatsFindMany: jest.Mock;
  let mockAssetsFindFirst: jest.Mock;
  let mockAssetsFindMany: jest.Mock;

  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;
  let mockInsertOnConflict: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;
  let mockSelectWhere: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockTransaction: jest.Mock;
  let mockAssetResolverResolve: jest.Mock;
  let mockNotificationsNotify: jest.Mock;
  let mockNotificationsNotifyMany: jest.Mock;

  beforeEach(async () => {
    mockGroupsFindFirst = jest.fn().mockResolvedValue(mockPublicGroup);
    mockGroupsFindMany = jest.fn().mockResolvedValue([]);
    mockGroupMembersFindFirst = jest.fn().mockResolvedValue(ownerMembership);
    mockGroupMembersFindMany = jest.fn().mockResolvedValue([]);
    mockUsersFindFirst = jest.fn().mockResolvedValue(mockTargetUser);
    mockUsersFindMany = jest.fn().mockResolvedValue([]);
    mockGroupMemberStatsFindMany = jest.fn().mockResolvedValue([]);
    mockAssetsFindFirst = jest.fn().mockResolvedValue(null);
    mockAssetsFindMany = jest.fn().mockResolvedValue([]);

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertOnConflict = jest.fn().mockResolvedValue(undefined);
    mockInsertReturning = jest.fn().mockResolvedValue([]);
    mockInsertValues = jest.fn().mockReturnValue({
      returning: mockInsertReturning,
      onConflictDoNothing: mockInsertOnConflict,
    });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    // Default: 2 active admins so assertNotSoleAdmin passes
    mockSelectWhere = jest.fn().mockResolvedValue([{ total: 2 }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    mockTransaction = jest.fn().mockImplementation(async (callback) =>
      callback({
        update: mockUpdate,
        insert: mockInsert,
        delete: mockDelete,
        select: mockSelect,
      }),
    );

    mockAssetResolverResolve = jest.fn().mockResolvedValue(null);
    mockNotificationsNotify = jest.fn().mockResolvedValue(undefined);
    mockNotificationsNotifyMany = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupMembersService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              groups: { findFirst: mockGroupsFindFirst, findMany: mockGroupsFindMany },
              groupMembers: {
                findFirst: mockGroupMembersFindFirst,
                findMany: mockGroupMembersFindMany,
              },
              groupMemberStats: { findMany: mockGroupMemberStatsFindMany },
              users: { findFirst: mockUsersFindFirst, findMany: mockUsersFindMany },
              assets: { findFirst: mockAssetsFindFirst, findMany: mockAssetsFindMany },
            },
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            select: mockSelect,
            transaction: mockTransaction,
          },
        },
        {
          provide: AssetResolverService,
          useValue: { resolve: mockAssetResolverResolve },
        },
        {
          provide: NotificationsService,
          useValue: { notify: mockNotificationsNotify, notifyMany: mockNotificationsNotifyMany },
        },
      ],
    }).compile();

    service = module.get<GroupMembersService>(GroupMembersService);
  });

  // ─── submitJoinRequest ───────────────────────────────────────────────────────

  describe('submitJoinRequest', () => {
    it('inserts new membership when no existing record', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(undefined); // no existing membership

      await service.submitJoinRequest(GROUP_ID, USER_ID);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.REQUEST, role: GroupRole.MEMBER }),
      );
    });

    it('throws NotFoundException when group not found', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      await expect(service.submitJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for private groups', async () => {
      mockGroupsFindFirst.mockResolvedValue(mockPrivateGroup);

      await expect(service.submitJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException when already ACTIVE', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership);

      await expect(service.submitJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when already REQUEST', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(requestMembership);

      await expect(service.submitJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('updates existing row when re-requesting after REJECTED', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(rejectedMembership);

      await service.submitJoinRequest(GROUP_ID, USER_ID);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.REQUEST, role: GroupRole.MEMBER }),
      );
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('updates existing row when re-requesting after REMOVED', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(removedMembership);

      await service.submitJoinRequest(GROUP_ID, USER_ID);

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  // ─── acceptJoinRequest ───────────────────────────────────────────────────────

  describe('acceptJoinRequest', () => {
    it('transitions REQUEST → ACTIVE and upserts stats inside transaction', async () => {
      // Call sequence for groupMembers.findFirst:
      // 1. assertGroupAdmin → admin membership
      // 2. findMemberOrThrow → REQUEST membership (target)
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(requestMembership);

      await service.acceptJoinRequest(GROUP_ID, USER_ID, ADMIN_ID);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.ACTIVE }),
      );
      expect(mockInsertOnConflict).toHaveBeenCalledTimes(1);
      expect(mockNotificationsNotify).toHaveBeenCalledWith(
        USER_ID,
        NotificationType.GROUP_JOIN_ACCEPTED,
        { groupId: GROUP_ID, groupName: 'Mountain Crew' },
        [NotificationChannel.PUSH],
      );
    });

    it('logs error and resolves when notify() rejects', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(requestMembership);
      mockNotificationsNotify.mockRejectedValueOnce(new Error('DB blip'));
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

      await expect(service.acceptJoinRequest(GROUP_ID, USER_ID, ADMIN_ID)).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalledWith(
        'Failed to send GROUP_JOIN_ACCEPTED notification',
        expect.any(Error),
      );
    });

    it('throws ForbiddenException when caller is not an admin', async () => {
      // assertGroupAdmin: group found, but no admin membership
      mockGroupMembersFindFirst.mockResolvedValueOnce(undefined);

      await expect(service.acceptJoinRequest(GROUP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when target has no membership record', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership) // admin check
        .mockResolvedValueOnce(undefined); // target not found

      await expect(service.acceptJoinRequest(GROUP_ID, TARGET_ID, ADMIN_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when target status is not REQUEST', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(invitedMembership); // not a REQUEST

      await expect(service.acceptJoinRequest(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── rejectJoinRequest ───────────────────────────────────────────────────────

  describe('rejectJoinRequest', () => {
    it('transitions REQUEST → REJECTED', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(requestMembership);

      await service.rejectJoinRequest(GROUP_ID, USER_ID, ADMIN_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.REJECTED }),
      );
    });

    it('throws ConflictException when target is not in REQUEST state', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(activeMembership);

      await expect(service.rejectJoinRequest(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── withdrawJoinRequest ─────────────────────────────────────────────────────

  describe('withdrawJoinRequest', () => {
    it('deletes the REQUEST row', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(requestMembership);

      await service.withdrawJoinRequest(GROUP_ID, USER_ID);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('throws ConflictException when no REQUEST exists', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership);

      await expect(service.withdrawJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException when membership not found', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(undefined);

      await expect(service.withdrawJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── sendInvitations ─────────────────────────────────────────────────────────

  describe('sendInvitations', () => {
    const dto: CreateInvitationDto = { usernames: ['target_user'] };
    const targetMembership = (status: GroupMemberStatus, role = GroupRole.MEMBER) =>
      makeMembership(TARGET_ID, status, role);

    it('inserts new INVITED membership and returns INVITED status', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(ownerMembership); // admin check
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([]); // no existing membership

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.INVITED }),
      );
      expect(result).toEqual({ results: [{ username: 'target_user', status: 'INVITED' }] });
      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        [TARGET_ID],
        NotificationType.GROUP_INVITATION,
        { groupId: GROUP_ID, groupName: 'Mountain Crew' },
        [NotificationChannel.PUSH],
      );
    });

    it('throws ForbiddenException when caller is not an admin', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(undefined); // no admin membership

      await expect(service.sendInvitations(GROUP_ID, dto, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns NOT_FOUND when target user does not exist', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(ownerMembership); // admin check
      mockUsersFindMany.mockResolvedValueOnce([]); // user not found
      mockGroupMembersFindMany.mockResolvedValueOnce([]); // no memberships (no users)

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(result).toEqual({ results: [{ username: 'target_user', status: 'NOT_FOUND' }] });
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('returns ALREADY_MEMBER when target is already ACTIVE', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(ownerMembership); // admin check
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([targetMembership(GroupMemberStatus.ACTIVE)]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(result).toEqual({
        results: [{ username: 'target_user', status: 'ALREADY_MEMBER' }],
      });
      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('returns ALREADY_INVITED when target already has INVITED status', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(ownerMembership); // admin check
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([targetMembership(GroupMemberStatus.INVITED)]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(result).toEqual({
        results: [{ username: 'target_user', status: 'ALREADY_INVITED' }],
      });
      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('returns HAS_PENDING_REQUEST when target has a pending join request', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(ownerMembership); // admin check
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([targetMembership(GroupMemberStatus.REQUEST)]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(result).toEqual({
        results: [{ username: 'target_user', status: 'HAS_PENDING_REQUEST' }],
      });
      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('re-invites after REJECTED, resets role to MEMBER, returns INVITED', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(ownerMembership); // admin check
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([
        targetMembership(GroupMemberStatus.REJECTED, GroupRole.ADMIN),
      ]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.INVITED, role: GroupRole.MEMBER }),
      );
      expect(mockInsert).not.toHaveBeenCalled();
      expect(result).toEqual({ results: [{ username: 'target_user', status: 'INVITED' }] });
      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        [TARGET_ID],
        NotificationType.GROUP_INVITATION,
        { groupId: GROUP_ID, groupName: 'Mountain Crew' },
        [NotificationChannel.PUSH],
      );
    });

    it('handles multiple usernames and returns per-user results', async () => {
      const multiDto: CreateInvitationDto = { usernames: ['user_a', 'user_b', 'user_c'] };
      const userA = { ...mockTargetUser, id: 'id-a', username: 'user_a' };
      const userB = { ...mockTargetUser, id: 'id-b', username: 'user_b' };
      const userC = { ...mockTargetUser, id: 'id-c', username: 'user_c' };

      mockGroupMembersFindFirst.mockResolvedValueOnce(ownerMembership); // admin check
      mockUsersFindMany.mockResolvedValueOnce([userA, userB, userC]);
      // userB is already an active member
      mockGroupMembersFindMany.mockResolvedValueOnce([
        makeMembership('id-b', GroupMemberStatus.ACTIVE),
      ]);

      const result = await service.sendInvitations(GROUP_ID, multiDto, ADMIN_ID);

      expect(result).toEqual({
        results: [
          { username: 'user_a', status: 'INVITED' },
          { username: 'user_b', status: 'ALREADY_MEMBER' },
          { username: 'user_c', status: 'INVITED' },
        ],
      });
      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        ['id-a', 'id-c'],
        NotificationType.GROUP_INVITATION,
        { groupId: GROUP_ID, groupName: 'Mountain Crew' },
        [NotificationChannel.PUSH],
      );
    });

    it('logs error and resolves when notifyMany() rejects', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(ownerMembership);
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([]);
      mockNotificationsNotifyMany.mockRejectedValueOnce(new Error('DB blip'));
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

      await expect(service.sendInvitations(GROUP_ID, dto, ADMIN_ID)).resolves.toBeDefined();
      expect(logSpy).toHaveBeenCalledWith(
        'Failed to send GROUP_INVITATION notifications',
        expect.any(Error),
      );
    });
  });

  // ─── acceptInvitation ────────────────────────────────────────────────────────

  describe('acceptInvitation', () => {
    it('transitions INVITED → ACTIVE, upserts stats, and notifies admins', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(invitedMembership);
      mockGroupMembersFindMany.mockResolvedValue([{ userId: ADMIN_ID }]);
      mockUsersFindFirst.mockResolvedValue(mockUserRow); // user accepting the invite

      await service.acceptInvitation(GROUP_ID, USER_ID);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.ACTIVE }),
      );
      expect(mockInsertOnConflict).toHaveBeenCalledTimes(1);
      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        [ADMIN_ID],
        NotificationType.GROUP_INVITATION_ACCEPTED,
        expect.objectContaining({
          groupId: GROUP_ID,
          groupName: mockPublicGroup.name,
          username: mockUserRow.username,
        }),
        [NotificationChannel.PUSH],
      );
    });

    it('does not throw when notifyMany fails', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(invitedMembership);
      mockGroupMembersFindMany.mockResolvedValue([{ userId: ADMIN_ID }]);
      mockUsersFindFirst.mockResolvedValue(mockUserRow);
      mockNotificationsNotifyMany.mockRejectedValue(new Error('FCM error'));

      await expect(service.acceptInvitation(GROUP_ID, USER_ID)).resolves.toBeUndefined();
    });

    it('skips notification when no active admins exist', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(invitedMembership);
      mockGroupMembersFindMany.mockResolvedValue([]);

      await service.acceptInvitation(GROUP_ID, USER_ID);

      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('throws ConflictException when no INVITED record exists', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(requestMembership);

      await expect(service.acceptInvitation(GROUP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when membership not found', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(undefined);

      await expect(service.acceptInvitation(GROUP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── declineInvitation ───────────────────────────────────────────────────────

  describe('declineInvitation', () => {
    it('transitions INVITED → REJECTED', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(invitedMembership);

      await service.declineInvitation(GROUP_ID, USER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.REJECTED }),
      );
    });

    it('throws ConflictException when no INVITED record exists', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership);

      await expect(service.declineInvitation(GROUP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });
  });

  // ─── revokeInvitation ────────────────────────────────────────────────────────

  describe('revokeInvitation', () => {
    it('deletes the INVITED row', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership) // admin check
        .mockResolvedValueOnce(invitedMembership); // target

      await service.revokeInvitation(GROUP_ID, USER_ID, ADMIN_ID);

      expect(mockDelete).toHaveBeenCalled();
    });

    it('throws ForbiddenException when caller is not an admin', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(undefined);

      await expect(service.revokeInvitation(GROUP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException when target is not INVITED', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(activeMembership);

      await expect(service.revokeInvitation(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── removeMember ────────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('admin removes active member → REMOVED', async () => {
      // Call sequence: groups.findFirst, groupMembers.findFirst(target), groupMembers.findFirst(requester)
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(activeMembership) // target (findMemberOrThrow)
        .mockResolvedValueOnce(ownerMembership); // requester (admin check)
      // assertNotSoleAdmin uses findMany; default [] → length not 1 → no throw

      await service.removeMember(GROUP_ID, USER_ID, ADMIN_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.REMOVED }),
      );
    });

    it('throws ForbiddenException when non-admin tries to remove another member', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership) // target (findMemberOrThrow)
        .mockResolvedValueOnce(activeMembership); // requester is plain MEMBER → not in ADMIN_ROLES

      await expect(service.removeMember(GROUP_ID, ADMIN_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when group not found', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      await expect(service.removeMember(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when admin tries to remove non-active member', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(requestMembership) // target (REQUEST, not ACTIVE)
        .mockResolvedValueOnce(ownerMembership); // requester (admin check passes)

      await expect(service.removeMember(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ForbiddenException when ADMIN tries to remove the OWNER', async () => {
      const ownerTarget = makeMembership(USER_ID, GroupMemberStatus.ACTIVE, GroupRole.OWNER);
      const adminRequester = makeMembership(ADMIN_ID, GroupMemberStatus.ACTIVE, GroupRole.ADMIN);
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerTarget) // target
        .mockResolvedValueOnce(adminRequester); // requester (ADMIN, not OWNER)

      await expect(service.removeMember(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('member leaves (self-action, ACTIVE) → LEFT', async () => {
      // Self-action: only findMemberOrThrow is called (no separate requesterMembership query)
      // assertNotSoleAdmin uses findMany; default [] → no throw (user is MEMBER)
      // Transaction select count returns default [{ total: 2 }] → no dissolution
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership);

      await service.removeMember(GROUP_ID, USER_ID, USER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.LEFT }),
      );
    });

    it('member self-withdraws pending REQUEST → DELETE row', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(requestMembership);

      await service.removeMember(GROUP_ID, USER_ID, USER_ID);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockUpdateSet).not.toHaveBeenCalled();
    });

    it('member self-withdraws pending INVITED → DELETE row', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(invitedMembership);

      await service.removeMember(GROUP_ID, USER_ID, USER_ID);

      expect(mockDelete).toHaveBeenCalled();
    });

    it('throws ConflictException when self-action with terminal status (not pending/active)', async () => {
      const leftMembership = makeMembership(USER_ID, GroupMemberStatus.LEFT, GroupRole.MEMBER);
      mockGroupMembersFindFirst.mockResolvedValue(leftMembership);

      await expect(service.removeMember(GROUP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when sole admin tries to leave', async () => {
      const ownerSelf = makeMembership(USER_ID, GroupMemberStatus.ACTIVE, GroupRole.OWNER);
      mockGroupMembersFindFirst.mockResolvedValue(ownerSelf);
      // assertNotSoleAdmin uses findMany; [ownerSelf] → sole admin → throw
      mockGroupMembersFindMany.mockResolvedValueOnce([ownerSelf]);

      await expect(service.removeMember(GROUP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('last member leaves → group is dissolved', async () => {
      // USER_ID is a MEMBER (not admin), sole active member
      const memberSelf = makeMembership(USER_ID, GroupMemberStatus.ACTIVE, GroupRole.MEMBER);
      mockGroupMembersFindFirst.mockResolvedValue(memberSelf);
      // assertNotSoleAdmin: default findMany [] → length 0 → no throw (user is MEMBER)
      // Transaction select count → 0 active members → dissolve
      mockSelectWhere.mockResolvedValueOnce([{ total: 0 }]);

      await service.removeMember(GROUP_ID, USER_ID, USER_ID);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  // ─── updateMemberRole ────────────────────────────────────────────────────────

  describe('updateMemberRole', () => {
    const promoteDto: UpdateMemberRoleDto = { role: GroupRole.ADMIN };
    const demoteDto: UpdateMemberRoleDto = { role: GroupRole.MEMBER };
    const ownerTransferDto: UpdateMemberRoleDto = { role: GroupRole.OWNER };

    it('promotes MEMBER → ADMIN', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership) // requester
        .mockResolvedValueOnce(activeMembership); // target

      await service.updateMemberRole(GROUP_ID, USER_ID, promoteDto, ADMIN_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ role: GroupRole.ADMIN }),
      );
    });

    it('demotes ADMIN → MEMBER when not sole admin', async () => {
      const adminMembership = makeMembership(USER_ID, GroupMemberStatus.ACTIVE, GroupRole.ADMIN);
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership) // requester (OWNER)
        .mockResolvedValueOnce(adminMembership); // target
      // assertNotSoleAdmin uses findMany; 2 admins → not sole → no throw
      mockGroupMembersFindMany.mockResolvedValueOnce([ownerMembership, adminMembership]);

      await service.updateMemberRole(GROUP_ID, USER_ID, demoteDto, ADMIN_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ role: GroupRole.MEMBER }),
      );
    });

    it('throws ConflictException when demoting the sole admin', async () => {
      const adminMembership = makeMembership(USER_ID, GroupMemberStatus.ACTIVE, GroupRole.ADMIN);
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(adminMembership);
      // assertNotSoleAdmin uses findMany; [adminMembership] → sole admin → throw
      mockGroupMembersFindMany.mockResolvedValueOnce([adminMembership]);

      await expect(
        service.updateMemberRole(GROUP_ID, USER_ID, demoteDto, ADMIN_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('OWNER transfer: target → OWNER, caller → ADMIN in transaction', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership) // requester (OWNER)
        .mockResolvedValueOnce(activeMembership); // target (MEMBER, ACTIVE)

      await service.updateMemberRole(GROUP_ID, USER_ID, ownerTransferDto, ADMIN_ID);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      // Two updates inside transaction
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('throws ForbiddenException when non-owner tries to transfer ownership', async () => {
      const adminRequester = makeMembership(ADMIN_ID, GroupMemberStatus.ACTIVE, GroupRole.ADMIN);
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(adminRequester) // requester (ADMIN, not OWNER)
        .mockResolvedValueOnce(activeMembership);

      await expect(
        service.updateMemberRole(GROUP_ID, USER_ID, ownerTransferDto, ADMIN_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when caller is not an admin', async () => {
      mockGroupMembersFindFirst.mockResolvedValueOnce(undefined); // no active admin membership

      await expect(
        service.updateMemberRole(GROUP_ID, USER_ID, promoteDto, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when target is not an active member', async () => {
      mockGroupMembersFindFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(undefined); // target not found

      await expect(
        service.updateMemberRole(GROUP_ID, TARGET_ID, promoteDto, ADMIN_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── listActiveMembers ───────────────────────────────────────────────────────

  describe('listActiveMembers', () => {
    it('throws ForbiddenException when caller is not an active member', async () => {
      // assertActiveMember: group found but no active membership
      mockGroupMembersFindFirst.mockResolvedValue(undefined);

      await expect(service.listActiveMembers(GROUP_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when group not found in assertActiveMember', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      await expect(service.listActiveMembers(GROUP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns empty array when no active members exist', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership); // assertActiveMember passes
      mockGroupMembersFindMany.mockResolvedValue([]); // no members

      const result = await service.listActiveMembers(GROUP_ID, USER_ID);

      expect(result).toEqual([]);
    });

    it('returns mapped MemberResponseDto list with tier', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership); // assertActiveMember
      mockGroupMembersFindMany.mockResolvedValue([activeMembership]);
      mockUsersFindMany.mockResolvedValue([mockUserRow]);
      mockGroupMemberStatsFindMany.mockResolvedValue([
        { userId: USER_ID, tier: GroupMemberTier.NOVICE, joinedAt: NOW },
      ]);

      const result = await service.listActiveMembers(GROUP_ID, USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: USER_ID,
        role: GroupRole.MEMBER,
        tier: GroupMemberTier.NOVICE,
      });
    });

    it('falls back to NEWCOMER tier when no stats record exists', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership);
      mockGroupMembersFindMany.mockResolvedValue([activeMembership]);
      mockUsersFindMany.mockResolvedValue([mockUserRow]);
      mockGroupMemberStatsFindMany.mockResolvedValue([]); // no stats

      const result = await service.listActiveMembers(GROUP_ID, USER_ID);

      expect(result[0]!.tier).toBe(GroupMemberTier.NEWCOMER);
    });

    it('resolves avatar URL when member has an avatar asset', async () => {
      const userWithAvatar = { ...mockUserRow, avatar: 'asset-uuid' };
      const mockAsset = {
        id: 'asset-uuid',
        type: 'image' as const,
        source: 'emoji' as const,
        target: '🧑',
        fileSize: null,
        isPublic: true,
        createdAt: NOW,
      };
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership);
      mockGroupMembersFindMany.mockResolvedValue([activeMembership]);
      mockUsersFindMany.mockResolvedValue([userWithAvatar]);
      mockGroupMemberStatsFindMany.mockResolvedValue([]);
      mockAssetsFindMany.mockResolvedValue([mockAsset]);
      mockAssetResolverResolve.mockResolvedValue({ url: 'https://cdn.example.com/emoji.svg' });

      const result = await service.listActiveMembers(GROUP_ID, USER_ID);

      expect(result[0]!.avatarUrl).toBe('https://cdn.example.com/emoji.svg');
    });

    it('returns null avatarUrl when avatar asset record not found', async () => {
      const userWithAvatar = { ...mockUserRow, avatar: 'missing-asset-uuid' };
      mockGroupMembersFindFirst.mockResolvedValue(activeMembership);
      mockGroupMembersFindMany.mockResolvedValue([activeMembership]);
      mockUsersFindMany.mockResolvedValue([userWithAvatar]);
      mockGroupMemberStatsFindMany.mockResolvedValue([]);
      mockAssetsFindFirst.mockResolvedValue(null); // asset not found

      const result = await service.listActiveMembers(GROUP_ID, USER_ID);

      expect(result[0]!.avatarUrl).toBeNull();
    });
  });

  // ─── listPendingMembers ──────────────────────────────────────────────────────

  describe('listPendingMembers', () => {
    it('throws ForbiddenException when caller is not an admin', async () => {
      // assertGroupAdmin: group found but no admin membership
      mockGroupMembersFindFirst.mockResolvedValue(undefined);

      await expect(service.listPendingMembers(GROUP_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns empty array when no pending members', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(ownerMembership); // admin check
      mockGroupMembersFindMany.mockResolvedValue([]);

      const result = await service.listPendingMembers(GROUP_ID, ADMIN_ID);

      expect(result).toEqual([]);
    });

    it('returns REQUEST and INVITED items as PendingItemResponseDto list', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(ownerMembership); // admin check
      mockGroupMembersFindMany.mockResolvedValue([requestMembership, invitedMembership]);
      mockUsersFindMany.mockResolvedValue([mockUserRow, { ...mockUserRow, id: USER_ID }]);

      const result = await service.listPendingMembers(GROUP_ID, ADMIN_ID);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.status)).toContain(GroupMemberStatus.REQUEST);
      expect(result.map((r) => r.status)).toContain(GroupMemberStatus.INVITED);
    });
  });

  // ─── listMyInvitations ───────────────────────────────────────────────────────

  describe('listMyInvitations', () => {
    const mockGroupRow = {
      id: GROUP_ID,
      name: 'Mountain Crew',
      cover: 'asset-uuid',
      visibility: GroupVisibility.PUBLIC,
      createdBy: ADMIN_ID,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };

    const mockCoverAsset = {
      id: 'asset-uuid',
      type: 'image',
      source: 'emoji',
      target: '⛰️',
      fileSize: null,
      isPublic: true,
      createdAt: NOW,
    };

    const mockResolvedCover = {
      id: 'asset-uuid',
      type: 'image',
      source: 'emoji',
      target: '⛰️',
      url: 'https://cdn.jsdelivr.net/npm/twemoji/2/svg/26f0.svg',
      isPublic: true,
      createdAt: NOW.toISOString(),
    };

    it('returns empty array when user has no pending invitations', async () => {
      mockGroupMembersFindMany.mockResolvedValue([]);

      const result = await service.listMyInvitations(USER_ID);

      expect(result).toEqual([]);
    });

    it('returns invitation with group info and resolved cover', async () => {
      mockGroupMembersFindMany.mockResolvedValue([invitedMembership]);
      mockGroupsFindMany.mockResolvedValue([mockGroupRow]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAsset]);
      mockAssetResolverResolve.mockResolvedValue(mockResolvedCover);

      const result = await service.listMyInvitations(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]?.group.id).toBe(GROUP_ID);
      expect(result[0]?.group.name).toBe('Mountain Crew');
      expect(result[0]?.group.coverUrl).toBe(mockResolvedCover.url);
      expect(result[0]?.initiatedAt).toBe(NOW.toISOString());
    });

    it('returns empty when groups query yields no results (simulates soft-delete filter)', async () => {
      // NOTE: the mock bypasses Drizzle's WHERE clause, so this test verifies behaviour
      // (invitation omitted when its group is absent from the result set) rather than
      // the isNull(deletedAt) predicate itself. The predicate is covered by integration tests.
      mockGroupMembersFindMany.mockResolvedValue([invitedMembership]);
      mockGroupsFindMany.mockResolvedValue([]);
      mockAssetsFindMany.mockResolvedValue([]);

      const result = await service.listMyInvitations(USER_ID);

      expect(result).toEqual([]);
    });
  });
});
