import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryStatus, NotificationChannel, NotificationType } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { I18nService } from '@/i18n/i18n.service';
import { NotificationsService } from './notifications.service';
import { PUSH_STRATEGY, EMAIL_STRATEGY, SMS_STRATEGY } from './notifications.constants';
import type { NotificationChannelStrategy } from './channel-strategies/notification-channel.strategy';

const FAKE_NOTIFICATION = {
  id: 'notif-1',
  userId: 'user-1',
  type: NotificationType.PASSPORT_EXPIRING_SOON,
  data: { countryCode: 'MX' },
  readAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const makeInsert = (returning: object[]) => ({
  values: jest.fn().mockReturnValue({
    returning: jest.fn().mockResolvedValue(returning),
  }),
});

const makeInsertNoReturn = () => ({
  values: jest.fn().mockResolvedValue(undefined),
});

const makeUpdate = () => ({
  set: jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(undefined),
  }),
});

const makeSelect = (rows: object[]) => ({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(rows),
      }),
    }),
  }),
});

// Enrichment queries use select({cols}).from().where() — no orderBy/limit, resolves directly
const makeEnrichSelect = (rows: object[]) => ({
  from: jest.fn().mockReturnValue({
    innerJoin: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(rows),
    }),
    where: jest.fn().mockResolvedValue(rows),
  }),
});

const makeStrategyMock = (): jest.Mocked<NotificationChannelStrategy> => ({
  send: jest.fn().mockResolvedValue(undefined),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let pushStrategy: jest.Mocked<NotificationChannelStrategy>;
  let emailStrategy: jest.Mocked<NotificationChannelStrategy>;
  let smsStrategy: jest.Mocked<NotificationChannelStrategy>;
  let i18n: jest.Mocked<Pick<I18nService, 'translate'>>;

  let db: {
    insert: jest.Mock;
    update: jest.Mock;
    select: jest.Mock;
    delete: jest.Mock;
    query: {
      userPreferences: {
        findMany: jest.Mock;
      };
    };
  };

  beforeEach(async () => {
    pushStrategy = makeStrategyMock();
    emailStrategy = makeStrategyMock();
    smsStrategy = makeStrategyMock();

    // Returns the key as-is so assertions don't depend on translation output
    i18n = { translate: jest.fn().mockImplementation((key: string) => key) };

    db = {
      insert: jest.fn(),
      update: jest.fn(),
      select: jest.fn(),
      delete: jest.fn(),
      query: {
        userPreferences: {
          // Default: no prefs stored — all channels enabled
          findMany: jest.fn().mockResolvedValue([]),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DRIZZLE_CLIENT, useValue: db },
        { provide: I18nService, useValue: i18n },
        { provide: PUSH_STRATEGY, useValue: pushStrategy },
        { provide: EMAIL_STRATEGY, useValue: emailStrategy },
        { provide: SMS_STRATEGY, useValue: smsStrategy },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('notify()', () => {
    it('inserts a notifications row and skips deliveries when channels is empty', async () => {
      db.insert.mockReturnValue(makeInsert([FAKE_NOTIFICATION]));

      await service.notify(
        'user-1',
        NotificationType.PASSPORT_EXPIRING_SOON,
        { countryCode: 'MX' },
        [],
      );

      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(pushStrategy.send).not.toHaveBeenCalled();
      expect(emailStrategy.send).not.toHaveBeenCalled();
      expect(smsStrategy.send).not.toHaveBeenCalled();
    });

    it('inserts delivery rows and calls strategies for each channel', async () => {
      db.insert
        .mockReturnValueOnce(makeInsert([FAKE_NOTIFICATION]))
        .mockReturnValueOnce(makeInsertNoReturn());

      await service.notify(
        'user-1',
        NotificationType.PASSPORT_EXPIRING_SOON,
        { countryCode: 'MX' },
        [NotificationChannel.PUSH, NotificationChannel.EMAIL],
      );

      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(pushStrategy.send).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'notif-1', userId: 'user-1' }),
        { countryCode: 'MX' },
      );
      expect(emailStrategy.send).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'notif-1', userId: 'user-1' }),
        { countryCode: 'MX' },
      );
      expect(smsStrategy.send).not.toHaveBeenCalled();
    });

    it('does not rethrow when a strategy send() rejects', async () => {
      db.insert
        .mockReturnValueOnce(makeInsert([FAKE_NOTIFICATION]))
        .mockReturnValueOnce(makeInsertNoReturn());
      pushStrategy.send.mockRejectedValue(new Error('FCM unavailable'));

      await expect(
        service.notify('user-1', NotificationType.PASSPORT_EXPIRING_SOON, { countryCode: 'MX' }, [
          NotificationChannel.PUSH,
        ]),
      ).resolves.toBeUndefined();
    });

    describe('preference filtering', () => {
      it('passes all channels through when user has no prefs for the type', async () => {
        db.insert
          .mockReturnValueOnce(makeInsert([FAKE_NOTIFICATION]))
          .mockReturnValueOnce(makeInsertNoReturn());

        await service.notify(
          'user-1',
          NotificationType.PASSPORT_EXPIRING_SOON,
          { countryCode: 'MX' },
          [NotificationChannel.PUSH],
        );

        expect(pushStrategy.send).toHaveBeenCalledTimes(1);
      });

      it('suppresses a disabled channel but still creates the notification row', async () => {
        db.query.userPreferences.findMany.mockResolvedValueOnce([
          {
            userId: 'user-1',
            notificationOptOuts: {
              [NotificationType.PASSPORT_EXPIRING_SOON]: [NotificationChannel.PUSH],
            },
          },
        ]);
        db.insert.mockReturnValueOnce(makeInsert([FAKE_NOTIFICATION]));

        await service.notify(
          'user-1',
          NotificationType.PASSPORT_EXPIRING_SOON,
          { countryCode: 'MX' },
          [NotificationChannel.PUSH],
        );

        // notification row inserted; no delivery rows (all channels suppressed)
        expect(db.insert).toHaveBeenCalledTimes(1);
        expect(pushStrategy.send).not.toHaveBeenCalled();
      });

      it('only dispatches channels not in the disabled list', async () => {
        db.query.userPreferences.findMany.mockResolvedValueOnce([
          {
            userId: 'user-1',
            notificationOptOuts: {
              [NotificationType.PASSPORT_EXPIRING_SOON]: [NotificationChannel.EMAIL],
            },
          },
        ]);
        db.insert
          .mockReturnValueOnce(makeInsert([FAKE_NOTIFICATION]))
          .mockReturnValueOnce(makeInsertNoReturn());

        await service.notify(
          'user-1',
          NotificationType.PASSPORT_EXPIRING_SOON,
          { countryCode: 'MX' },
          [NotificationChannel.PUSH, NotificationChannel.EMAIL],
        );

        expect(pushStrategy.send).toHaveBeenCalledTimes(1);
        expect(emailStrategy.send).not.toHaveBeenCalled();
      });

      it('skips prefs lookup and dispatch when caller passes no channels', async () => {
        db.insert.mockReturnValueOnce(makeInsert([FAKE_NOTIFICATION]));

        await service.notify(
          'user-1',
          NotificationType.PASSPORT_EXPIRING_SOON,
          { countryCode: 'MX' },
          [],
        );

        expect(db.insert).toHaveBeenCalledTimes(1);
        expect(db.query.userPreferences.findMany).not.toHaveBeenCalled();
        expect(pushStrategy.send).not.toHaveBeenCalled();
      });

      it('does not suppress channels for a different notification type', async () => {
        db.query.userPreferences.findMany.mockResolvedValueOnce([
          {
            userId: 'user-1',
            notificationOptOuts: {
              // PUSH disabled only for GROUP_ANNOUNCEMENT, not PASSPORT_EXPIRING_SOON
              [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH],
            },
          },
        ]);
        db.insert
          .mockReturnValueOnce(makeInsert([FAKE_NOTIFICATION]))
          .mockReturnValueOnce(makeInsertNoReturn());

        await service.notify(
          'user-1',
          NotificationType.PASSPORT_EXPIRING_SOON,
          { countryCode: 'MX' },
          [NotificationChannel.PUSH],
        );

        expect(pushStrategy.send).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('notifyMany()', () => {
    it('returns early when userIds is empty', async () => {
      await service.notifyMany([], NotificationType.GROUP_ANNOUNCEMENT, {}, []);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('batch-inserts one notifications row per userId', async () => {
      const rows = [
        { ...FAKE_NOTIFICATION, id: 'notif-1', userId: 'user-1' },
        { ...FAKE_NOTIFICATION, id: 'notif-2', userId: 'user-2' },
      ];
      db.insert.mockReturnValue(makeInsert(rows));

      await service.notifyMany(['user-1', 'user-2'], NotificationType.GROUP_ANNOUNCEMENT, {}, []);

      const valuesFn = db.insert.mock.results[0]!.value.values as jest.Mock;
      const insertedValues = valuesFn.mock.calls[0]![0] as { userId: string }[];
      expect(insertedValues).toHaveLength(2);
      expect(insertedValues.map((v) => v.userId)).toEqual(['user-1', 'user-2']);
    });

    it('inserts delivery rows for each (notification, channel) pair', async () => {
      const rows = [
        { ...FAKE_NOTIFICATION, id: 'notif-1', userId: 'user-1' },
        { ...FAKE_NOTIFICATION, id: 'notif-2', userId: 'user-2' },
      ];
      db.insert.mockReturnValueOnce(makeInsert(rows)).mockReturnValueOnce(makeInsertNoReturn());

      await service.notifyMany(['user-1', 'user-2'], NotificationType.GROUP_ANNOUNCEMENT, {}, [
        NotificationChannel.PUSH,
      ]);

      expect(db.insert).toHaveBeenCalledTimes(2);
      const deliveryValuesFn = db.insert.mock.results[1]!.value.values as jest.Mock;
      const deliveryRows = deliveryValuesFn.mock.calls[0]![0] as {
        notificationId: string;
        channel: string;
        status: string;
      }[];
      expect(deliveryRows).toHaveLength(2);
      expect(deliveryRows[0]).toMatchObject({
        notificationId: 'notif-1',
        channel: NotificationChannel.PUSH,
        status: DeliveryStatus.PENDING,
      });
    });

    it('calls strategy for each inserted notification', async () => {
      const rows = [
        { ...FAKE_NOTIFICATION, id: 'notif-1', userId: 'user-1' },
        { ...FAKE_NOTIFICATION, id: 'notif-2', userId: 'user-2' },
      ];
      db.insert.mockReturnValueOnce(makeInsert(rows)).mockReturnValueOnce(makeInsertNoReturn());

      await service.notifyMany(['user-1', 'user-2'], NotificationType.GROUP_ANNOUNCEMENT, {}, [
        NotificationChannel.PUSH,
      ]);

      expect(pushStrategy.send).toHaveBeenCalledTimes(2);
    });

    describe('preference filtering', () => {
      it('dispatches only to users who have not disabled the channel', async () => {
        const rows = [
          {
            ...FAKE_NOTIFICATION,
            id: 'notif-1',
            userId: 'user-1',
            type: NotificationType.GROUP_ANNOUNCEMENT,
          },
          {
            ...FAKE_NOTIFICATION,
            id: 'notif-2',
            userId: 'user-2',
            type: NotificationType.GROUP_ANNOUNCEMENT,
          },
        ];
        db.insert.mockReturnValueOnce(makeInsert(rows)).mockReturnValueOnce(makeInsertNoReturn());

        // user-1 has PUSH disabled; user-2 has no prefs
        db.query.userPreferences.findMany.mockResolvedValueOnce([
          {
            userId: 'user-1',
            notificationOptOuts: {
              [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH],
            },
          },
        ]);

        await service.notifyMany(['user-1', 'user-2'], NotificationType.GROUP_ANNOUNCEMENT, {}, [
          NotificationChannel.PUSH,
        ]);

        expect(pushStrategy.send).toHaveBeenCalledTimes(1);
        expect(pushStrategy.send).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'notif-2', userId: 'user-2' }),
          {},
        );
      });

      it('skips dispatch entirely when all users have the channel disabled', async () => {
        const rows = [
          {
            ...FAKE_NOTIFICATION,
            id: 'notif-1',
            userId: 'user-1',
            type: NotificationType.GROUP_ANNOUNCEMENT,
          },
          {
            ...FAKE_NOTIFICATION,
            id: 'notif-2',
            userId: 'user-2',
            type: NotificationType.GROUP_ANNOUNCEMENT,
          },
        ];
        db.insert.mockReturnValueOnce(makeInsert(rows));

        db.query.userPreferences.findMany.mockResolvedValueOnce([
          {
            userId: 'user-1',
            notificationOptOuts: {
              [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH],
            },
          },
          {
            userId: 'user-2',
            notificationOptOuts: {
              [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH],
            },
          },
        ]);

        await service.notifyMany(['user-1', 'user-2'], NotificationType.GROUP_ANNOUNCEMENT, {}, [
          NotificationChannel.PUSH,
        ]);

        // Only the notifications batch insert; no delivery rows written
        expect(db.insert).toHaveBeenCalledTimes(1);
        expect(pushStrategy.send).not.toHaveBeenCalled();
      });
    });
  });

  describe('findAll()', () => {
    it('returns items and null nextCursor when fewer than limit results', async () => {
      db.select.mockReturnValue(makeSelect([FAKE_NOTIFICATION]));

      const result = await service.findAll('user-1', undefined, 20);

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('returns nextCursor when results exceed limit', async () => {
      const rows = Array.from({ length: 21 }, (_, i) => ({
        ...FAKE_NOTIFICATION,
        id: `notif-${i}`,
        createdAt: new Date(`2026-01-${String(21 - i).padStart(2, '0')}T00:00:00.000Z`),
      }));
      db.select.mockReturnValue(makeSelect(rows));

      const result = await service.findAll('user-1', undefined, 20);

      expect(result.items).toHaveLength(20);
      expect(result.nextCursor).toBe(rows[19]!.createdAt.toISOString());
    });

    it('passes cursor to query as Date filter', async () => {
      db.select.mockReturnValue(makeSelect([]));

      await service.findAll('user-1', '2026-01-10T00:00:00.000Z', 20);

      const whereFn = db.select.mock.results[0]!.value.from.mock.results[0]!.value
        .where as jest.Mock;
      expect(whereFn).toHaveBeenCalled();
    });

    it('throws BadRequestException for an invalid cursor string', async () => {
      await expect(service.findAll('user-1', 'not-a-date', 20)).rejects.toThrow(
        BadRequestException,
      );
      expect(db.select).not.toHaveBeenCalled();
    });

    it('enriches groupName from groupId when missing from payload', async () => {
      const row = {
        ...FAKE_NOTIFICATION,
        type: NotificationType.GROUP_INVITATION,
        data: { groupId: 'group-1' },
      };
      db.select
        .mockReturnValueOnce(makeSelect([row]))
        .mockReturnValueOnce(makeEnrichSelect([{ id: 'group-1', name: 'Mountain Crew' }]))
        .mockReturnValueOnce(makeEnrichSelect([]));

      const result = await service.findAll('user-1');

      const rendered = result.items[0]!;
      // renderContent receives the enriched payload — i18n.translate is called with groupName in args
      expect(i18n.translate).toHaveBeenCalledWith(
        expect.stringContaining('groupInvitation'),
        expect.objectContaining({ args: expect.objectContaining({ groupName: 'Mountain Crew' }) }),
      );
      expect(rendered).toBeDefined();
    });

    it('enriches senderUsername from announcementId for GROUP_ANNOUNCEMENT when missing', async () => {
      const row = {
        ...FAKE_NOTIFICATION,
        type: NotificationType.GROUP_ANNOUNCEMENT,
        data: { groupId: 'group-1', announcementId: 'ann-1' },
      };
      db.select
        .mockReturnValueOnce(makeSelect([row]))
        .mockReturnValueOnce(makeEnrichSelect([{ id: 'group-1', name: 'Road Crew' }]))
        .mockReturnValueOnce(makeEnrichSelect([{ id: 'ann-1', username: 'alice' }]));

      await service.findAll('user-1');

      expect(i18n.translate).toHaveBeenCalledWith(
        expect.stringContaining('groupAnnouncement'),
        expect.objectContaining({
          args: expect.objectContaining({ groupName: 'Road Crew', senderUsername: 'alice' }),
        }),
      );
    });

    it('does not set groupName when group lookup returns no rows (soft-deleted group)', async () => {
      const row = {
        ...FAKE_NOTIFICATION,
        type: NotificationType.GROUP_INVITATION,
        data: { groupId: 'group-deleted' },
      };
      db.select
        .mockReturnValueOnce(makeSelect([row]))
        .mockReturnValueOnce(makeEnrichSelect([]))
        .mockReturnValueOnce(makeEnrichSelect([]));

      await service.findAll('user-1');

      // groupName must not be injected as empty string — payload should keep the raw groupId only
      expect(i18n.translate).toHaveBeenCalledWith(
        expect.stringContaining('groupInvitation'),
        expect.objectContaining({
          args: expect.not.objectContaining({ groupName: '' }),
        }),
      );
    });

    it('does not set senderUsername when announcement lookup returns no rows', async () => {
      const row = {
        ...FAKE_NOTIFICATION,
        type: NotificationType.GROUP_ANNOUNCEMENT,
        data: { groupId: 'group-1', announcementId: 'ann-deleted' },
      };
      db.select
        .mockReturnValueOnce(makeSelect([row]))
        .mockReturnValueOnce(makeEnrichSelect([{ id: 'group-1', name: 'Active Crew' }]))
        .mockReturnValueOnce(makeEnrichSelect([]));

      await service.findAll('user-1');

      expect(i18n.translate).toHaveBeenCalledWith(
        expect.stringContaining('groupAnnouncement'),
        expect.objectContaining({
          args: expect.not.objectContaining({ senderUsername: '' }),
        }),
      );
    });

    it('enriches tripName from tripId when missing from payload', async () => {
      const row = {
        ...FAKE_NOTIFICATION,
        type: NotificationType.TRIP_ANNOUNCEMENT,
        data: { tripId: 'trip-1' },
      };
      db.select
        .mockReturnValueOnce(makeSelect([row]))
        .mockReturnValueOnce(makeEnrichSelect([{ id: 'trip-1', name: 'Cartagena 2026' }]));

      await service.findAll('user-1');

      expect(i18n.translate).toHaveBeenCalledWith(
        expect.stringContaining('tripAnnouncement'),
        expect.objectContaining({ args: expect.objectContaining({ tripName: 'Cartagena 2026' }) }),
      );
    });

    it('enriches senderUsername from announcementId for TRIP_ANNOUNCEMENT when missing', async () => {
      const row = {
        ...FAKE_NOTIFICATION,
        type: NotificationType.TRIP_ANNOUNCEMENT,
        data: { tripId: 'trip-1', announcementId: 'ann-1' },
      };
      db.select
        .mockReturnValueOnce(makeSelect([row]))
        .mockReturnValueOnce(makeEnrichSelect([{ id: 'trip-1', name: 'Cartagena 2026' }]))
        .mockReturnValueOnce(makeEnrichSelect([{ id: 'ann-1', username: 'organizer-user' }]));

      await service.findAll('user-1');

      expect(i18n.translate).toHaveBeenCalledWith(
        expect.stringContaining('tripAnnouncement'),
        expect.objectContaining({
          args: expect.objectContaining({
            tripName: 'Cartagena 2026',
            senderUsername: 'organizer-user',
          }),
        }),
      );
    });

    it('does not make enrichment DB calls when payload already has resolved fields', async () => {
      const row = {
        ...FAKE_NOTIFICATION,
        type: NotificationType.GROUP_ANNOUNCEMENT,
        data: {
          groupId: 'group-1',
          groupName: 'Cached Crew',
          announcementId: 'ann-1',
          senderUsername: 'bob',
        },
      };
      db.select.mockReturnValueOnce(makeSelect([row]));

      await service.findAll('user-1');

      // Only the main notifications query — no enrichment selects
      expect(db.select).toHaveBeenCalledTimes(1);
    });
  });

  describe('markRead()', () => {
    it('updates readAt for the given user and notification', async () => {
      db.update.mockReturnValue(makeUpdate());

      await service.markRead('user-1', 'notif-1');

      expect(db.update).toHaveBeenCalledTimes(1);
      const setFn = db.update.mock.results[0]!.value.set as jest.Mock;
      const setArg = setFn.mock.calls[0]![0] as { readAt: unknown };
      expect(setArg.readAt).toBeInstanceOf(Date);
    });
  });

  describe('markAllRead()', () => {
    it('bulk-updates all unread notifications for the user', async () => {
      db.update.mockReturnValue(makeUpdate());

      await service.markAllRead('user-1');

      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('countUnread()', () => {
    const makeSelectCount = (value: number) => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ count: value }]),
      }),
    });

    it('returns the unread count from the query', async () => {
      db.select.mockReturnValue(makeSelectCount(5));

      const result = await service.countUnread('user-1');

      expect(result).toBe(5);
    });

    it('returns 0 when the query returns an empty result', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.countUnread('user-1');

      expect(result).toBe(0);
    });
  });

  describe('registerToken()', () => {
    const makeInsertUpsert = () => ({
      values: jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      }),
    });

    it('inserts with the correct userId, token, and deviceHint', async () => {
      db.insert.mockReturnValue(makeInsertUpsert());

      await service.registerToken('user-1', { token: 'tok-abc', deviceHint: 'Chrome 124' });

      expect(db.insert).toHaveBeenCalledTimes(1);
      const valuesFn = db.insert.mock.results[0]!.value.values as jest.Mock;
      const row = valuesFn.mock.calls[0]![0] as {
        userId: string;
        token: string;
        deviceHint: string | null;
      };
      expect(row.userId).toBe('user-1');
      expect(row.token).toBe('tok-abc');
      expect(row.deviceHint).toBe('Chrome 124');
    });

    it('sets deviceHint to null when omitted', async () => {
      db.insert.mockReturnValue(makeInsertUpsert());

      await service.registerToken('user-1', { token: 'tok-abc' });

      const valuesFn = db.insert.mock.results[0]!.value.values as jest.Mock;
      const row = valuesFn.mock.calls[0]![0] as { deviceHint: string | null };
      expect(row.deviceHint).toBeNull();
    });

    it('calls onConflictDoUpdate with userId + token as target', async () => {
      db.insert.mockReturnValue(makeInsertUpsert());

      await service.registerToken('user-1', { token: 'tok-abc' });

      const valuesFn = db.insert.mock.results[0]!.value.values as jest.Mock;
      const upsertFn = valuesFn.mock.results[0]!.value.onConflictDoUpdate as jest.Mock;
      expect(upsertFn).toHaveBeenCalledTimes(1);
      const upsertArg = upsertFn.mock.calls[0]![0] as { set: Record<string, unknown> };
      expect(upsertArg.set).toHaveProperty('lastUsedAt');
    });

    it('resolves without throwing', async () => {
      db.insert.mockReturnValue(makeInsertUpsert());

      await expect(service.registerToken('user-1', { token: 'tok-abc' })).resolves.toBeUndefined();
    });
  });

  describe('deleteToken()', () => {
    const makeDelete = () => ({
      where: jest.fn().mockResolvedValue(undefined),
    });

    it('calls delete with a scoped where clause', async () => {
      db.delete.mockReturnValue(makeDelete());

      await service.deleteToken('user-1', { token: 'tok-abc' });

      expect(db.delete).toHaveBeenCalledTimes(1);
      const whereFn = db.delete.mock.results[0]!.value.where as jest.Mock;
      expect(whereFn).toHaveBeenCalledTimes(1);
      // Drizzle SQL expressions are opaque objects — verify a condition was applied
      // (without .where(), the DELETE would affect all rows for all users)
      expect(whereFn.mock.calls[0]![0]).toBeDefined();
    });

    it('resolves without throwing when the token does not exist', async () => {
      db.delete.mockReturnValue(makeDelete());

      await expect(
        service.deleteToken('user-1', { token: 'nonexistent' }),
      ).resolves.toBeUndefined();
    });
  });
});
