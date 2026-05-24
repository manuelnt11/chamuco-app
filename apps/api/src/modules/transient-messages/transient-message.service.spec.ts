import { Test, TestingModule } from '@nestjs/testing';
import { NotificationChannel, TransientMessageType } from '@chamuco/shared-types';
import { I18nService } from '@/i18n/i18n.service';
import { TransientMessageService } from './transient-message.service';
import { PUSH_TRANSIENT, EMAIL_TRANSIENT, SMS_TRANSIENT } from './transient-messages.constants';
import type { TransientChannelStrategy } from './transient-channel.strategy';

const makeStrategyMock = (): jest.Mocked<TransientChannelStrategy> => ({
  send: jest.fn().mockResolvedValue(undefined),
});

describe('TransientMessageService', () => {
  let service: TransientMessageService;
  let pushStrategy: jest.Mocked<TransientChannelStrategy>;
  let emailStrategy: jest.Mocked<TransientChannelStrategy>;
  let smsStrategy: jest.Mocked<TransientChannelStrategy>;
  let i18n: jest.Mocked<Pick<I18nService, 'translate'>>;

  beforeEach(async () => {
    pushStrategy = makeStrategyMock();
    emailStrategy = makeStrategyMock();
    smsStrategy = makeStrategyMock();

    // Returns the key as-is so assertions don't depend on translation output
    i18n = { translate: jest.fn().mockImplementation((key: string) => key) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransientMessageService,
        { provide: I18nService, useValue: i18n },
        { provide: PUSH_TRANSIENT, useValue: pushStrategy },
        { provide: EMAIL_TRANSIENT, useValue: emailStrategy },
        { provide: SMS_TRANSIENT, useValue: smsStrategy },
      ],
    }).compile();

    service = module.get<TransientMessageService>(TransientMessageService);
  });

  describe('send()', () => {
    it('calls correct strategy for EMAIL channel with rendered content', async () => {
      await service.send(
        TransientMessageType.EMAIL_VERIFICATION,
        { email: 'user@example.com', code: '123456' },
        [NotificationChannel.EMAIL],
      );

      expect(emailStrategy.send).toHaveBeenCalledWith(
        TransientMessageType.EMAIL_VERIFICATION,
        { email: 'user@example.com', code: '123456' },
        {
          subject: 'transient.emailVerification.subject',
          body: 'transient.emailVerification.body',
        },
      );
      expect(pushStrategy.send).not.toHaveBeenCalled();
      expect(smsStrategy.send).not.toHaveBeenCalled();
    });

    it('calls correct strategy for SMS channel', async () => {
      await service.send(
        TransientMessageType.PHONE_VERIFICATION,
        { phoneNumber: '+521234567890', code: '847291' },
        [NotificationChannel.SMS],
      );

      expect(smsStrategy.send).toHaveBeenCalledWith(
        TransientMessageType.PHONE_VERIFICATION,
        { phoneNumber: '+521234567890', code: '847291' },
        {
          subject: 'transient.phoneVerification.subject',
          body: 'transient.phoneVerification.body',
        },
      );
    });

    it('calls multiple strategies when multiple channels given', async () => {
      await service.send(
        TransientMessageType.WELCOME_EMAIL,
        { email: 'user@example.com', displayName: 'Manuel' },
        [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      );

      expect(emailStrategy.send).toHaveBeenCalledTimes(1);
      expect(pushStrategy.send).toHaveBeenCalledTimes(1);
      expect(smsStrategy.send).not.toHaveBeenCalled();
    });

    it('calls no strategies when channels is empty', async () => {
      await service.send(TransientMessageType.WELCOME_EMAIL, { email: 'user@example.com' }, []);

      expect(pushStrategy.send).not.toHaveBeenCalled();
      expect(emailStrategy.send).not.toHaveBeenCalled();
      expect(smsStrategy.send).not.toHaveBeenCalled();
    });

    it('does not rethrow when a strategy send() rejects', async () => {
      emailStrategy.send.mockRejectedValue(new Error('SMTP unavailable'));

      await expect(
        service.send(
          TransientMessageType.EMAIL_VERIFICATION,
          { email: 'user@example.com', code: '111' },
          [NotificationChannel.EMAIL],
        ),
      ).resolves.toBeUndefined();
    });

    it('resolves without throwing for WELCOME_EMAIL', async () => {
      await expect(
        service.send(
          TransientMessageType.WELCOME_EMAIL,
          { email: 'user@example.com', displayName: 'Manuel' },
          [NotificationChannel.EMAIL],
        ),
      ).resolves.toBeUndefined();
    });
  });
});
