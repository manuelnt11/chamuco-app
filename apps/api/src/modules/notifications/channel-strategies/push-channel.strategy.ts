import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DeliveryStatus, NotificationChannel } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import { notificationDeliveries } from '@/modules/notifications/schema/notification-deliveries.schema';
import { userFcmTokens } from '@/modules/notifications/schema/user-fcm-tokens.schema';
import type { NotificationChannelStrategy, NotificationRow } from './notification-channel.strategy';

const STALE_TOKEN_ERROR = 'messaging/registration-token-not-registered';

@Injectable()
export class PushChannelStrategy implements NotificationChannelStrategy {
  private readonly logger = new Logger(PushChannelStrategy.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  async send(notification: NotificationRow, payload: Record<string, unknown>): Promise<void> {
    const tokenRows = await this.db
      .select({ token: userFcmTokens.token })
      .from(userFcmTokens)
      .where(eq(userFcmTokens.userId, notification.userId));

    if (tokenRows.length === 0) {
      await this.updateDelivery(notification.id, DeliveryStatus.FAILED, null, 'no_fcm_tokens');
      return;
    }

    const tokens = tokenRows.map((r) => r.token);
    const data = this.coercePayload(payload);

    let batchResponse;
    try {
      batchResponse = await this.firebaseAdmin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: notification.title, body: notification.body },
        data,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`FCM multicast failed for notification ${notification.id}`, err);
      await this.updateDelivery(notification.id, DeliveryStatus.FAILED, null, message);
      return;
    }

    const staleTokens: string[] = [];
    let firstNonStaleError: string | null = null;

    batchResponse.responses.forEach((response, index) => {
      if (!response.success && response.error) {
        if (response.error.code === STALE_TOKEN_ERROR) {
          staleTokens.push(tokens[index]!);
        } else if (firstNonStaleError === null) {
          firstNonStaleError = response.error.message ?? response.error.code;
        }
      }
    });

    if (staleTokens.length > 0) {
      await this.db
        .delete(userFcmTokens)
        .where(
          and(
            eq(userFcmTokens.userId, notification.userId),
            inArray(userFcmTokens.token, staleTokens),
          ),
        );
      this.logger.log(
        `Removed ${staleTokens.length} stale FCM token(s) for user ${notification.userId}`,
      );
    }

    const activeSent = batchResponse.successCount;
    const hasNonStaleFailure = firstNonStaleError !== null;

    if (activeSent === 0 && staleTokens.length === tokens.length) {
      // All tokens were stale — nothing delivered
      await this.updateDelivery(notification.id, DeliveryStatus.FAILED, null, 'no_fcm_tokens');
    } else if (hasNonStaleFailure) {
      await this.updateDelivery(notification.id, DeliveryStatus.FAILED, null, firstNonStaleError!);
    } else {
      await this.updateDelivery(notification.id, DeliveryStatus.SENT, new Date(), null);
    }
  }

  private async updateDelivery(
    notificationId: string,
    status: DeliveryStatus,
    sentAt: Date | null,
    error: string | null,
  ): Promise<void> {
    await this.db
      .update(notificationDeliveries)
      .set({ status, sentAt, error, updatedAt: new Date() })
      .where(
        and(
          eq(notificationDeliveries.notificationId, notificationId),
          eq(notificationDeliveries.channel, NotificationChannel.PUSH),
        ),
      );
  }

  private coercePayload(payload: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
    );
  }
}
