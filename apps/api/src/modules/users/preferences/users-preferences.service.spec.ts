import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AppCurrency,
  AppLanguage,
  AppTheme,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersPreferencesService } from './users-preferences.service';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

const mockPreferences = {
  userId: 'user-uuid',
  language: AppLanguage.ES,
  currency: AppCurrency.COP,
  theme: AppTheme.SYSTEM,
  notificationOptOuts: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('UsersPreferencesService', () => {
  let service: UsersPreferencesService;
  let mockPrefFindFirst: jest.Mock;
  let mockReturning: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(async () => {
    mockPrefFindFirst = jest.fn();
    mockReturning = jest.fn();

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersPreferencesService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              userPreferences: { findFirst: mockPrefFindFirst },
            },
            update: mockUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<UsersPreferencesService>(UsersPreferencesService);
  });

  describe('getPreferences', () => {
    it('returns the mapped preferences when found', async () => {
      mockPrefFindFirst.mockResolvedValue(mockPreferences);

      const result = await service.getPreferences('user-uuid');

      expect(result).toEqual({
        language: AppLanguage.ES,
        currency: AppCurrency.COP,
        theme: AppTheme.SYSTEM,
      });
    });

    it('throws NotFoundException when preferences do not exist', async () => {
      mockPrefFindFirst.mockResolvedValue(undefined);

      await expect(service.getPreferences('unknown-uuid')).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockPrefFindFirst.mockRejectedValue(dbError);

      await expect(service.getPreferences('user-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('updatePreferences', () => {
    it('returns existing preferences unchanged when dto has no fields', async () => {
      mockPrefFindFirst.mockResolvedValue(mockPreferences);

      const result = await service.updatePreferences('user-uuid', {} as UpdateUserPreferencesDto);

      expect(result.language).toBe(AppLanguage.ES);
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('updates and returns the mapped preferences on success', async () => {
      mockPrefFindFirst.mockResolvedValue(mockPreferences);
      const updated = {
        ...mockPreferences,
        language: AppLanguage.EN,
        currency: AppCurrency.USD,
        theme: AppTheme.DARK,
      };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updatePreferences('user-uuid', {
        language: AppLanguage.EN,
        currency: AppCurrency.USD,
        theme: AppTheme.DARK,
      });

      expect(result.language).toBe(AppLanguage.EN);
      expect(result.currency).toBe(AppCurrency.USD);
      expect(result.theme).toBe(AppTheme.DARK);
    });

    it('throws NotFoundException when preferences do not exist', async () => {
      mockPrefFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updatePreferences('unknown-uuid', { theme: AppTheme.DARK }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when preferences deleted between check and update', async () => {
      mockPrefFindFirst.mockResolvedValue(mockPreferences);
      mockReturning.mockResolvedValue([]);

      await expect(
        service.updatePreferences('user-uuid', { theme: AppTheme.DARK }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors on the initial fetch', async () => {
      const dbError = new Error('connection lost');
      mockPrefFindFirst.mockRejectedValue(dbError);

      await expect(
        service.updatePreferences('user-uuid', { theme: AppTheme.DARK }),
      ).rejects.toThrow(dbError);
    });

    it('propagates unexpected database errors on the update', async () => {
      mockPrefFindFirst.mockResolvedValue(mockPreferences);
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(
        service.updatePreferences('user-uuid', { theme: AppTheme.DARK }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('getNotificationPreferences', () => {
    it('returns empty map when notificationOptOuts is null', async () => {
      mockPrefFindFirst.mockResolvedValue({ ...mockPreferences, notificationOptOuts: null });

      const result = await service.getNotificationPreferences('user-uuid');

      expect(result).toEqual({ optOuts: {} });
    });

    it('returns the stored map when channels are set', async () => {
      const channels = { [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH] };
      mockPrefFindFirst.mockResolvedValue({ ...mockPreferences, notificationOptOuts: channels });

      const result = await service.getNotificationPreferences('user-uuid');

      expect(result).toEqual({ optOuts: channels });
    });

    it('throws NotFoundException when preferences do not exist', async () => {
      mockPrefFindFirst.mockResolvedValue(undefined);

      await expect(service.getNotificationPreferences('unknown-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateNotificationPreferences', () => {
    it('updates and returns the sanitized preferences', async () => {
      const updated = {
        ...mockPreferences,
        notificationOptOuts: {
          [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.EMAIL],
        },
      };
      mockReturning.mockResolvedValue([updated]);

      const dto = {
        optOuts: {
          [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.EMAIL],
        },
      } as UpdateNotificationPreferencesDto;

      const result = await service.updateNotificationPreferences('user-uuid', dto);

      expect(result.optOuts).toEqual({
        [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.EMAIL],
      });
    });

    it('strips invalid notification types from the input', async () => {
      mockReturning.mockResolvedValue([{ ...mockPreferences, notificationOptOuts: {} }]);

      const dto = {
        optOuts: { INVALID_TYPE: [NotificationChannel.PUSH] },
      } as unknown as UpdateNotificationPreferencesDto;

      const result = await service.updateNotificationPreferences('user-uuid', dto);

      expect(result.optOuts).toEqual({});
    });

    it('strips invalid channel values from the input', async () => {
      mockReturning.mockResolvedValue([{ ...mockPreferences, notificationOptOuts: {} }]);

      const dto = {
        optOuts: { [NotificationType.GROUP_ANNOUNCEMENT]: ['INVALID_CHANNEL'] },
      } as unknown as UpdateNotificationPreferencesDto;

      const result = await service.updateNotificationPreferences('user-uuid', dto);

      expect(result.optOuts).toEqual({});
    });

    it('preserves valid channels when input contains a mix of valid and invalid', async () => {
      const sanitized = {
        [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH],
      };
      mockReturning.mockResolvedValue([{ ...mockPreferences, notificationOptOuts: sanitized }]);

      const dto = {
        optOuts: {
          [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH, 'INVALID_CHANNEL'],
        },
      } as unknown as UpdateNotificationPreferencesDto;

      const result = await service.updateNotificationPreferences('user-uuid', dto);

      expect(result.optOuts).toEqual({
        [NotificationType.GROUP_ANNOUNCEMENT]: [NotificationChannel.PUSH],
      });
    });

    it('throws NotFoundException when the user has no preferences row', async () => {
      mockReturning.mockResolvedValue([]);

      await expect(
        service.updateNotificationPreferences('unknown-uuid', {
          optOuts: {},
        } as UpdateNotificationPreferencesDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
