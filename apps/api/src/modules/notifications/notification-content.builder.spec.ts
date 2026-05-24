import { NotificationType } from '@chamuco/shared-types';
import { buildNotificationContent } from './notification-content.builder';

describe('buildNotificationContent()', () => {
  it('covers all NotificationType values without throwing', () => {
    for (const type of Object.values(NotificationType)) {
      expect(() => buildNotificationContent(type, {})).not.toThrow();
    }
  });

  it('derives i18n keys from the notification type', () => {
    const result = buildNotificationContent(NotificationType.PASSPORT_EXPIRING_SOON, {});
    expect(result.titleKey).toBe('notifications.passportExpiringSoon.title');
    expect(result.bodyKey).toBe('notifications.passportExpiringSoon.body');
  });

  it('includes string payload values as args', () => {
    const result = buildNotificationContent(NotificationType.PASSPORT_EXPIRING_SOON, {
      countryCode: 'MX',
    });
    expect(result.args['countryCode']).toBe('MX');
  });

  it('includes number payload values as args', () => {
    const result = buildNotificationContent(NotificationType.ACHIEVEMENT_UNLOCKED, {
      points: 100,
    });
    expect(result.args['points']).toBe(100);
  });

  it('strips non-string/non-number payload values from args', () => {
    const result = buildNotificationContent(NotificationType.GROUP_ANNOUNCEMENT, {
      meta: { nested: true },
      flag: true,
      label: 'hello',
    });
    expect(result.args).toEqual({ label: 'hello' });
  });

  it('returns empty args when payload is empty', () => {
    const result = buildNotificationContent(NotificationType.TRIP_COMPLETED, {});
    expect(result.args).toEqual({});
  });

  it('passes description arg for TRIP_KEY_DATE_REMINDER', () => {
    const result = buildNotificationContent(NotificationType.TRIP_KEY_DATE_REMINDER, {
      description: 'Flight day',
    });
    expect(result.args['description']).toBe('Flight day');
  });

  it('passes achievementName arg for ACHIEVEMENT_UNLOCKED', () => {
    const result = buildNotificationContent(NotificationType.ACHIEVEMENT_UNLOCKED, {
      achievementName: 'World Traveler',
    });
    expect(result.args['achievementName']).toBe('World Traveler');
  });
});
