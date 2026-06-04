import { describe, it, expect } from 'vitest';
import { NotificationType } from './notification-type.enum';
import { NotificationChannel } from './notification-channel.enum';
import { DeliveryStatus } from './delivery-status.enum';
import * as barrel from './index';

describe('NotificationType', () => {
  it('has all required values', () => {
    expect(NotificationType.GROUP_INVITATION).toBe('GROUP_INVITATION');
    expect(NotificationType.GROUP_INVITATION_ACCEPTED).toBe('GROUP_INVITATION_ACCEPTED');
    expect(NotificationType.GROUP_JOIN_ACCEPTED).toBe('GROUP_JOIN_ACCEPTED');
    expect(NotificationType.GROUP_ANNOUNCEMENT).toBe('GROUP_ANNOUNCEMENT');
    expect(NotificationType.TRIP_INVITATION).toBe('TRIP_INVITATION');
    expect(NotificationType.TRIP_ANNOUNCEMENT).toBe('TRIP_ANNOUNCEMENT');
    expect(NotificationType.TRIP_KEY_DATE_REMINDER).toBe('TRIP_KEY_DATE_REMINDER');
    expect(NotificationType.TRIP_COMPLETED).toBe('TRIP_COMPLETED');
    expect(NotificationType.PASSPORT_EXPIRING_SOON).toBe('PASSPORT_EXPIRING_SOON');
    expect(NotificationType.PASSPORT_EXPIRED).toBe('PASSPORT_EXPIRED');
    expect(NotificationType.ACHIEVEMENT_UNLOCKED).toBe('ACHIEVEMENT_UNLOCKED');
  });

  it('has exactly 10 members', () => {
    const values = Object.values(NotificationType);
    expect(values).toHaveLength(11);
  });

  it('is exported from the enums barrel', () => {
    expect(barrel.NotificationType).toBeDefined();
    expect(barrel.NotificationType.GROUP_INVITATION).toBe('GROUP_INVITATION');
  });
});

describe('NotificationChannel', () => {
  it('has all required values', () => {
    expect(NotificationChannel.PUSH).toBe('PUSH');
    expect(NotificationChannel.EMAIL).toBe('EMAIL');
    expect(NotificationChannel.SMS).toBe('SMS');
  });

  it('has exactly 3 members', () => {
    const values = Object.values(NotificationChannel);
    expect(values).toHaveLength(3);
  });

  it('is exported from the enums barrel', () => {
    expect(barrel.NotificationChannel).toBeDefined();
    expect(barrel.NotificationChannel.PUSH).toBe('PUSH');
  });
});

describe('DeliveryStatus', () => {
  it('has all required values', () => {
    expect(DeliveryStatus.PENDING).toBe('PENDING');
    expect(DeliveryStatus.SENT).toBe('SENT');
    expect(DeliveryStatus.FAILED).toBe('FAILED');
  });

  it('has exactly 3 members', () => {
    const values = Object.values(DeliveryStatus);
    expect(values).toHaveLength(3);
  });

  it('is exported from the enums barrel', () => {
    expect(barrel.DeliveryStatus).toBeDefined();
    expect(barrel.DeliveryStatus.PENDING).toBe('PENDING');
  });
});
