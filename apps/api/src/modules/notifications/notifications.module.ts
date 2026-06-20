import { Module } from '@nestjs/common';
import { I18nHelperModule } from '@/i18n/i18n.module';
import { EmailModule } from '@/modules/email/email.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushChannelStrategy } from './channel-strategies/push-channel.strategy';
import { EmailChannelStrategy } from './channel-strategies/email-channel.strategy';
import { SmsChannelStrategy } from './channel-strategies/sms-channel.strategy';
import { PUSH_STRATEGY, EMAIL_STRATEGY, SMS_STRATEGY } from './notifications.constants';

@Module({
  imports: [I18nHelperModule, EmailModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: PUSH_STRATEGY, useClass: PushChannelStrategy },
    { provide: EMAIL_STRATEGY, useClass: EmailChannelStrategy },
    { provide: SMS_STRATEGY, useClass: SmsChannelStrategy },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
