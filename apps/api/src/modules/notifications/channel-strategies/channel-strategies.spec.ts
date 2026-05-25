import { DeliveryStatus, NotificationType } from '@chamuco/shared-types';
import type { DrizzleClient } from '@/database/drizzle.provider';
import type { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import { PushChannelStrategy } from './push-channel.strategy';
import { EmailChannelStrategy } from './email-channel.strategy';
import { SmsChannelStrategy } from './sms-channel.strategy';
import type { NotificationRow } from './notification-channel.strategy';

const FAKE_NOTIFICATION: NotificationRow = {
  id: 'notif-1',
  userId: 'user-1',
  type: NotificationType.PASSPORT_EXPIRING_SOON,
  title: 'Test title',
  body: 'Test body',
  data: {},
  readAt: null,
  createdAt: new Date(),
};

type SendResponse = { success: boolean; error?: { code: string; message?: string } };

function makeBatchResponse(responses: SendResponse[]) {
  return {
    successCount: responses.filter((r) => r.success).length,
    failureCount: responses.filter((r) => !r.success).length,
    responses,
  };
}

function makeContext(tokens: string[], sendEachForMulticast: jest.Mock) {
  const updateSetWhere = jest.fn().mockResolvedValue(undefined);
  const updateSet = jest.fn().mockReturnValue({ where: updateSetWhere });
  const deleteWhere = jest.fn().mockResolvedValue(undefined);

  const db = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(tokens.map((token) => ({ token }))),
      }),
    }),
    delete: jest.fn().mockReturnValue({ where: deleteWhere }),
    update: jest.fn().mockReturnValue({ set: updateSet }),
  };

  const firebaseAdmin = {
    messaging: jest.fn().mockReturnValue({ sendEachForMulticast }),
  };

  const strategy = new PushChannelStrategy(
    db as unknown as DrizzleClient,
    firebaseAdmin as unknown as FirebaseAdminService,
  );

  const getSetArgs = () =>
    updateSet.mock.calls[0]?.[0] as
      | { status: DeliveryStatus; sentAt: Date | null; error: string | null }
      | undefined;

  return { strategy, db, updateSet, deleteWhere, getSetArgs };
}

// ─── PushChannelStrategy ─────────────────────────────────────────────────────

describe('PushChannelStrategy', () => {
  describe('no tokens for user', () => {
    it('marks delivery FAILED(no_fcm_tokens) and skips FCM call', async () => {
      const sendEachForMulticast = jest.fn();
      const { strategy, db, getSetArgs } = makeContext([], sendEachForMulticast);

      await strategy.send(FAKE_NOTIFICATION, {});

      expect(sendEachForMulticast).not.toHaveBeenCalled();
      expect(db.delete).not.toHaveBeenCalled();
      expect(getSetArgs()?.status).toBe(DeliveryStatus.FAILED);
      expect(getSetArgs()?.error).toBe('no_fcm_tokens');
      expect(getSetArgs()?.sentAt).toBeNull();
    });
  });

  describe('all tokens succeed', () => {
    it('calls FCM with correct args and marks delivery SENT', async () => {
      const sendEachForMulticast = jest
        .fn()
        .mockResolvedValue(makeBatchResponse([{ success: true }, { success: true }]));
      const { strategy, db, getSetArgs } = makeContext(['tok-a', 'tok-b'], sendEachForMulticast);

      await strategy.send(FAKE_NOTIFICATION, { key: 'val' });

      expect(sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['tok-a', 'tok-b'],
          notification: { title: FAKE_NOTIFICATION.title, body: FAKE_NOTIFICATION.body },
          data: { key: 'val' },
        }),
      );
      expect(db.delete).not.toHaveBeenCalled();
      expect(getSetArgs()?.status).toBe(DeliveryStatus.SENT);
      expect(getSetArgs()?.sentAt).toBeInstanceOf(Date);
      expect(getSetArgs()?.error).toBeNull();
    });
  });

  describe('mixed: one stale token, one success', () => {
    it('deletes stale token and marks delivery SENT', async () => {
      const sendEachForMulticast = jest
        .fn()
        .mockResolvedValue(
          makeBatchResponse([
            { success: true },
            { success: false, error: { code: 'messaging/registration-token-not-registered' } },
          ]),
        );
      const { strategy, db, getSetArgs } = makeContext(
        ['tok-ok', 'tok-stale'],
        sendEachForMulticast,
      );

      await strategy.send(FAKE_NOTIFICATION, {});

      expect(db.delete).toHaveBeenCalled();
      expect(getSetArgs()?.status).toBe(DeliveryStatus.SENT);
      expect(getSetArgs()?.sentAt).toBeInstanceOf(Date);
    });
  });

  describe('all tokens stale', () => {
    it('deletes all tokens and marks delivery FAILED(no_fcm_tokens)', async () => {
      const sendEachForMulticast = jest.fn().mockResolvedValue(
        makeBatchResponse([
          { success: false, error: { code: 'messaging/registration-token-not-registered' } },
          { success: false, error: { code: 'messaging/registration-token-not-registered' } },
        ]),
      );
      const { strategy, db, getSetArgs } = makeContext(['s1', 's2'], sendEachForMulticast);

      await strategy.send(FAKE_NOTIFICATION, {});

      expect(db.delete).toHaveBeenCalled();
      expect(getSetArgs()?.status).toBe(DeliveryStatus.FAILED);
      expect(getSetArgs()?.error).toBe('no_fcm_tokens');
    });
  });

  describe('non-stale FCM error', () => {
    it('does NOT delete token and marks delivery FAILED with error message', async () => {
      const sendEachForMulticast = jest.fn().mockResolvedValue(
        makeBatchResponse([
          {
            success: false,
            error: { code: 'messaging/invalid-argument', message: 'Bad token format' },
          },
        ]),
      );
      const { strategy, db, getSetArgs } = makeContext(['tok-bad'], sendEachForMulticast);

      await strategy.send(FAKE_NOTIFICATION, {});

      expect(db.delete).not.toHaveBeenCalled();
      expect(getSetArgs()?.status).toBe(DeliveryStatus.FAILED);
      expect(getSetArgs()?.error).toBe('Bad token format');
    });
  });

  describe('sendEachForMulticast throws', () => {
    it('marks delivery FAILED with thrown error message', async () => {
      const sendEachForMulticast = jest.fn().mockRejectedValue(new Error('Network timeout'));
      const { strategy, getSetArgs } = makeContext(['tok-x'], sendEachForMulticast);

      await strategy.send(FAKE_NOTIFICATION, {});

      expect(getSetArgs()?.status).toBe(DeliveryStatus.FAILED);
      expect(getSetArgs()?.error).toBe('Network timeout');
    });
  });

  describe('payload coercion', () => {
    it('converts non-string values to JSON strings', async () => {
      const sendEachForMulticast = jest
        .fn()
        .mockResolvedValue(makeBatchResponse([{ success: true }]));
      const { strategy } = makeContext(['tok-a'], sendEachForMulticast);

      await strategy.send(FAKE_NOTIFICATION, { count: 3, flag: true, nested: { x: 1 } });

      expect(sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { count: '3', flag: 'true', nested: '{"x":1}' },
        }),
      );
    });
  });
});

// ─── Stub strategy smoke tests ───────────────────────────────────────────────

describe('EmailChannelStrategy', () => {
  it('send() resolves without throwing', async () => {
    const strategy = new EmailChannelStrategy();
    await expect(strategy.send(FAKE_NOTIFICATION, {})).resolves.toBeUndefined();
  });
});

describe('SmsChannelStrategy', () => {
  it('send() resolves without throwing', async () => {
    const strategy = new SmsChannelStrategy();
    await expect(strategy.send(FAKE_NOTIFICATION, {})).resolves.toBeUndefined();
  });
});
