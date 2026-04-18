import { Test, TestingModule } from '@nestjs/testing';
import { PassportStatus } from '@chamuco/shared-types';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('sendPassportStatusNotification', () => {
    it('resolves without throwing', async () => {
      await expect(
        service.sendPassportStatusNotification('user-id-1', 'MX', PassportStatus.EXPIRING_SOON),
      ).resolves.toBeUndefined();
    });
  });
});
