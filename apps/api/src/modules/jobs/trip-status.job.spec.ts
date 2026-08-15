import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { TripStatusJob } from './trip-status.job';

describe('TripStatusJob', () => {
  let job: TripStatusJob;
  let mockUpdateReturning: jest.Mock;
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

  function queueUpdateResult(rows: unknown[]): void {
    mockUpdateReturning.mockResolvedValueOnce(rows);
  }

  beforeEach(async () => {
    mockUpdateReturning = jest.fn().mockResolvedValue([{ id: 'trip-1' }]);
    mockUpdateWhere = jest.fn().mockReturnValue({ returning: mockUpdateReturning });
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

  it('completes each due trip individually and notifies its confirmed participants', async () => {
    queueSelectResult(dueTrips);
    queueSelectResult(participantRows);

    await job.runTripAutoComplete();

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledWith({ status: 'COMPLETED' });
    expect(notifyMany).toHaveBeenCalledWith(
      ['user-1', 'user-2'],
      'TRIP_COMPLETED',
      { tripId: 'trip-1', tripName: 'Trip One' },
      ['PUSH'],
    );
  });

  it('does nothing when no trips are due', async () => {
    queueSelectResult([]);

    await job.runTripAutoComplete();

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(notifyMany).not.toHaveBeenCalled();
  });

  it('skips notification when the per-trip UPDATE matches no row (status changed concurrently)', async () => {
    queueSelectResult(dueTrips);
    queueUpdateResult([]); // e.g. organizer cancelled the trip between the SELECT and this UPDATE

    await job.runTripAutoComplete();

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(notifyMany).not.toHaveBeenCalled();
  });

  it('skips notification for a trip with no confirmed participants', async () => {
    queueSelectResult(dueTrips);
    queueSelectResult([]);

    await job.runTripAutoComplete();

    expect(notifyMany).not.toHaveBeenCalled();
  });

  it('does not rethrow when notifyMany rejects (logging is covered by trip-completion.util.spec.ts)', async () => {
    queueSelectResult(dueTrips);
    queueSelectResult(participantRows);
    notifyMany.mockRejectedValue(new Error('notify failed'));

    await expect(job.runTripAutoComplete()).resolves.toBeUndefined();
  });

  it('logs error and does not rethrow on DB failure', async () => {
    mockSelect.mockImplementation(() => {
      throw new Error('DB error');
    });
    const loggerSpy = jest.spyOn(job['logger'], 'error').mockImplementation(() => undefined);

    await expect(job.runTripAutoComplete()).resolves.toBeUndefined();
    expect(loggerSpy).toHaveBeenCalledWith('Trip auto-complete job failed', expect.any(Error));
  });

  it('processes trips independently: one failing UPDATE does not block the next trip', async () => {
    queueSelectResult([
      { id: 'trip-1', name: 'Trip One' },
      { id: 'trip-2', name: 'Trip Two' },
    ]);
    queueUpdateResult([]); // trip-1 lost the race
    queueUpdateResult([{ id: 'trip-2' }]); // trip-2 completes normally
    queueSelectResult([{ userId: 'user-3' }]); // trip-2 participants

    await job.runTripAutoComplete();

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(notifyMany).toHaveBeenCalledTimes(1);
    expect(notifyMany).toHaveBeenCalledWith(
      ['user-3'],
      'TRIP_COMPLETED',
      { tripId: 'trip-2', tripName: 'Trip Two' },
      ['PUSH'],
    );
  });

  it('does not let one trip throwing abort the rest of the batch', async () => {
    queueSelectResult([
      { id: 'trip-1', name: 'Trip One' },
      { id: 'trip-2', name: 'Trip Two' },
    ]);
    mockUpdateReturning.mockRejectedValueOnce(new Error('transient DB error')); // trip-1's UPDATE throws
    queueUpdateResult([{ id: 'trip-2' }]); // trip-2 still gets processed
    queueSelectResult([{ userId: 'user-3' }]); // trip-2 participants
    const loggerSpy = jest.spyOn(job['logger'], 'error').mockImplementation(() => undefined);

    await expect(job.runTripAutoComplete()).resolves.toBeUndefined();

    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to auto-complete trip trip-1',
      expect.any(Error),
    );
    expect(notifyMany).toHaveBeenCalledWith(
      ['user-3'],
      'TRIP_COMPLETED',
      { tripId: 'trip-2', tripName: 'Trip Two' },
      ['PUSH'],
    );
  });
});
