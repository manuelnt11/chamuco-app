import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import { DeliveryStatus, NotificationChannel, NotificationType } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { notificationDeliveries } from '@/modules/notifications/schema/notification-deliveries.schema';
import { users } from '@/modules/users/schema/users.schema';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import { EmailService } from '@/modules/email/email.service';
import { EmailTemplate } from '@/modules/email/email-template.enum';
import type {
  DispatchableNotification,
  NotificationChannelStrategy,
} from './notification-channel.strategy';

const TEMPLATE_MAP: Partial<Record<NotificationType, EmailTemplate>> = {
  [NotificationType.TRIP_INVITATION]: EmailTemplate.TRIP_INVITATION,
  [NotificationType.GROUP_INVITATION]: EmailTemplate.GROUP_INVITATION,
  [NotificationType.PASSPORT_EXPIRING_SOON]: EmailTemplate.PASSPORT_EXPIRING_SOON,
  [NotificationType.PASSPORT_EXPIRED]: EmailTemplate.PASSPORT_EXPIRED,
};

@Injectable()
export class EmailChannelStrategy implements NotificationChannelStrategy {
  private readonly logger = new Logger(EmailChannelStrategy.name);
  private readonly frontendUrl: string;

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly emailService: EmailService,
    cfg: ConfigService,
  ) {
    this.frontendUrl = cfg.get<string>('FRONTEND_URL')!;
  }

  async send(
    notification: DispatchableNotification,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const template = TEMPLATE_MAP[notification.type];
    if (!template) {
      this.logger.warn(
        `No email template for notification type ${notification.type} — skipping delivery`,
      );
      await this.updateDelivery(notification.id, DeliveryStatus.FAILED, null, 'no_template');
      return;
    }

    const [profile] = await this.db
      .select({ email: userProfiles.email, displayName: users.displayName })
      .from(userProfiles)
      .innerJoin(users, eq(users.id, userProfiles.userId))
      .where(eq(userProfiles.userId, notification.userId));

    if (!profile?.email) {
      this.logger.warn(`No email found for user ${notification.userId}`);
      await this.updateDelivery(notification.id, DeliveryStatus.FAILED, null, 'no_email');
      return;
    }

    try {
      await this.emailService.sendMail({
        to: profile.email,
        subject: notification.title,
        template,
        context: {
          displayName: profile.displayName,
          title: notification.title,
          body: notification.body,
          ctaUrl: this.buildCTAUrl(notification.type, payload),
          ...this.extractPayloadContext(notification.type, payload),
        },
      });
      await this.updateDelivery(notification.id, DeliveryStatus.SENT, new Date(), null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Email delivery failed for notification ${notification.id}`, err);
      await this.updateDelivery(notification.id, DeliveryStatus.FAILED, null, message);
    }
  }

  private buildCTAUrl(type: NotificationType, payload: Record<string, unknown>): string | null {
    switch (type) {
      case NotificationType.TRIP_INVITATION:
        return typeof payload.tripId === 'string'
          ? `${this.frontendUrl}/trips/${payload.tripId}`
          : null;
      case NotificationType.GROUP_INVITATION:
        return typeof payload.groupId === 'string'
          ? `${this.frontendUrl}/groups/${payload.groupId}`
          : null;
      case NotificationType.PASSPORT_EXPIRING_SOON:
      case NotificationType.PASSPORT_EXPIRED:
        return `${this.frontendUrl}/profile/travel-docs`;
      default:
        return null;
    }
  }

  private extractPayloadContext(
    type: NotificationType,
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    switch (type) {
      case NotificationType.TRIP_INVITATION:
        return { tripName: payload.tripName ?? '' };
      case NotificationType.GROUP_INVITATION:
        return { groupName: payload.groupName ?? '' };
      case NotificationType.PASSPORT_EXPIRING_SOON:
      case NotificationType.PASSPORT_EXPIRED:
        return { countryCode: payload.countryCode ?? '' };
      default:
        return {};
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
          eq(notificationDeliveries.channel, NotificationChannel.EMAIL),
        ),
      );
  }
}
