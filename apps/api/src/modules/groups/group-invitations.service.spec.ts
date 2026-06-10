import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));
import {
  GroupMemberStatus,
  GroupRole,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { GroupInvitationsService } from './group-invitations.service';
import { GroupMembersService } from './group-members.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';

const GROUP_ID = 'group-uuid';
const ADMIN_ID = 'admin-uuid';
const USER_ID = 'user-uuid';
const TARGET_ID = 'target-uuid';
const NOW = new Date('2026-01-01T00:00:00.000Z');

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

const mockTargetUser = {
  id: TARGET_ID,
  username: 'target_user',
  displayName: 'Target User',
  avatar: null,
};
const mockUserRow = { id: USER_ID, username: 'user', displayName: 'User', avatar: null };

describe('GroupInvitationsService', () => {
  let service: GroupInvitationsService;

  let mockGroupsFindFirst: jest.Mock;
  let mockGroupMembersFindMany: jest.Mock;
  let mockUsersFindMany: jest.Mock;
  let mockUsersFindFirst: jest.Mock;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;
  let mockInsertOnConflict: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;
  let mockTransaction: jest.Mock;
  let mockNotificationsNotifyMany: jest.Mock;
  let mockAssertGroupAdmin: jest.Mock;
  let mockFindMemberOrThrow: jest.Mock;

  beforeEach(async () => {
    mockGroupsFindFirst = jest.fn().mockResolvedValue({ name: 'Mountain Crew' });
    mockGroupMembersFindMany = jest.fn().mockResolvedValue([]);
    mockUsersFindMany = jest.fn().mockResolvedValue([]);
    mockUsersFindFirst = jest.fn().mockResolvedValue(mockUserRow);

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertOnConflict = jest.fn().mockResolvedValue(undefined);
    mockInsertValues = jest.fn().mockReturnValue({ onConflictDoNothing: mockInsertOnConflict });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    mockTransaction = jest
      .fn()
      .mockImplementation(async (callback) => callback({ update: mockUpdate, insert: mockInsert }));

    mockNotificationsNotifyMany = jest.fn().mockResolvedValue(undefined);
    mockAssertGroupAdmin = jest.fn().mockResolvedValue(undefined);
    mockFindMemberOrThrow = jest.fn().mockResolvedValue(invitedMembership);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupInvitationsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              groups: { findFirst: mockGroupsFindFirst },
              groupMembers: { findFirst: jest.fn(), findMany: mockGroupMembersFindMany },
              users: { findFirst: mockUsersFindFirst, findMany: mockUsersFindMany },
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
            assertGroupAdmin: mockAssertGroupAdmin,
            findMemberOrThrow: mockFindMemberOrThrow,
          },
        },
        {
          provide: NotificationsService,
          useValue: { notifyMany: mockNotificationsNotifyMany },
        },
      ],
    }).compile();

    service = module.get<GroupInvitationsService>(GroupInvitationsService);
  });

  // ─── sendInvitations ─────────────────────────────────────────────────────────

  describe('sendInvitations', () => {
    const dto: CreateInvitationDto = { usernames: ['target_user'] };

    it('inserts new INVITED membership and returns INVITED status', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([]);

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
      mockAssertGroupAdmin.mockRejectedValue(new ForbiddenException());

      await expect(service.sendInvitations(GROUP_ID, dto, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns NOT_FOUND when target user does not exist', async () => {
      mockUsersFindMany.mockResolvedValueOnce([]);
      mockGroupMembersFindMany.mockResolvedValueOnce([]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(result).toEqual({ results: [{ username: 'target_user', status: 'NOT_FOUND' }] });
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('returns ALREADY_MEMBER when target is already ACTIVE', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([
        makeMembership(TARGET_ID, GroupMemberStatus.ACTIVE),
      ]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(result).toEqual({ results: [{ username: 'target_user', status: 'ALREADY_MEMBER' }] });
      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('returns ALREADY_INVITED when target already has INVITED status', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([
        makeMembership(TARGET_ID, GroupMemberStatus.INVITED),
      ]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(result).toEqual({ results: [{ username: 'target_user', status: 'ALREADY_INVITED' }] });
      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('returns HAS_PENDING_REQUEST when target has a pending join request', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([
        makeMembership(TARGET_ID, GroupMemberStatus.REQUEST),
      ]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(result).toEqual({
        results: [{ username: 'target_user', status: 'HAS_PENDING_REQUEST' }],
      });
      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('re-invites after REJECTED, resets role to MEMBER, returns INVITED', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockGroupMembersFindMany.mockResolvedValueOnce([
        makeMembership(TARGET_ID, GroupMemberStatus.REJECTED, GroupRole.ADMIN),
      ]);

      const result = await service.sendInvitations(GROUP_ID, dto, ADMIN_ID);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.INVITED, role: GroupRole.MEMBER }),
      );
      expect(mockInsert).not.toHaveBeenCalled();
      expect(result).toEqual({ results: [{ username: 'target_user', status: 'INVITED' }] });
    });

    it('logs error and resolves when notifyMany() rejects', async () => {
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
      mockFindMemberOrThrow.mockResolvedValue(invitedMembership);
      mockGroupMembersFindMany.mockResolvedValue([{ userId: ADMIN_ID }]);
      mockUsersFindFirst.mockResolvedValue(mockUserRow);

      await service.acceptInvitation(GROUP_ID, USER_ID);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.ACTIVE }),
      );
      expect(mockInsertOnConflict).toHaveBeenCalledTimes(1);
      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        [ADMIN_ID],
        NotificationType.GROUP_INVITATION_ACCEPTED,
        expect.objectContaining({ groupId: GROUP_ID, username: mockUserRow.username }),
        [NotificationChannel.PUSH],
      );
    });

    it('does not throw when notifyMany fails', async () => {
      mockFindMemberOrThrow.mockResolvedValue(invitedMembership);
      mockGroupMembersFindMany.mockResolvedValue([{ userId: ADMIN_ID }]);
      mockUsersFindFirst.mockResolvedValue(mockUserRow);
      mockNotificationsNotifyMany.mockRejectedValue(new Error('FCM error'));

      await expect(service.acceptInvitation(GROUP_ID, USER_ID)).resolves.toBeUndefined();
    });

    it('skips notification when no active admins exist', async () => {
      mockFindMemberOrThrow.mockResolvedValue(invitedMembership);
      mockGroupMembersFindMany.mockResolvedValue([]);

      await service.acceptInvitation(GROUP_ID, USER_ID);

      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('throws ConflictException when no INVITED record exists', async () => {
      mockFindMemberOrThrow.mockResolvedValue(requestMembership);

      await expect(service.acceptInvitation(GROUP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when membership not found', async () => {
      mockFindMemberOrThrow.mockRejectedValue(new NotFoundException('Membership record not found'));

      await expect(service.acceptInvitation(GROUP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── declineInvitation ───────────────────────────────────────────────────────

  describe('declineInvitation', () => {
    it('transitions INVITED → REJECTED', async () => {
      mockFindMemberOrThrow.mockResolvedValue(invitedMembership);

      await service.declineInvitation(GROUP_ID, USER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.REJECTED }),
      );
    });

    it('throws ConflictException when no INVITED record exists', async () => {
      mockFindMemberOrThrow.mockResolvedValue(activeMembership);

      await expect(service.declineInvitation(GROUP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when membership not found', async () => {
      mockFindMemberOrThrow.mockRejectedValue(new NotFoundException('Membership record not found'));

      await expect(service.declineInvitation(GROUP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── revokeInvitation ────────────────────────────────────────────────────────

  describe('revokeInvitation', () => {
    it('deletes the INVITED row', async () => {
      mockFindMemberOrThrow.mockResolvedValue(invitedMembership);

      await service.revokeInvitation(GROUP_ID, USER_ID, ADMIN_ID);

      expect(mockAssertGroupAdmin).toHaveBeenCalledWith(GROUP_ID, ADMIN_ID);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('throws ForbiddenException when caller is not an admin', async () => {
      mockAssertGroupAdmin.mockRejectedValue(new ForbiddenException());

      await expect(service.revokeInvitation(GROUP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException when target is not INVITED', async () => {
      mockFindMemberOrThrow.mockResolvedValue(activeMembership);

      await expect(service.revokeInvitation(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException when membership not found', async () => {
      mockFindMemberOrThrow.mockRejectedValue(new NotFoundException('Membership record not found'));

      await expect(service.revokeInvitation(GROUP_ID, USER_ID, ADMIN_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
