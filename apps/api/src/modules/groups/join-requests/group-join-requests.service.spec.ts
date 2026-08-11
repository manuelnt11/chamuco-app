import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  GroupMemberStatus,
  GroupRole,
  NotificationChannel,
  NotificationType,
  GroupVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { GroupJoinRequestsService } from './group-join-requests.service';
import { GroupMembersService } from '@/modules/groups/members/group-members.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';

const GROUP_ID = 'group-uuid';
const ADMIN_ID = 'admin-uuid';
const USER_ID = 'user-uuid';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockPublicGroup = {
  id: GROUP_ID,
  name: 'Mountain Crew',
  visibility: GroupVisibility.PUBLIC,
  deletedAt: null,
};

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

const activeMembership = makeMembership(USER_ID, GroupMemberStatus.ACTIVE);
const requestMembership = makeMembership(USER_ID, GroupMemberStatus.REQUEST);
const invitedMembership = makeMembership(USER_ID, GroupMemberStatus.INVITED);
const rejectedMembership = makeMembership(USER_ID, GroupMemberStatus.REJECTED);
const removedMembership = makeMembership(USER_ID, GroupMemberStatus.REMOVED);

describe('GroupJoinRequestsService', () => {
  let service: GroupJoinRequestsService;

  let mockGroupMembersFindFirst: jest.Mock;
  let mockGroupMembersFindMany: jest.Mock;
  let mockGroupsFindMany: jest.Mock;
  let mockAssetResolverResolve: jest.Mock;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDeleteReturning: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;
  let mockInsertOnConflict: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;
  let mockTransaction: jest.Mock;
  let mockGroupsFindFirst: jest.Mock;
  let mockNotificationsNotify: jest.Mock;
  let mockAssertGroupExists: jest.Mock;
  let mockAssertGroupAdmin: jest.Mock;
  let mockFindMemberOrThrow: jest.Mock;

  beforeEach(async () => {
    mockGroupMembersFindFirst = jest.fn().mockResolvedValue(undefined);
    mockGroupMembersFindMany = jest.fn().mockResolvedValue([]);
    mockGroupsFindFirst = jest.fn().mockResolvedValue({ name: 'Mountain Crew' });
    mockGroupsFindMany = jest.fn().mockResolvedValue([]);
    mockAssetResolverResolve = jest.fn().mockResolvedValue(null);

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteReturning = jest.fn().mockResolvedValue([{ groupId: GROUP_ID, userId: USER_ID }]);
    mockDeleteWhere = jest.fn().mockReturnValue({ returning: mockDeleteReturning });
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertOnConflict = jest.fn().mockResolvedValue(undefined);
    mockInsertValues = jest.fn().mockReturnValue({ onConflictDoNothing: mockInsertOnConflict });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    mockTransaction = jest
      .fn()
      .mockImplementation(async (callback) => callback({ update: mockUpdate, insert: mockInsert }));

    mockNotificationsNotify = jest.fn().mockResolvedValue(undefined);
    mockAssertGroupExists = jest.fn().mockResolvedValue(mockPublicGroup);
    mockAssertGroupAdmin = jest.fn().mockResolvedValue(undefined);
    mockFindMemberOrThrow = jest.fn().mockResolvedValue(requestMembership);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupJoinRequestsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              groupMembers: {
                findFirst: mockGroupMembersFindFirst,
                findMany: mockGroupMembersFindMany,
              },
              groups: { findFirst: mockGroupsFindFirst, findMany: mockGroupsFindMany },
            },
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            transaction: mockTransaction,
          },
        },
        {
          provide: GroupMembersService,
          useValue: {
            assertGroupExists: mockAssertGroupExists,
            assertGroupAdmin: mockAssertGroupAdmin,
            findMemberOrThrow: mockFindMemberOrThrow,
          },
        },
        {
          provide: NotificationsService,
          useValue: { notify: mockNotificationsNotify },
        },
        {
          provide: AssetResolverService,
          useValue: { resolve: mockAssetResolverResolve },
        },
      ],
    }).compile();

    service = module.get<GroupJoinRequestsService>(GroupJoinRequestsService);
  });

  // ─── submitJoinRequest ───────────────────────────────────────────────────────

  describe('submitJoinRequest', () => {
    it('inserts new membership when no existing record', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(undefined);

      await service.submitJoinRequest(GROUP_ID, USER_ID);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.REQUEST, role: GroupRole.MEMBER }),
      );
    });

    it('throws NotFoundException when group not found', async () => {
      mockAssertGroupExists.mockRejectedValue(new NotFoundException('Group not found'));

      await expect(service.submitJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException for private groups', async () => {
      mockAssertGroupExists.mockResolvedValue({ ...mockPublicGroup, visibility: 'PRIVATE' });

      await expect(service.submitJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(ConflictException);
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
      mockFindMemberOrThrow.mockResolvedValue(requestMembership);

      await service.acceptJoinRequest(GROUP_ID, USER_ID, ADMIN_ID);

      expect(mockAssertGroupAdmin).toHaveBeenCalledWith(GROUP_ID, ADMIN_ID);
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
      mockFindMemberOrThrow.mockResolvedValue(requestMembership);
      mockNotificationsNotify.mockRejectedValueOnce(new Error('DB blip'));
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

      await expect(service.acceptJoinRequest(GROUP_ID, USER_ID, ADMIN_ID)).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalledWith(
        'Failed to send GROUP_JOIN_ACCEPTED notification',
        expect.any(Error),
      );
    });

    it('throws ForbiddenException when caller is not an admin', async () => {
      mockAssertGroupAdmin.mockRejectedValue(new ForbiddenException());

      await expect(service.acceptJoinRequest(GROUP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when target has no membership record', async () => {
      mockFindMemberOrThrow.mockRejectedValue(new NotFoundException('Membership record not found'));

      await expect(service.acceptJoinRequest(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when target status is not REQUEST', async () => {
      mockFindMemberOrThrow.mockResolvedValue(invitedMembership);

      await expect(service.acceptJoinRequest(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── rejectJoinRequest ───────────────────────────────────────────────────────

  describe('rejectJoinRequest', () => {
    it('transitions REQUEST → REJECTED', async () => {
      mockFindMemberOrThrow.mockResolvedValue(requestMembership);

      await service.rejectJoinRequest(GROUP_ID, USER_ID, ADMIN_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.REJECTED }),
      );
    });

    it('throws ConflictException when target is not in REQUEST state', async () => {
      mockFindMemberOrThrow.mockResolvedValue(activeMembership);

      await expect(service.rejectJoinRequest(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ForbiddenException when caller is not an admin', async () => {
      mockAssertGroupAdmin.mockRejectedValue(new ForbiddenException());

      await expect(service.rejectJoinRequest(GROUP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── withdrawJoinRequest ─────────────────────────────────────────────────────

  describe('withdrawJoinRequest', () => {
    it('deletes the REQUEST row', async () => {
      mockFindMemberOrThrow.mockResolvedValue(requestMembership);

      await service.withdrawJoinRequest(GROUP_ID, USER_ID);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
      expect(mockDeleteReturning).toHaveBeenCalled();
    });

    it('throws ConflictException when no REQUEST exists', async () => {
      mockFindMemberOrThrow.mockResolvedValue(activeMembership);
      mockDeleteReturning.mockResolvedValueOnce([]);

      await expect(service.withdrawJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when the request was accepted concurrently (delete matches zero rows)', async () => {
      // findMemberOrThrow still sees REQUEST (read before the race), but the atomic
      // delete's status filter matches nothing because acceptJoinRequest committed first.
      mockFindMemberOrThrow.mockResolvedValue(requestMembership);
      mockDeleteReturning.mockResolvedValueOnce([]);

      await expect(service.withdrawJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDelete).toHaveBeenCalled();
    });

    it('throws NotFoundException when membership not found', async () => {
      mockFindMemberOrThrow.mockRejectedValue(new NotFoundException('Membership record not found'));

      await expect(service.withdrawJoinRequest(GROUP_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── listMyPendingRequests ───────────────────────────────────────────────────

  describe('listMyPendingRequests', () => {
    const mockCoverAsset = { id: 'asset-uuid', createdAt: NOW };
    const mockGroupRow = {
      id: GROUP_ID,
      name: 'Mountain Crew',
      visibility: GroupVisibility.PUBLIC,
      deletedAt: null,
      cover: 'asset-uuid',
      coverAsset: mockCoverAsset,
    };

    it('returns empty array when user has no pending requests', async () => {
      mockGroupMembersFindMany.mockResolvedValueOnce([]);

      const result = await service.listMyPendingRequests(USER_ID);

      expect(result).toEqual([]);
      expect(mockGroupsFindMany).not.toHaveBeenCalled();
    });

    it('returns empty array when the pending group no longer exists', async () => {
      mockGroupMembersFindMany.mockResolvedValueOnce([
        { groupId: GROUP_ID, userId: USER_ID, initiatedAt: NOW },
      ]);
      mockGroupsFindMany.mockResolvedValueOnce([]);

      const result = await service.listMyPendingRequests(USER_ID);

      expect(result).toEqual([]);
    });

    it('returns mapped pending requests with resolved coverUrl', async () => {
      mockGroupMembersFindMany.mockResolvedValueOnce([
        { groupId: GROUP_ID, userId: USER_ID, initiatedAt: NOW },
      ]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow]);
      mockAssetResolverResolve.mockResolvedValueOnce({ url: 'https://example.com/cover.jpg' });

      const result = await service.listMyPendingRequests(USER_ID);

      expect(result).toEqual([
        {
          groupId: GROUP_ID,
          name: 'Mountain Crew',
          coverUrl: 'https://example.com/cover.jpg',
          visibility: GroupVisibility.PUBLIC,
          initiatedAt: NOW.toISOString(),
        },
      ]);
    });

    it('returns null coverUrl when the group has no cover asset', async () => {
      mockGroupMembersFindMany.mockResolvedValueOnce([
        { groupId: GROUP_ID, userId: USER_ID, initiatedAt: NOW },
      ]);
      mockGroupsFindMany.mockResolvedValueOnce([
        { ...mockGroupRow, cover: null, coverAsset: null },
      ]);

      const result = await service.listMyPendingRequests(USER_ID);

      expect(result[0]!.coverUrl).toBeNull();
      expect(mockAssetResolverResolve).not.toHaveBeenCalled();
    });

    it('returns null coverUrl when the cover asset fails to resolve', async () => {
      mockGroupMembersFindMany.mockResolvedValueOnce([
        { groupId: GROUP_ID, userId: USER_ID, initiatedAt: NOW },
      ]);
      mockGroupsFindMany.mockResolvedValueOnce([mockGroupRow]);
      mockAssetResolverResolve.mockResolvedValueOnce(null);

      const result = await service.listMyPendingRequests(USER_ID);

      expect(result[0]!.coverUrl).toBeNull();
    });
  });
});
