import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, TransientMessageType } from '@chamuco/shared-types';
import { EMAIL_TRANSIENT, PUSH_TRANSIENT, SMS_TRANSIENT } from './transient-messages.constants';
import { buildTransientContent } from './transient-message-content.builder';
import type { TransientChannelStrategy } from './transient-channel.strategy';

@Injectable()
export class TransientMessageService {
  private readonly logger = new Logger(TransientMessageService.name);
  private readonly strategies: Record<NotificationChannel, TransientChannelStrategy>;

  constructor(
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
  ): Promise<void> {
    // Build content eagerly so errors surface before any delivery attempt
    buildTransientContent(type, payload);

    await Promise.allSettled(
      channels.map((channel) =>
        this.strategies[channel].send(type, payload).catch((err: unknown) => {
          this.logger.error(`Transient channel ${channel} dispatch failed for type ${type}`, err);
        }),
      ),
    );
  }
}
