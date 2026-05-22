import { NotificationType } from '@chamuco/shared-types';
import { buildNotificationContent } from './notification-content.builder';

describe('buildNotificationContent()', () => {
  it('PASSPORT_EXPIRING_SOON — uses countryCode from payload', () => {
    const result = buildNotificationContent(NotificationType.PASSPORT_EXPIRING_SOON, {
      countryCode: 'MX',
    });
    expect(result.title).toBe('Passport Expiring Soon');
    expect(result.body).toContain('MX');
  });

  it('PASSPORT_EXPIRING_SOON — falls back when countryCode missing', () => {
    const result = buildNotificationContent(NotificationType.PASSPORT_EXPIRING_SOON, {});
    expect(result.body).toContain('your country');
  });

  it('PASSPORT_EXPIRED — uses countryCode from payload', () => {
    const result = buildNotificationContent(NotificationType.PASSPORT_EXPIRED, {
      countryCode: 'CO',
    });
    expect(result.title).toBe('Passport Expired');
    expect(result.body).toContain('CO');
  });

  it('PASSPORT_EXPIRED — falls back when countryCode missing', () => {
    const result = buildNotificationContent(NotificationType.PASSPORT_EXPIRED, {});
    expect(result.body).toContain('your country');
  });

  it('GROUP_INVITATION — returns title and body', () => {
    const result = buildNotificationContent(NotificationType.GROUP_INVITATION, {});
    expect(result.title).toBe('Group Invitation');
    expect(result.body).toBeTruthy();
  });

  it('GROUP_JOIN_ACCEPTED — returns title and body', () => {
    const result = buildNotificationContent(NotificationType.GROUP_JOIN_ACCEPTED, {});
    expect(result.title).toBe('Join Request Accepted');
    expect(result.body).toBeTruthy();
  });

  it('GROUP_ANNOUNCEMENT — returns title and body', () => {
    const result = buildNotificationContent(NotificationType.GROUP_ANNOUNCEMENT, {});
    expect(result.title).toBe('New Group Announcement');
    expect(result.body).toBeTruthy();
  });

  it('TRIP_INVITATION — returns title and body', () => {
    const result = buildNotificationContent(NotificationType.TRIP_INVITATION, {});
    expect(result.title).toBe('Trip Invitation');
    expect(result.body).toBeTruthy();
  });

  it('TRIP_ANNOUNCEMENT — returns title and body', () => {
    const result = buildNotificationContent(NotificationType.TRIP_ANNOUNCEMENT, {});
    expect(result.title).toBe('New Trip Announcement');
    expect(result.body).toBeTruthy();
  });

  it('TRIP_KEY_DATE_REMINDER — uses description from payload', () => {
    const result = buildNotificationContent(NotificationType.TRIP_KEY_DATE_REMINDER, {
      description: 'Flight day',
    });
    expect(result.body).toContain('Flight day');
  });

  it('TRIP_KEY_DATE_REMINDER — falls back when description missing', () => {
    const result = buildNotificationContent(NotificationType.TRIP_KEY_DATE_REMINDER, {});
    expect(result.body).toContain('a key trip date');
  });

  it('TRIP_COMPLETED — returns title and body', () => {
    const result = buildNotificationContent(NotificationType.TRIP_COMPLETED, {});
    expect(result.title).toBe('Trip Completed');
    expect(result.body).toBeTruthy();
  });

  it('ACHIEVEMENT_UNLOCKED — uses achievementName from payload', () => {
    const result = buildNotificationContent(NotificationType.ACHIEVEMENT_UNLOCKED, {
      achievementName: 'World Traveler',
    });
    expect(result.body).toContain('World Traveler');
  });

  it('ACHIEVEMENT_UNLOCKED — falls back when achievementName missing', () => {
    const result = buildNotificationContent(NotificationType.ACHIEVEMENT_UNLOCKED, {});
    expect(result.body).toContain('new achievement');
  });
});
