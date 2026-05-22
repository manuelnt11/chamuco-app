import { Module } from '@nestjs/common';
import { TransientMessageService } from './transient-message.service';
import { PushTransientStrategy } from './channel-strategies/push-transient.strategy';
import { EmailTransientStrategy } from './channel-strategies/email-transient.strategy';
import { SmsTransientStrategy } from './channel-strategies/sms-transient.strategy';
import { PUSH_TRANSIENT, EMAIL_TRANSIENT, SMS_TRANSIENT } from './transient-messages.constants';

@Module({
  providers: [
    TransientMessageService,
    { provide: PUSH_TRANSIENT, useClass: PushTransientStrategy },
    { provide: EMAIL_TRANSIENT, useClass: EmailTransientStrategy },
    { provide: SMS_TRANSIENT, useClass: SmsTransientStrategy },
  ],
  exports: [TransientMessageService],
})
export class TransientMessagesModule {}
