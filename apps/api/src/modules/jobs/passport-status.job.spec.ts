import { Test, TestingModule } from '@nestjs/testing';
import { PassportStatus } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { PassportStatusJob } from './passport-status.job';

describe('PassportStatusJob', () => {
  let job: PassportStatusJob;
  let db: { execute: jest.Mock };
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    db = { execute: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassportStatusJob,
        { provide: DRIZZLE_CLIENT, useValue: db },
        {
          provide: NotificationsService,
          useValue: { sendPassportStatusNotification: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    job = module.get<PassportStatusJob>(PassportStatusJob);
    notificationsService = module.get(NotificationsService);
  });

  describe('runPassportStatusRefresh', () => {
    it('executes the bulk UPDATE SQL once', async () => {
      await job.runPassportStatusRefresh();
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it('sends notification for EXPIRING_SOON rows', async () => {
      db.execute.mockResolvedValue([
        { user_id: 'user-1', country_code: 'MX', passport_status: PassportStatus.EXPIRING_SOON },
      ]);

      await job.runPassportStatusRefresh();

      expect(notificationsService.sendPassportStatusNotification).toHaveBeenCalledWith(
        'user-1',
        'MX',
        PassportStatus.EXPIRING_SOON,
      );
    });

    it('sends notification for EXPIRED rows', async () => {
      db.execute.mockResolvedValue([
        { user_id: 'user-2', country_code: 'US', passport_status: PassportStatus.EXPIRED },
      ]);

      await job.runPassportStatusRefresh();

      expect(notificationsService.sendPassportStatusNotification).toHaveBeenCalledWith(
        'user-2',
        'US',
        PassportStatus.EXPIRED,
      );
    });

    it('does not send notification for ACTIVE rows', async () => {
      db.execute.mockResolvedValue([
        { user_id: 'user-3', country_code: 'ES', passport_status: PassportStatus.ACTIVE },
      ]);

      await job.runPassportStatusRefresh();

      expect(notificationsService.sendPassportStatusNotification).not.toHaveBeenCalled();
    });

    it('handles empty result without error', async () => {
      db.execute.mockResolvedValue([]);

      await expect(job.runPassportStatusRefresh()).resolves.toBeUndefined();
      expect(notificationsService.sendPassportStatusNotification).not.toHaveBeenCalled();
    });

    it('logs error and resolves when db.execute throws', async () => {
      db.execute.mockRejectedValue(new Error('DB unavailable'));
      const logSpy = jest.spyOn(job['logger'], 'error').mockImplementation(() => undefined);

      await expect(job.runPassportStatusRefresh()).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalledWith('Passport status refresh failed', expect.any(Error));
    });

    it('sends notifications in parallel for multiple changed rows', async () => {
      db.execute.mockResolvedValue([
        { user_id: 'user-1', country_code: 'MX', passport_status: PassportStatus.EXPIRING_SOON },
        { user_id: 'user-2', country_code: 'US', passport_status: PassportStatus.EXPIRED },
        { user_id: 'user-3', country_code: 'ES', passport_status: PassportStatus.ACTIVE },
      ]);

      await job.runPassportStatusRefresh();

      expect(notificationsService.sendPassportStatusNotification).toHaveBeenCalledTimes(2);
      expect(notificationsService.sendPassportStatusNotification).toHaveBeenCalledWith(
        'user-1',
        'MX',
        PassportStatus.EXPIRING_SOON,
      );
      expect(notificationsService.sendPassportStatusNotification).toHaveBeenCalledWith(
        'user-2',
        'US',
        PassportStatus.EXPIRED,
      );
    });
  });
});
