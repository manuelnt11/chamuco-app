import { Injectable } from '@nestjs/common';
import type { NotificationChannelStrategy, NotificationRow } from './notification-channel.strategy';

@Injectable()
export class EmailChannelStrategy implements NotificationChannelStrategy {
  // TODO(Epic #8): implement email delivery
  async send(_notification: NotificationRow, _payload: Record<string, unknown>): Promise<void> {}
}
