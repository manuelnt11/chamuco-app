import { NotificationChannel, NotificationType } from '@chamuco/shared-types';
import { notifyTripCompleted } from './trip-completion.util';

describe('notifyTripCompleted()', () => {
  let mockSelectWhere: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockDb: { select: jest.Mock };
  let notifyMany: jest.Mock;
  let mockNotifications: { notifyMany: jest.Mock };

  beforeEach(() => {
    mockSelectWhere = jest.fn().mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });
    mockDb = { select: mockSelect };

    notifyMany = jest.fn().mockResolvedValue(undefined);
    mockNotifications = { notifyMany };
  });

  it('notifies all active participants', async () => {
    await notifyTripCompleted(mockDb as never, mockNotifications as never, 'trip-1', 'Trip One');

    expect(notifyMany).toHaveBeenCalledWith(
      ['user-1', 'user-2'],
      NotificationType.TRIP_COMPLETED,
      { tripId: 'trip-1', tripName: 'Trip One' },
      [NotificationChannel.PUSH],
    );
  });

  it('excludes the given user from the recipient list', async () => {
    await notifyTripCompleted(
      mockDb as never,
      mockNotifications as never,
      'trip-1',
      'Trip One',
      'user-1',
    );

    expect(notifyMany).toHaveBeenCalledWith(
      ['user-2'],
      NotificationType.TRIP_COMPLETED,
      { tripId: 'trip-1', tripName: 'Trip One' },
      [NotificationChannel.PUSH],
    );
  });

  it('does nothing when there are no active participants left to notify', async () => {
    mockSelectWhere.mockResolvedValue([]);

    await notifyTripCompleted(mockDb as never, mockNotifications as never, 'trip-1', 'Trip One');

    expect(notifyMany).not.toHaveBeenCalled();
  });

  it('logs and does not throw when notifyMany rejects', async () => {
    notifyMany.mockRejectedValue(new Error('FCM down'));

    await expect(
      notifyTripCompleted(mockDb as never, mockNotifications as never, 'trip-1', 'Trip One'),
    ).resolves.toBeUndefined();
  });
});
