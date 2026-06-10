import { Test, TestingModule } from '@nestjs/testing';
import {
  AppCurrency,
  AppLanguage,
  AppTheme,
  AuthProvider,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { UsersPreferencesController } from './users-preferences.controller';
import { UsersPreferencesService } from './users-preferences.service';
import type { AuthenticatedUser } from '@/types/express';
import type { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';

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

const mockPreferencesResponse: UserPreferencesResponseDto = {
  language: AppLanguage.ES,
  currency: AppCurrency.COP,
  theme: AppTheme.SYSTEM,
};

const mockNotifPrefsResponse = {
  optOuts: {},
};

describe('UsersPreferencesController', () => {
  let controller: UsersPreferencesController;
  let mockGetPreferences: jest.Mock;
  let mockUpdatePreferences: jest.Mock;
  let mockGetNotificationPreferences: jest.Mock;
  let mockUpdateNotificationPreferences: jest.Mock;

  beforeEach(async () => {
    mockGetPreferences = jest.fn().mockResolvedValue(mockPreferencesResponse);
    mockUpdatePreferences = jest.fn().mockResolvedValue(mockPreferencesResponse);
    mockGetNotificationPreferences = jest.fn().mockResolvedValue(mockNotifPrefsResponse);
    mockUpdateNotificationPreferences = jest.fn().mockResolvedValue(mockNotifPrefsResponse);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersPreferencesController],
      providers: [
        {
          provide: UsersPreferencesService,
          useValue: {
            getPreferences: mockGetPreferences,
            updatePreferences: mockUpdatePreferences,
            getNotificationPreferences: mockGetNotificationPreferences,
            updateNotificationPreferences: mockUpdateNotificationPreferences,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersPreferencesController>(UsersPreferencesController);
  });

  describe('GET /v1/users/me/preferences', () => {
    it('delegates to UsersPreferencesService.getPreferences and returns the result', async () => {
      const result = await controller.getPreferences(mockAuthUser);

      expect(mockGetPreferences).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual(mockPreferencesResponse);
    });
  });

  describe('PATCH /v1/users/me/preferences', () => {
    it('delegates to UsersPreferencesService.updatePreferences and returns the result', async () => {
      const dto: UpdateUserPreferencesDto = { theme: AppTheme.DARK };
      const result = await controller.updatePreferences(mockAuthUser, dto);

      expect(mockUpdatePreferences).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(mockPreferencesResponse);
    });
  });

  describe('GET /v1/users/me/notification-preferences', () => {
    it('delegates to UsersPreferencesService.getNotificationPreferences and returns the result', async () => {
      const result = await controller.getNotificationPreferences(mockAuthUser);

      expect(mockGetNotificationPreferences).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual(mockNotifPrefsResponse);
    });
  });

  describe('PATCH /v1/users/me/notification-preferences', () => {
    it('delegates to UsersPreferencesService.updateNotificationPreferences and returns the result', async () => {
      const dto: UpdateNotificationPreferencesDto = { optOuts: {} };
      const result = await controller.updateNotificationPreferences(mockAuthUser, dto);

      expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(mockNotifPrefsResponse);
    });
  });
});
