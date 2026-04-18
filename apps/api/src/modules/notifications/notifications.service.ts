import { Injectable } from '@nestjs/common';
import { PassportStatus } from '@chamuco/shared-types';

@Injectable()
export class NotificationsService {
  // TODO(Epic #8): implement FCM push via FirebaseAdminService.messaging()
  async sendPassportStatusNotification(
    _userId: string,
    _countryCode: string,
    _status: PassportStatus.EXPIRING_SOON | PassportStatus.EXPIRED,
  ): Promise<void> {}
}
