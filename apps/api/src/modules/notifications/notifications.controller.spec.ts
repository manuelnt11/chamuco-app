import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  NotificationType,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import type { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'john_doe',
  displayName: 'John Doe',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const FAKE_NOTIFICATION_ROW = {
  id: 'notif-uuid',
  userId: 'user-uuid',
  type: NotificationType.TRIP_INVITATION,
  title: 'New trip invitation',
  body: 'You have been invited to join Summer Trip 2026.',
  data: { tripId: 'trip-uuid' },
  readAt: null,
  createdAt: NOW,
};

const FAKE_NOTIFICATION_DTO = {
  id: 'notif-uuid',
  type: NotificationType.TRIP_INVITATION,
  title: 'New trip invitation',
  body: 'You have been invited to join Summer Trip 2026.',
  data: { tripId: 'trip-uuid' },
  readAt: null,
  createdAt: NOW.toISOString(),
};

let mockFindAll: jest.Mock;
let mockCountUnread: jest.Mock;
let mockMarkRead: jest.Mock;
let mockMarkAllRead: jest.Mock;
let mockRegisterToken: jest.Mock;
let mockDeleteToken: jest.Mock;

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    mockFindAll = jest.fn().mockResolvedValue({ items: [FAKE_NOTIFICATION_ROW], nextCursor: null });
    mockCountUnread = jest.fn().mockResolvedValue(1);
    mockMarkRead = jest.fn().mockResolvedValue(undefined);
    mockMarkAllRead = jest.fn().mockResolvedValue(undefined);
    mockRegisterToken = jest.fn().mockResolvedValue(undefined);
    mockDeleteToken = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            findAll: mockFindAll,
            countUnread: mockCountUnread,
            markRead: mockMarkRead,
            markAllRead: mockMarkAllRead,
            registerToken: mockRegisterToken,
            deleteToken: mockDeleteToken,
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  describe('GET /v1/notifications', () => {
    it('returns a NotificationsPageDto with mapped data, nextCursor, and unreadCount', async () => {
      const query: GetNotificationsQueryDto = { limit: 20 };

      const result = await controller.getNotifications(mockAuthUser, query);

      expect(result).toEqual({
        data: [FAKE_NOTIFICATION_DTO],
        nextCursor: null,
        unreadCount: 1,
      });
    });

    it('passes cursor and limit to findAll', async () => {
      const query: GetNotificationsQueryDto = {
        cursor: '2026-01-01T00:00:00.000Z',
        limit: 10,
      };

      await controller.getNotifications(mockAuthUser, query);

      expect(mockFindAll).toHaveBeenCalledWith('user-uuid', '2026-01-01T00:00:00.000Z', 10);
    });

    it('passes userId to countUnread', async () => {
      await controller.getNotifications(mockAuthUser, { limit: 20 });

      expect(mockCountUnread).toHaveBeenCalledWith('user-uuid');
    });

    it('returns nextCursor when service indicates more pages exist', async () => {
      mockFindAll.mockResolvedValue({
        items: [FAKE_NOTIFICATION_ROW],
        nextCursor: '2025-12-31T00:00:00.000Z',
      });

      const result = await controller.getNotifications(mockAuthUser, { limit: 1 });

      expect(result.nextCursor).toBe('2025-12-31T00:00:00.000Z');
    });

    it('returns an empty data array when there are no notifications', async () => {
      mockFindAll.mockResolvedValue({ items: [], nextCursor: null });
      mockCountUnread.mockResolvedValue(0);

      const result = await controller.getNotifications(mockAuthUser, { limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.unreadCount).toBe(0);
    });
  });

  describe('PATCH /v1/notifications/read-all', () => {
    it('delegates to markAllRead with the current user id', async () => {
      await controller.markAllRead(mockAuthUser);

      expect(mockMarkAllRead).toHaveBeenCalledWith('user-uuid');
    });

    it('returns undefined', async () => {
      const result = await controller.markAllRead(mockAuthUser);

      expect(result).toBeUndefined();
    });
  });

  describe('PATCH /v1/notifications/:id/read', () => {
    it('delegates to markRead with user id and notification id', async () => {
      await controller.markRead(mockAuthUser, 'notif-uuid');

      expect(mockMarkRead).toHaveBeenCalledWith('user-uuid', 'notif-uuid');
    });

    it('returns undefined', async () => {
      const result = await controller.markRead(mockAuthUser, 'notif-uuid');

      expect(result).toBeUndefined();
    });
  });

  describe('POST /v1/notifications/fcm-token', () => {
    it('delegates to registerToken with user id and dto', async () => {
      await controller.registerFcmToken(mockAuthUser, { token: 'tok-abc', deviceHint: 'Chrome' });

      expect(mockRegisterToken).toHaveBeenCalledWith('user-uuid', {
        token: 'tok-abc',
        deviceHint: 'Chrome',
      });
    });

    it('delegates to registerToken without deviceHint', async () => {
      await controller.registerFcmToken(mockAuthUser, { token: 'tok-abc' });

      expect(mockRegisterToken).toHaveBeenCalledWith('user-uuid', { token: 'tok-abc' });
    });

    it('returns undefined', async () => {
      const result = await controller.registerFcmToken(mockAuthUser, { token: 'tok-abc' });

      expect(result).toBeUndefined();
    });
  });

  describe('DELETE /v1/notifications/fcm-token', () => {
    it('delegates to deleteToken with user id and dto', async () => {
      await controller.deleteFcmToken(mockAuthUser, { token: 'tok-abc' });

      expect(mockDeleteToken).toHaveBeenCalledWith('user-uuid', { token: 'tok-abc' });
    });

    it('returns undefined', async () => {
      const result = await controller.deleteFcmToken(mockAuthUser, { token: 'tok-abc' });

      expect(result).toBeUndefined();
    });
  });
});
