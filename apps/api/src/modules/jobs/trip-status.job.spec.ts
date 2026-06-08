import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { TripStatusJob } from './trip-status.job';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

describe('TripStatusJob', () => {
  let job: TripStatusJob;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(async () => {
    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripStatusJob,
        {
          provide: DRIZZLE_CLIENT,
          useValue: { update: mockUpdate },
        },
      ],
    }).compile();

    job = module.get<TripStatusJob>(TripStatusJob);
  });

  it('runs bulk update for IN_PROGRESS trips past end_date', async () => {
    await job.runTripAutoComplete();

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledTimes(1);
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1);
  });

  it('logs error and does not rethrow on DB failure', async () => {
    mockUpdate.mockImplementation(() => {
      throw new Error('DB error');
    });
    const loggerSpy = jest.spyOn(job['logger'], 'error').mockImplementation(() => undefined);

    await expect(job.runTripAutoComplete()).resolves.toBeUndefined();
    expect(loggerSpy).toHaveBeenCalled();
  });
});
