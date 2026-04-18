import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AppCurrency,
  AppLanguage,
  AppTheme,
  AuthProvider,
  DietaryPreference,
  FoodAllergen,
  PlatformRole,
} from '@chamuco/shared-types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';
import type { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import type { UserProfileResponseDto } from './dto/user-profile-response.dto';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

// mockUser is the expected shape after getMe strips firebaseUid
const { firebaseUid: _, ...mockUser } = mockAuthUser;

const mockPreferencesResponse: UserPreferencesResponseDto = {
  language: AppLanguage.ES,
  currency: AppCurrency.COP,
  theme: AppTheme.SYSTEM,
};

const mockHealthResponse: UserHealthResponseDto = {
  dietaryPreference: DietaryPreference.OMNIVORE,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
};

const mockProfileResponse: UserProfileResponseDto = {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: { day: 1, month: 1, year: 1990, yearVisible: true },
  birthCountry: null,
  birthCity: null,
  homeCountry: 'CO',
  homeCity: null,
  phoneNumber: '+573001234567',
  bio: null,
};

describe('UsersController', () => {
  let controller: UsersController;
  let mockFindByFirebaseUid: jest.Mock;
  let mockCheckUsernameAvailability: jest.Mock;
  let mockUpdateMe: jest.Mock;
  let mockGetHealth: jest.Mock;
  let mockUpdateHealth: jest.Mock;
  let mockGetPreferences: jest.Mock;
  let mockUpdatePreferences: jest.Mock;
  let mockGetProfile: jest.Mock;
  let mockUpdateProfile: jest.Mock;

  beforeEach(async () => {
    mockFindByFirebaseUid = jest.fn().mockResolvedValue(mockUser);
    mockCheckUsernameAvailability = jest
      .fn()
      .mockResolvedValue({ available: true, username: 'john_doe' });
    mockUpdateMe = jest.fn().mockResolvedValue(mockUser);
    mockGetHealth = jest.fn().mockResolvedValue(mockHealthResponse);
    mockUpdateHealth = jest.fn().mockResolvedValue(mockHealthResponse);
    mockGetPreferences = jest.fn().mockResolvedValue(mockPreferencesResponse);
    mockUpdatePreferences = jest.fn().mockResolvedValue(mockPreferencesResponse);
    mockGetProfile = jest.fn().mockResolvedValue(mockProfileResponse);
    mockUpdateProfile = jest.fn().mockResolvedValue(mockProfileResponse);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findByFirebaseUid: mockFindByFirebaseUid,
            checkUsernameAvailability: mockCheckUsernameAvailability,
            updateMe: mockUpdateMe,
            getHealth: mockGetHealth,
            updateHealth: mockUpdateHealth,
            getPreferences: mockGetPreferences,
            updatePreferences: mockUpdatePreferences,
            getProfile: mockGetProfile,
            updateProfile: mockUpdateProfile,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('GET /v1/users/me', () => {
    it('returns the authenticated user without the firebaseUid field', () => {
      const result = controller.getMe(mockAuthUser);

      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('firebaseUid');
      // Must NOT call the service — the user is already in request.user from the guard
      expect(mockFindByFirebaseUid).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/users/username-available', () => {
    it('delegates to UsersService and returns the availability result', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({ available: true, username: 'john_doe' });

      const result = await controller.checkUsernameAvailability('john_doe');

      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('john_doe');
      expect(result).toEqual({ available: true, username: 'john_doe' });
    });

    it('normalizes the username to lowercase before delegating', async () => {
      await controller.checkUsernameAvailability('John_Doe');

      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith('john_doe');
    });

    it('returns available: false when the username is taken', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({ available: false, username: 'taken_user' });

      const result = await controller.checkUsernameAvailability('taken_user');

      expect(result).toEqual({ available: false, username: 'taken_user' });
    });

    it('throws BadRequestException for a username that is too short', () => {
      expect(() => controller.checkUsernameAvailability('ab')).toThrow(BadRequestException);
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for a username that is too long', () => {
      expect(() => controller.checkUsernameAvailability('a'.repeat(31))).toThrow(
        BadRequestException,
      );
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for a username with disallowed characters', () => {
      expect(() => controller.checkUsernameAvailability('john doe')).toThrow(BadRequestException);
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the username query param is absent', () => {
      // @Query returns undefined when the param is missing
      expect(() => controller.checkUsernameAvailability(undefined as unknown as string)).toThrow(
        BadRequestException,
      );
      expect(mockCheckUsernameAvailability).not.toHaveBeenCalled();
    });
  });

  describe('GET /v1/users/me/health', () => {
    it('delegates to usersService.getHealth with the authenticated user id', async () => {
      const result = await controller.getHealthProfile(mockAuthUser);

      expect(mockGetHealth).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual(mockHealthResponse);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetHealth.mockRejectedValue(new NotFoundException());

      await expect(controller.getHealthProfile(mockAuthUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /v1/users/me', () => {
    it('delegates to usersService.updateMe with the authenticated user and dto', async () => {
      const dto: UpdateUserDto = { displayName: 'Jane Doe' };
      const updated = { ...mockUser, displayName: 'Jane Doe' };
      mockUpdateMe.mockResolvedValue(updated);

      const result = await controller.updateMe(mockAuthUser, dto);

      expect(mockUpdateMe).toHaveBeenCalledWith(mockAuthUser, dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateMe.mockRejectedValue(new NotFoundException());

      await expect(controller.updateMe(mockAuthUser, {} as UpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /v1/users/me/health', () => {
    it('delegates to usersService.updateHealth with the user id and dto', async () => {
      const dto: UpdateUserHealthDto = {
        dietaryPreference: DietaryPreference.VEGAN,
        foodAllergies: [{ allergen: FoodAllergen.GLUTEN, description: null }],
      };
      const updated: UserHealthResponseDto = {
        ...mockHealthResponse,
        dietaryPreference: DietaryPreference.VEGAN,
        foodAllergies: [{ allergen: FoodAllergen.GLUTEN, description: null }],
      };
      mockUpdateHealth.mockResolvedValue(updated);

      const result = await controller.updateHealthProfile(mockAuthUser, dto);

      expect(mockUpdateHealth).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateHealth.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateHealthProfile(mockAuthUser, {} as UpdateUserHealthDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /v1/users/me/preferences', () => {
    it('delegates to usersService.getPreferences with the authenticated user id', async () => {
      const result = await controller.getPreferences(mockAuthUser);

      expect(mockGetPreferences).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual(mockPreferencesResponse);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetPreferences.mockRejectedValue(new NotFoundException());

      await expect(controller.getPreferences(mockAuthUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /v1/users/me/preferences', () => {
    it('delegates to usersService.updatePreferences with the user id and dto', async () => {
      const dto: UpdateUserPreferencesDto = { theme: AppTheme.DARK };
      const updated: UserPreferencesResponseDto = {
        ...mockPreferencesResponse,
        theme: AppTheme.DARK,
      };
      mockUpdatePreferences.mockResolvedValue(updated);

      const result = await controller.updatePreferences(mockAuthUser, dto);

      expect(mockUpdatePreferences).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdatePreferences.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updatePreferences(mockAuthUser, {} as UpdateUserPreferencesDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /v1/users/me/profile', () => {
    it('delegates to usersService.getProfile with the authenticated user id', async () => {
      const result = await controller.getProfile(mockAuthUser);

      expect(mockGetProfile).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual(mockProfileResponse);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetProfile.mockRejectedValue(new NotFoundException());

      await expect(controller.getProfile(mockAuthUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /v1/users/me/profile', () => {
    it('delegates to usersService.updateProfile with the user id and dto', async () => {
      const dto: UpdateUserProfileDto = { firstName: 'Jane' };
      const updated: UserProfileResponseDto = { ...mockProfileResponse, firstName: 'Jane' };
      mockUpdateProfile.mockResolvedValue(updated);

      const result = await controller.updateProfile(mockAuthUser, dto);

      expect(mockUpdateProfile).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateProfile.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateProfile(mockAuthUser, {} as UpdateUserProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
