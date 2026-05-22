import { Injectable } from '@nestjs/common';
import type { NotificationChannelStrategy, NotificationRow } from './notification-channel.strategy';

@Injectable()
export class PushChannelStrategy implements NotificationChannelStrategy {
  // TODO(Epic #8): implement FCM push via FirebaseAdminService.messaging()
  async send(_notification: NotificationRow, _payload: Record<string, unknown>): Promise<void> {}
}
