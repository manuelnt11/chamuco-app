import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AppCurrency,
  AppLanguage,
  AppTheme,
  AuthProvider,
  DietaryPreference,
  FoodAllergen,
  MedicalConditionType,
  PhobiaType,
  PhysicalLimitationType,
  PlatformRole,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersService } from './users.service';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';
import type { AuthenticatedUser } from '@/types/express';

const mockPreferences = {
  userId: 'user-uuid',
  language: AppLanguage.ES,
  currency: AppCurrency.COP,
  theme: AppTheme.SYSTEM,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockHealthProfile = {
  userId: 'user-uuid',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: { day: 1, month: 1, year: 1990, year_visible: true },
  birthCountry: null,
  birthCity: null,
  homeCountry: 'CO',
  homeCity: null,
  phoneNumber: '+573001234567',
  bio: null,
  dietaryPreference: DietaryPreference.OMNIVORE,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
  emergencyContacts: [],
  loyaltyPrograms: [],
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockUser: AuthenticatedUser = {
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
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let mockFindFirst: jest.Mock;
  let mockProfileFindFirst: jest.Mock;
  let mockPrefFindFirst: jest.Mock;
  let mockReturning: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(async () => {
    mockFindFirst = jest.fn();
    mockProfileFindFirst = jest.fn();
    mockPrefFindFirst = jest.fn();
    mockReturning = jest.fn();

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              users: { findFirst: mockFindFirst },
              userProfiles: { findFirst: mockProfileFindFirst },
              userPreferences: { findFirst: mockPrefFindFirst },
            },
            update: mockUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByFirebaseUid', () => {
    it('returns the user when found', async () => {
      mockFindFirst.mockResolvedValue(mockUser);

      const result = await service.findByFirebaseUid('firebase-uid-123');

      expect(result).toEqual(mockUser);
      expect(mockFindFirst).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when no user matches the firebaseUid', async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(service.findByFirebaseUid('unknown-uid')).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockFindFirst.mockRejectedValue(dbError);

      await expect(service.findByFirebaseUid('firebase-uid-123')).rejects.toThrow(dbError);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('returns available: true when no user has that username', async () => {
      mockFindFirst.mockResolvedValue(undefined);

      const result = await service.checkUsernameAvailability('free_name');

      expect(result).toEqual({ available: true, username: 'free_name' });
    });

    it('returns available: false when the username is already taken', async () => {
      mockFindFirst.mockResolvedValue(mockUser);

      const result = await service.checkUsernameAvailability('john_doe');

      expect(result).toEqual({ available: false, username: 'john_doe' });
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockFindFirst.mockRejectedValue(dbError);

      await expect(service.checkUsernameAvailability('some_user')).rejects.toThrow(dbError);
    });
  });

  describe('updateMe', () => {
    it('returns existing user unchanged when dto has no fields', async () => {
      const result = await service.updateMe(mockUser, {} as UpdateUserDto);

      expect(result.displayName).toBe('John Doe');
      expect(result).not.toHaveProperty('firebaseUid');
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('updates and returns the mapped response on success', async () => {
      const updated = {
        ...mockUser,
        displayName: 'Jane Doe',
        avatarUrl: 'https://example.com/a.jpg',
      };
      mockReturning.mockResolvedValue([updated]);

      const dto: UpdateUserDto = {
        displayName: 'Jane Doe',
        avatarUrl: 'https://example.com/a.jpg',
      };
      const result = await service.updateMe(mockUser, dto);

      expect(result.displayName).toBe('Jane Doe');
      expect(result.avatarUrl).toBe('https://example.com/a.jpg');
      expect(result).not.toHaveProperty('firebaseUid');
    });

    it('normalizes empty and whitespace-only avatarUrl to null before saving', async () => {
      mockReturning.mockResolvedValue([{ ...mockUser, avatarUrl: null }]);

      await service.updateMe(mockUser, { avatarUrl: '' });

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: null }));
    });

    it('throws NotFoundException when user is deleted between check and update', async () => {
      mockReturning.mockResolvedValue([]);

      await expect(service.updateMe(mockUser, { displayName: 'Jane' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(service.updateMe(mockUser, { displayName: 'Jane' })).rejects.toThrow(dbError);
    });
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
      const updated = { ...mockPreferences, theme: AppTheme.DARK };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updatePreferences('user-uuid', { theme: AppTheme.DARK });

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

  describe('getHealth', () => {
    it('returns the mapped health response when the profile is found', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);

      const result = await service.getHealth('user-uuid');

      const expected: UserHealthResponseDto = {
        dietaryPreference: DietaryPreference.OMNIVORE,
        dietaryNotes: null,
        generalMedicalNotes: null,
        foodAllergies: [],
        phobias: [],
        physicalLimitations: [],
        medicalConditions: [],
      };
      expect(result).toEqual(expected);
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.getHealth('unknown-uuid')).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockProfileFindFirst.mockRejectedValue(dbError);

      await expect(service.getHealth('user-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('updateHealth', () => {
    it('returns current data without a DB write when the dto has no fields', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);

      const result = await service.updateHealth('user-uuid', {} as UpdateUserHealthDto);

      expect(result.dietaryPreference).toBe(DietaryPreference.OMNIVORE);
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('normalizes empty and whitespace-only text fields to null before saving', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      mockReturning.mockResolvedValue([
        { ...mockHealthProfile, dietaryNotes: null, generalMedicalNotes: null },
      ]);

      await service.updateHealth('user-uuid', { dietaryNotes: '', generalMedicalNotes: '   ' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ dietaryNotes: null, generalMedicalNotes: null }),
      );
    });

    it('updates and returns the mapped health response on success', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      const updated = {
        ...mockHealthProfile,
        dietaryPreference: DietaryPreference.VEGAN,
        foodAllergies: [{ allergen: FoodAllergen.GLUTEN, description: null }],
      };
      mockReturning.mockResolvedValue([updated]);

      const dto: UpdateUserHealthDto = {
        dietaryPreference: DietaryPreference.VEGAN,
        foodAllergies: [{ allergen: FoodAllergen.GLUTEN, description: null }],
      };
      const result = await service.updateHealth('user-uuid', dto);

      expect(result.dietaryPreference).toBe(DietaryPreference.VEGAN);
      expect(result.foodAllergies).toEqual([{ allergen: FoodAllergen.GLUTEN, description: null }]);
    });

    it('updates multiple fields including nested arrays', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      const updated = {
        ...mockHealthProfile,
        phobias: [{ phobia: PhobiaType.HEIGHTS, description: null }],
        physicalLimitations: [
          { limitation: PhysicalLimitationType.WHEELCHAIR_USER, description: null },
        ],
        medicalConditions: [{ condition: MedicalConditionType.DIABETES, description: null }],
      };
      mockReturning.mockResolvedValue([updated]);

      const dto: UpdateUserHealthDto = {
        phobias: [{ phobia: PhobiaType.HEIGHTS, description: null }],
        physicalLimitations: [
          { limitation: PhysicalLimitationType.WHEELCHAIR_USER, description: null },
        ],
        medicalConditions: [{ condition: MedicalConditionType.DIABETES, description: null }],
      };
      const result = await service.updateHealth('user-uuid', dto);

      expect(result.phobias).toEqual([{ phobia: PhobiaType.HEIGHTS, description: null }]);
      expect(result.physicalLimitations).toEqual([
        { limitation: PhysicalLimitationType.WHEELCHAIR_USER, description: null },
      ]);
      expect(result.medicalConditions).toEqual([
        { condition: MedicalConditionType.DIABETES, description: null },
      ]);
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateHealth('unknown-uuid', { dietaryPreference: DietaryPreference.VEGAN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors on the initial fetch', async () => {
      const dbError = new Error('connection lost');
      mockProfileFindFirst.mockRejectedValue(dbError);

      await expect(
        service.updateHealth('user-uuid', { dietaryPreference: DietaryPreference.VEGAN }),
      ).rejects.toThrow(dbError);
    });

    it('throws NotFoundException when the profile is deleted between check and update', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      mockReturning.mockResolvedValue([]);

      await expect(
        service.updateHealth('user-uuid', { dietaryPreference: DietaryPreference.VEGAN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors on the update', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(
        service.updateHealth('user-uuid', { dietaryPreference: DietaryPreference.VEGAN }),
      ).rejects.toThrow(dbError);
    });
  });
});
