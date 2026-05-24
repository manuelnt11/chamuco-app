import { Injectable } from '@nestjs/common';
import type { TransientMessageType } from '@chamuco/shared-types';
import type {
  TransientChannelStrategy,
  TransientContent,
} from '@/modules/transient-messages/transient-channel.strategy';

@Injectable()
export class EmailTransientStrategy implements TransientChannelStrategy {
  // TODO(Epic #8): implement email delivery
  async send(
    _type: TransientMessageType,
    _payload: Record<string, unknown>,
    _content: TransientContent,
  ): Promise<void> {}
}
