import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, TransientMessageType } from '@chamuco/shared-types';
import { I18nService, SupportedLanguage } from '@/i18n/i18n.service';
import { EMAIL_TRANSIENT, PUSH_TRANSIENT, SMS_TRANSIENT } from './transient-messages.constants';
import { buildTransientContent } from './transient-message-content.builder';
import type { TransientChannelStrategy } from './transient-channel.strategy';

@Injectable()
export class TransientMessageService {
  private readonly logger = new Logger(TransientMessageService.name);
  private readonly strategies: Record<NotificationChannel, TransientChannelStrategy>;

  constructor(
    private readonly i18n: I18nService,
    @Inject(PUSH_TRANSIENT) push: TransientChannelStrategy,
    @Inject(EMAIL_TRANSIENT) email: TransientChannelStrategy,
    @Inject(SMS_TRANSIENT) sms: TransientChannelStrategy,
  ) {
    this.strategies = {
      [NotificationChannel.PUSH]: push,
      [NotificationChannel.EMAIL]: email,
      [NotificationChannel.SMS]: sms,
    };
  }

  async send(
    type: TransientMessageType,
    payload: Record<string, unknown>,
    channels: NotificationChannel[],
    // TODO: replace default with user.preferredLanguage once user language preferences are implemented
    lang: SupportedLanguage = 'es',
  ): Promise<void> {
    const { subjectKey, bodyKey, args } = buildTransientContent(type, payload);
    const content = {
      subject: this.i18n.translate(subjectKey, { lang, args }),
      body: this.i18n.translate(bodyKey, { lang, args }),
    };

    await Promise.allSettled(
      channels.map((channel) =>
        this.strategies[channel].send(type, payload, content).catch((err: unknown) => {
          this.logger.error(`Transient channel ${channel} dispatch failed for type ${type}`, err);
        }),
      ),
    );
  }
}
