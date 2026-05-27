import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GroupMemberStatus,
  GroupRole,
  GroupVisibility,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { GroupAnnouncementsService } from './group-announcements.service';
import type { CreateAnnouncementDto } from './dto/create-announcement.dto';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const NOW = new Date('2026-01-01T00:00:00.000Z');
const GROUP_ID = 'group-uuid';
const ADMIN_ID = 'admin-uuid';
const ADMIN_USERNAME = 'admin-user';
const MEMBER_ID = 'member-uuid';
const ANNOUNCEMENT_ID = 'announcement-uuid';

const mockGroup = {
  id: GROUP_ID,
  name: 'Mountain Crew',
  description: null,
  cover: null,
  visibility: GroupVisibility.PUBLIC,
  createdBy: ADMIN_ID,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

const mockAnnouncement = {
  id: ANNOUNCEMENT_ID,
  groupId: GROUP_ID,
  createdByUsername: ADMIN_USERNAME,
  content: 'Trip departs Sunday at 6am.',
  createdAt: NOW,
};

const makeMembership = (userId: string, role: GroupRole) => ({
  groupId: GROUP_ID,
  userId,
  status: GroupMemberStatus.ACTIVE,
  role,
  initiatedAt: NOW,
  respondedAt: NOW,
  initiatedBy: ADMIN_ID,
  decidedBy: ADMIN_ID,
});

// Builds a thenable chain: every step returns the same chain object.
// `await chain` resolves to `resolveWith`.
function makeChain<T>(resolveWith: T) {
  const chain = {
    from: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    then(
      onFulfilled?: (value: T) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ): Promise<unknown> {
      return Promise.resolve(resolveWith).then(onFulfilled, onRejected);
    },
  };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.offset.mockReturnValue(chain);
  return chain;
}

describe('GroupAnnouncementsService', () => {
  let service: GroupAnnouncementsService;

  let mockGroupsFindFirst: jest.Mock;
  let mockGroupMembersFindFirst: jest.Mock;

  let mockInsertReturning: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;

  let mockSelect: jest.Mock;

  let mockNotificationsNotifyMany: jest.Mock;

  beforeEach(async () => {
    mockGroupsFindFirst = jest.fn().mockResolvedValue(mockGroup);
    mockGroupMembersFindFirst = jest
      .fn()
      .mockResolvedValue(makeMembership(ADMIN_ID, GroupRole.OWNER));

    mockInsertReturning = jest.fn().mockResolvedValue([mockAnnouncement]);
    mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    // Default: returns one active member
    mockSelect = jest.fn().mockReturnValue(makeChain([{ userId: MEMBER_ID }]));

    mockNotificationsNotifyMany = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupAnnouncementsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              groups: { findFirst: mockGroupsFindFirst },
              groupMembers: { findFirst: mockGroupMembersFindFirst },
            },
            insert: mockInsert,
            select: mockSelect,
          },
        },
        {
          provide: NotificationsService,
          useValue: { notifyMany: mockNotificationsNotifyMany },
        },
      ],
    }).compile();

    service = module.get<GroupAnnouncementsService>(GroupAnnouncementsService);
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateAnnouncementDto = { content: 'Trip departs Sunday at 6am.' };

    it('inserts announcement and returns DTO', async () => {
      const result = await service.create(GROUP_ID, ADMIN_ID, ADMIN_USERNAME, dto);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: GROUP_ID, createdBy: ADMIN_ID, content: dto.content }),
      );
      expect(result.id).toBe(ANNOUNCEMENT_ID);
      expect(result.content).toBe(dto.content);
      expect(result.createdByUsername).toBe(ADMIN_USERNAME);
    });

    it('calls notifyMany with all active member IDs', async () => {
      mockSelect.mockReturnValue(makeChain([{ userId: MEMBER_ID }, { userId: ADMIN_ID }]));

      await service.create(GROUP_ID, ADMIN_ID, ADMIN_USERNAME, dto);

      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        [MEMBER_ID, ADMIN_ID],
        NotificationType.GROUP_ANNOUNCEMENT,
        expect.objectContaining({ groupId: GROUP_ID }),
        [NotificationChannel.PUSH],
      );
    });

    it('does not throw when notifyMany rejects', async () => {
      mockNotificationsNotifyMany.mockRejectedValue(new Error('FCM down'));

      await expect(service.create(GROUP_ID, ADMIN_ID, ADMIN_USERNAME, dto)).resolves.toBeDefined();
    });

    it('throws NotFoundException when group not found', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      await expect(service.create(GROUP_ID, ADMIN_ID, ADMIN_USERNAME, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when caller is not admin', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(undefined);

      await expect(service.create(GROUP_ID, MEMBER_ID, ADMIN_USERNAME, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when caller is a regular member', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(makeMembership(MEMBER_ID, GroupRole.MEMBER));

      // Drizzle query mock doesn't check the inArray condition — simulate by returning undefined
      mockGroupMembersFindFirst.mockResolvedValue(undefined);

      await expect(service.create(GROUP_ID, MEMBER_ID, ADMIN_USERNAME, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated announcements and total', async () => {
      const itemsChain = makeChain([mockAnnouncement]);
      const countChain = makeChain([{ value: 1 }]);
      mockSelect.mockReturnValueOnce(itemsChain).mockReturnValueOnce(countChain);
      // assertActiveMember uses query.groupMembers.findFirst — already set up
      mockGroupMembersFindFirst.mockResolvedValue(makeMembership(MEMBER_ID, GroupRole.MEMBER));

      const result = await service.findAll(GROUP_ID, MEMBER_ID, { limit: 20, offset: 0 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe(ANNOUNCEMENT_ID);
      expect(result.total).toBe(1);
    });

    it('passes limit and offset to the query', async () => {
      const itemsChain = makeChain([]);
      const countChain = makeChain([{ value: 0 }]);
      mockSelect.mockReturnValueOnce(itemsChain).mockReturnValueOnce(countChain);
      mockGroupMembersFindFirst.mockResolvedValue(makeMembership(MEMBER_ID, GroupRole.MEMBER));

      await service.findAll(GROUP_ID, MEMBER_ID, { limit: 5, offset: 10 });

      expect(itemsChain.limit).toHaveBeenCalledWith(5);
      expect(itemsChain.offset).toHaveBeenCalledWith(10);
    });

    it('uses defaults when limit/offset are undefined', async () => {
      const itemsChain = makeChain([]);
      const countChain = makeChain([{ value: 0 }]);
      mockSelect.mockReturnValueOnce(itemsChain).mockReturnValueOnce(countChain);
      mockGroupMembersFindFirst.mockResolvedValue(makeMembership(MEMBER_ID, GroupRole.MEMBER));

      await service.findAll(GROUP_ID, MEMBER_ID, {});

      expect(itemsChain.limit).toHaveBeenCalledWith(20);
      expect(itemsChain.offset).toHaveBeenCalledWith(0);
    });

    it('throws NotFoundException when group not found', async () => {
      mockGroupsFindFirst.mockResolvedValue(undefined);

      await expect(service.findAll(GROUP_ID, MEMBER_ID, {})).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller is not an active member', async () => {
      mockGroupMembersFindFirst.mockResolvedValue(undefined);

      await expect(service.findAll(GROUP_ID, MEMBER_ID, {})).rejects.toThrow(ForbiddenException);
    });
  });
});
