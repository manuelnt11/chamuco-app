import { Injectable } from '@nestjs/common';
import type { TransientMessageType } from '@chamuco/shared-types';
import type { TransientChannelStrategy } from '@/modules/transient-messages/transient-channel.strategy';

@Injectable()
export class SmsTransientStrategy implements TransientChannelStrategy {
  // TODO(Epic #8): implement SMS delivery
  async send(
    _type: TransientMessageType,
    _payload: Record<string, unknown>,
    _content: { subject: string; body: string },
  ): Promise<void> {}
}
