import { Test, TestingModule } from '@nestjs/testing';
import {
  DeliveryStatus,
  NotificationChannel,
  NotificationType,
  PassportStatus,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { NotificationsService } from './notifications.service';
import { PUSH_STRATEGY, EMAIL_STRATEGY, SMS_STRATEGY } from './notifications.constants';
import type { NotificationChannelStrategy } from './channel-strategies/notification-channel.strategy';

const FAKE_NOTIFICATION = {
  id: 'notif-1',
  userId: 'user-1',
  type: NotificationType.PASSPORT_EXPIRING_SOON,
  title: 'Passport Expiring Soon',
  body: 'Your passport for MX is expiring soon.',
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

const makeStrategyMock = (): jest.Mocked<NotificationChannelStrategy> => ({
  send: jest.fn().mockResolvedValue(undefined),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let pushStrategy: jest.Mocked<NotificationChannelStrategy>;
  let emailStrategy: jest.Mocked<NotificationChannelStrategy>;
  let smsStrategy: jest.Mocked<NotificationChannelStrategy>;

  let db: {
    insert: jest.Mock;
    update: jest.Mock;
    select: jest.Mock;
  };

  beforeEach(async () => {
    pushStrategy = makeStrategyMock();
    emailStrategy = makeStrategyMock();
    smsStrategy = makeStrategyMock();

    db = {
      insert: jest.fn(),
      update: jest.fn(),
      select: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DRIZZLE_CLIENT, useValue: db },
        { provide: PUSH_STRATEGY, useValue: pushStrategy },
        { provide: EMAIL_STRATEGY, useValue: emailStrategy },
        { provide: SMS_STRATEGY, useValue: smsStrategy },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('notify()', () => {
    it('inserts a notifications row', async () => {
      db.insert.mockReturnValue(makeInsert([FAKE_NOTIFICATION]));

      await service.notify(
        'user-1',
        NotificationType.PASSPORT_EXPIRING_SOON,
        { countryCode: 'MX' },
        [],
      );

      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('does not insert deliveries when channels is empty', async () => {
      db.insert.mockReturnValue(makeInsert([FAKE_NOTIFICATION]));

      await service.notify(
        'user-1',
        NotificationType.PASSPORT_EXPIRING_SOON,
        { countryCode: 'MX' },
        [],
      );

      expect(db.insert).toHaveBeenCalledTimes(1);
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
      expect(pushStrategy.send).toHaveBeenCalledWith(FAKE_NOTIFICATION, { countryCode: 'MX' });
      expect(emailStrategy.send).toHaveBeenCalledWith(FAKE_NOTIFICATION, { countryCode: 'MX' });
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

  describe('sendPassportStatusNotification()', () => {
    it('calls notify() with PASSPORT_EXPIRING_SOON type', async () => {
      db.insert.mockReturnValue(makeInsert([FAKE_NOTIFICATION]));

      await service.sendPassportStatusNotification('user-1', 'MX', PassportStatus.EXPIRING_SOON);

      const valuesFn = db.insert.mock.results[0]!.value.values as jest.Mock;
      const insertedRow = valuesFn.mock.calls[0]![0] as {
        type: string;
        data: Record<string, unknown>;
      };
      expect(insertedRow.type).toBe(NotificationType.PASSPORT_EXPIRING_SOON);
      expect(insertedRow.data).toMatchObject({ countryCode: 'MX' });
    });

    it('calls notify() with PASSPORT_EXPIRED type', async () => {
      db.insert.mockReturnValue(makeInsert([FAKE_NOTIFICATION]));

      await service.sendPassportStatusNotification('user-1', 'US', PassportStatus.EXPIRED);

      const valuesFn = db.insert.mock.results[0]!.value.values as jest.Mock;
      const insertedRow = valuesFn.mock.calls[0]![0] as { type: string };
      expect(insertedRow.type).toBe(NotificationType.PASSPORT_EXPIRED);
    });

    it('resolves without throwing', async () => {
      db.insert.mockReturnValue(makeInsert([FAKE_NOTIFICATION]));

      await expect(
        service.sendPassportStatusNotification('user-1', 'MX', PassportStatus.EXPIRING_SOON),
      ).resolves.toBeUndefined();
    });
  });
});
