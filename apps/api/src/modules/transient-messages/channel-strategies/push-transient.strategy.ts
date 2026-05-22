import { Injectable } from '@nestjs/common';
import type { TransientMessageType } from '@chamuco/shared-types';
import type { TransientChannelStrategy } from '@/modules/transient-messages/transient-channel.strategy';

@Injectable()
export class PushTransientStrategy implements TransientChannelStrategy {
  // TODO(Epic #8): implement FCM push via FirebaseAdminService.messaging()
  async send(_type: TransientMessageType, _payload: Record<string, unknown>): Promise<void> {}
}
