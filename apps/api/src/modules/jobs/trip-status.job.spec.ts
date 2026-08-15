import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { TripStatusJob } from './trip-status.job';

describe('TripStatusJob', () => {
  let job: TripStatusJob;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockSelect: jest.Mock;
  let notifyMany: jest.Mock;

  const dueTrips = [{ id: 'trip-1', name: 'Trip One' }];
  const participantRows = [{ userId: 'user-1' }, { userId: 'user-2' }];

  function queueSelectResult(rows: unknown[]): void {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(rows),
      }),
    });
  }

  beforeEach(async () => {
    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });
    mockSelect = jest.fn();
    notifyMany = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripStatusJob,
        {
          provide: DRIZZLE_CLIENT,
          useValue: { update: mockUpdate, select: mockSelect },
        },
        {
          provide: NotificationsService,
          useValue: { notifyMany },
        },
      ],
    }).compile();

    job = module.get<TripStatusJob>(TripStatusJob);
  });

  it('runs bulk update for IN_PROGRESS trips past end_date and notifies participants', async () => {
    queueSelectResult(dueTrips);
    queueSelectResult(participantRows);

    await job.runTripAutoComplete();

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledTimes(1);
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1);
    expect(notifyMany).toHaveBeenCalledWith(
      ['user-1', 'user-2'],
      'TRIP_COMPLETED',
      { tripId: 'trip-1', tripName: 'Trip One' },
      ['PUSH'],
    );
  });

  it('skips update and notifications when no trips are due', async () => {
    queueSelectResult([]);

    await job.runTripAutoComplete();

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(notifyMany).not.toHaveBeenCalled();
  });

  it('skips notification for a trip with no confirmed participants', async () => {
    queueSelectResult(dueTrips);
    queueSelectResult([]);

    await job.runTripAutoComplete();

    expect(notifyMany).not.toHaveBeenCalled();
  });

  it('logs error and does not rethrow when notifyMany rejects', async () => {
    queueSelectResult(dueTrips);
    queueSelectResult(participantRows);
    notifyMany.mockRejectedValue(new Error('notify failed'));
    const loggerSpy = jest.spyOn(job['logger'], 'error').mockImplementation(() => undefined);

    await expect(job.runTripAutoComplete()).resolves.toBeUndefined();
    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to send TRIP_COMPLETED notification',
      expect.any(Error),
    );
  });

  it('logs error and does not rethrow on DB failure', async () => {
    mockSelect.mockImplementation(() => {
      throw new Error('DB error');
    });
    const loggerSpy = jest.spyOn(job['logger'], 'error').mockImplementation(() => undefined);

    await expect(job.runTripAutoComplete()).resolves.toBeUndefined();
    expect(loggerSpy).toHaveBeenCalled();
  });
});
