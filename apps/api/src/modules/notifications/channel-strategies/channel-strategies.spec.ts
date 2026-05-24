import { PushChannelStrategy } from './push-channel.strategy';
import { EmailChannelStrategy } from './email-channel.strategy';
import { SmsChannelStrategy } from './sms-channel.strategy';
import type { NotificationRow } from './notification-channel.strategy';
import { NotificationType } from '@chamuco/shared-types';

const FAKE_NOTIFICATION: NotificationRow = {
  id: 'notif-1',
  userId: 'user-1',
  type: NotificationType.PASSPORT_EXPIRING_SOON,
  title: 'Test',
  body: 'Test body',
  data: {},
  readAt: null,
  createdAt: new Date(),
};

describe('PushChannelStrategy', () => {
  it('send() resolves without throwing', async () => {
    const strategy = new PushChannelStrategy();
    await expect(strategy.send(FAKE_NOTIFICATION, {})).resolves.toBeUndefined();
  });
});

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
