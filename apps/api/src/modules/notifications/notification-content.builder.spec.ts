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

  it('includes boolean payload values as args', () => {
    const result = buildNotificationContent(NotificationType.GROUP_ANNOUNCEMENT, {
      enabled: true,
    });
    expect(result.args['enabled']).toBe(true);
  });

  it('strips object/null/undefined payload values from args', () => {
    const result = buildNotificationContent(NotificationType.GROUP_ANNOUNCEMENT, {
      meta: { nested: true },
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

  describe('url derivation', () => {
    it('derives /groups url for GROUP_INVITATION regardless of groupId', () => {
      const result = buildNotificationContent(NotificationType.GROUP_INVITATION, {
        groupId: 'g-123',
      });
      expect(result.url).toBe('/groups');
    });

    it('derives /groups/:id url for GROUP_JOIN_ACCEPTED', () => {
      const result = buildNotificationContent(NotificationType.GROUP_JOIN_ACCEPTED, {
        groupId: 'g-456',
      });
      expect(result.url).toBe('/groups/g-456');
    });

    it('derives /groups/:id url for GROUP_ANNOUNCEMENT', () => {
      const result = buildNotificationContent(NotificationType.GROUP_ANNOUNCEMENT, {
        groupId: 'g-789',
      });
      expect(result.url).toBe('/groups/g-789');
    });

    it('derives /groups url for GROUP_INVITATION when groupId is missing', () => {
      const result = buildNotificationContent(NotificationType.GROUP_INVITATION, {});
      expect(result.url).toBe('/groups');
    });

    it('derives /profile/passport for PASSPORT_EXPIRING_SOON', () => {
      const result = buildNotificationContent(NotificationType.PASSPORT_EXPIRING_SOON, {});
      expect(result.url).toBe('/profile/passport');
    });

    it('derives /profile/passport for PASSPORT_EXPIRED', () => {
      const result = buildNotificationContent(NotificationType.PASSPORT_EXPIRED, {});
      expect(result.url).toBe('/profile/passport');
    });

    it('derives /profile/achievements for ACHIEVEMENT_UNLOCKED', () => {
      const result = buildNotificationContent(NotificationType.ACHIEVEMENT_UNLOCKED, {});
      expect(result.url).toBe('/profile/achievements');
    });

    it('returns null for types without a dedicated url (e.g. TRIP_COMPLETED)', () => {
      const result = buildNotificationContent(NotificationType.TRIP_COMPLETED, {});
      expect(result.url).toBeNull();
    });

    it('derives /trips/:id url for TRIP_ANNOUNCEMENT', () => {
      const result = buildNotificationContent(NotificationType.TRIP_ANNOUNCEMENT, {
        tripId: 't-123',
      });
      expect(result.url).toBe('/trips/t-123');
    });

    it('returns null for TRIP_ANNOUNCEMENT when tripId is missing', () => {
      const result = buildNotificationContent(NotificationType.TRIP_ANNOUNCEMENT, {});
      expect(result.url).toBeNull();
    });
  });
});
