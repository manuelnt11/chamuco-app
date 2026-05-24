import { TransientMessageType } from '@chamuco/shared-types';
import { PushTransientStrategy } from './push-transient.strategy';
import { EmailTransientStrategy } from './email-transient.strategy';
import { SmsTransientStrategy } from './sms-transient.strategy';

describe('PushTransientStrategy', () => {
  it('send() resolves without throwing', async () => {
    const strategy = new PushTransientStrategy();
    await expect(
      strategy.send(TransientMessageType.PHONE_VERIFICATION, {}, { subject: 'S', body: 'B' }),
    ).resolves.toBeUndefined();
  });
});

describe('EmailTransientStrategy', () => {
  it('send() resolves without throwing', async () => {
    const strategy = new EmailTransientStrategy();
    await expect(
      strategy.send(TransientMessageType.EMAIL_VERIFICATION, {}, { subject: 'S', body: 'B' }),
    ).resolves.toBeUndefined();
  });
});

describe('SmsTransientStrategy', () => {
  it('send() resolves without throwing', async () => {
    const strategy = new SmsTransientStrategy();
    await expect(
      strategy.send(TransientMessageType.PHONE_VERIFICATION, {}, { subject: 'S', body: 'B' }),
    ).resolves.toBeUndefined();
  });
});
