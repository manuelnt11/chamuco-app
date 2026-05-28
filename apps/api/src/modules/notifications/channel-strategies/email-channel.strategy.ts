import { Injectable } from '@nestjs/common';
import type {
  DispatchableNotification,
  NotificationChannelStrategy,
} from './notification-channel.strategy';

@Injectable()
export class EmailChannelStrategy implements NotificationChannelStrategy {
  // TODO(Epic #8): implement email delivery
  async send(
    _notification: DispatchableNotification,
    _payload: Record<string, unknown>,
  ): Promise<void> {}
}
