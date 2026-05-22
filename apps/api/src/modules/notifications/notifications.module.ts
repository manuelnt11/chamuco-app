import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushChannelStrategy } from './channel-strategies/push-channel.strategy';
import { EmailChannelStrategy } from './channel-strategies/email-channel.strategy';
import { SmsChannelStrategy } from './channel-strategies/sms-channel.strategy';
import { PUSH_STRATEGY, EMAIL_STRATEGY, SMS_STRATEGY } from './notifications.constants';

@Module({
  providers: [
    NotificationsService,
    { provide: PUSH_STRATEGY, useClass: PushChannelStrategy },
    { provide: EMAIL_STRATEGY, useClass: EmailChannelStrategy },
    { provide: SMS_STRATEGY, useClass: SmsChannelStrategy },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
