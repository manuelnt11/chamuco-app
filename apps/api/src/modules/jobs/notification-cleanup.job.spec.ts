import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { NotificationCleanupJob } from './notification-cleanup.job';

describe('NotificationCleanupJob', () => {
  let job: NotificationCleanupJob;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;

  beforeEach(async () => {
    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCleanupJob,
        {
          provide: DRIZZLE_CLIENT,
          useValue: { delete: mockDelete },
        },
      ],
    }).compile();

    job = module.get<NotificationCleanupJob>(NotificationCleanupJob);
  });

  it('deletes read notifications older than 7 days', async () => {
    await job.runNotificationCleanup();

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
  });

  it('logs error and does not rethrow on DB failure', async () => {
    mockDelete.mockImplementation(() => {
      throw new Error('DB error');
    });
    const loggerSpy = jest.spyOn(job['logger'], 'error').mockImplementation(() => undefined);

    await expect(job.runNotificationCleanup()).resolves.toBeUndefined();
    expect(loggerSpy).toHaveBeenCalled();
  });
});
