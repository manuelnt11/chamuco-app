import { describe, it, expect } from 'vitest';
import { NotificationType } from './notification-type.enum';
import { NotificationChannel } from './notification-channel.enum';
import * as barrel from './index';

describe('NotificationType', () => {
  it('has all required values', () => {
    expect(NotificationType.GROUP_INVITATION).toBe('GROUP_INVITATION');
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
    expect(values).toHaveLength(10);
  });

  it('is exported from the enums barrel', () => {
    expect(barrel.NotificationType).toBeDefined();
    expect(barrel.NotificationType.GROUP_INVITATION).toBe('GROUP_INVITATION');
  });
});

describe('NotificationChannel', () => {
  it('has all required values', () => {
    expect(NotificationChannel.IN_APP).toBe('IN_APP');
    expect(NotificationChannel.PUSH).toBe('PUSH');
    expect(NotificationChannel.EMAIL).toBe('EMAIL');
    expect(NotificationChannel.SMS).toBe('SMS');
  });

  it('has exactly 4 members', () => {
    const values = Object.values(NotificationChannel);
    expect(values).toHaveLength(4);
  });

  it('is exported from the enums barrel', () => {
    expect(barrel.NotificationChannel).toBeDefined();
    expect(barrel.NotificationChannel.PUSH).toBe('PUSH');
  });
});
