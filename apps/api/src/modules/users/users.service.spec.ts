import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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
import type { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';
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
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
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

    it('updates timezone and returns the mapped response', async () => {
      const updated = { ...mockUser, timezone: 'America/Bogota' };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateMe(mockUser, { timezone: 'America/Bogota' });

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ timezone: 'America/Bogota' }));
      expect(result.timezone).toBe('America/Bogota');
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

  describe('getProfile', () => {
    it('returns the mapped profile response when found', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);

      const result = await service.getProfile('user-uuid');

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.homeCountry).toBe('CO');
      expect(result.phoneCountryCode).toBe('+57');
      expect(result.phoneLocalNumber).toBe('3001234567');
    });

    it('translates year_visible to yearVisible in the response', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);

      const result = await service.getProfile('user-uuid');

      expect(result.dateOfBirth).toEqual({ day: 1, month: 1, year: 1990, yearVisible: true });
      expect(result.dateOfBirth).not.toHaveProperty('year_visible');
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.getProfile('unknown-uuid')).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockProfileFindFirst.mockRejectedValue(dbError);

      await expect(service.getProfile('user-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('updateProfile', () => {
    it('returns existing profile unchanged when dto has no fields', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);

      const result = await service.updateProfile('user-uuid', {} as UpdateUserProfileDto);

      expect(result.firstName).toBe('John');
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('trims text fields and normalizes empty nullable fields to null', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, bio: null }]);

      await service.updateProfile('user-uuid', { bio: '   ' });

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ bio: null }));
    });

    it('stores dateOfBirth with year_visible key (not yearVisible)', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      const updatedDob = { day: 20, month: 6, year: 1995, year_visible: false };
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, dateOfBirth: updatedDob }]);

      await service.updateProfile('user-uuid', {
        dateOfBirth: { day: 20, month: 6, year: 1995, yearVisible: false },
      });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          dateOfBirth: { day: 20, month: 6, year: 1995, year_visible: false },
        }),
      );
    });

    it('updates all text fields and returns the mapped response', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      const updated = {
        ...mockHealthProfile,
        firstName: 'Jane',
        lastName: 'Smith',
        birthCity: 'Cali',
        homeCountry: 'US',
        homeCity: 'Miami',
        phoneCountryCode: '+1',
        phoneLocalNumber: '3055551234',
      };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateProfile('user-uuid', {
        firstName: 'Jane',
        lastName: 'Smith',
        birthCity: 'Cali',
        homeCountry: 'US',
        homeCity: 'Miami',
        phoneCountryCode: '+1',
        phoneLocalNumber: '3055551234',
      });

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.birthCity).toBe('Cali');
      expect(result.homeCountry).toBe('US');
      expect(result.homeCity).toBe('Miami');
      expect(result.phoneCountryCode).toBe('+1');
      expect(result.phoneLocalNumber).toBe('3055551234');
    });

    it('normalizes null birthCity and homeCity to null before saving', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, birthCity: null, homeCity: null }]);

      await service.updateProfile('user-uuid', { birthCity: null, homeCity: null });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ birthCity: null, homeCity: null }),
      );
    });

    it('sets birthCountry to null', async () => {
      mockProfileFindFirst.mockResolvedValue({ ...mockHealthProfile, birthCountry: 'US' });
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, birthCountry: null }]);

      const result = await service.updateProfile('user-uuid', { birthCountry: null });

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ birthCountry: null }));
      expect(result.birthCountry).toBeNull();
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.updateProfile('unknown-uuid', { firstName: 'Jane' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when profile is deleted between check and update', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      mockReturning.mockResolvedValue([]);

      await expect(service.updateProfile('user-uuid', { firstName: 'Jane' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors on the initial fetch', async () => {
      const dbError = new Error('connection lost');
      mockProfileFindFirst.mockRejectedValue(dbError);

      await expect(service.updateProfile('user-uuid', { firstName: 'Jane' })).rejects.toThrow(
        dbError,
      );
    });

    it('propagates unexpected database errors on the update', async () => {
      mockProfileFindFirst.mockResolvedValue(mockHealthProfile);
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(service.updateProfile('user-uuid', { firstName: 'Jane' })).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('getEmergencyContacts', () => {
    const contact: EmergencyContactDto = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: true,
    };

    it('returns the contacts array when found', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [contact],
      });

      const result = await service.getEmergencyContacts('user-uuid');

      expect(result).toEqual([contact]);
    });

    it('returns an empty array when emergencyContacts is empty', async () => {
      mockProfileFindFirst.mockResolvedValue({ ...mockHealthProfile, emergencyContacts: [] });

      const result = await service.getEmergencyContacts('user-uuid');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.getEmergencyContacts('unknown-uuid')).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockProfileFindFirst.mockRejectedValue(dbError);

      await expect(service.getEmergencyContacts('user-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('addEmergencyContact', () => {
    const existingPrimary: EmergencyContactDto = {
      id: 'existing-id-0001-0000-0000-000000000001',
      fullName: 'Carlos Ruiz',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3109876543',
      relationship: 'father',
      isPrimary: true,
    };
    const newContact: EmergencyContactDto = {
      id: 'new-uuid-0000-0000-0000-000000000002',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: false,
    };

    it('appends the contact and returns it', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [existingPrimary],
      });
      mockReturning.mockResolvedValue([
        { ...mockHealthProfile, emergencyContacts: [existingPrimary, newContact] },
      ]);

      const result = await service.addEmergencyContact('user-uuid', newContact);

      expect(result).toEqual(newContact);
    });

    it('unsets the current primary when new contact has isPrimary: true', async () => {
      const primaryContact: EmergencyContactDto = { ...newContact, isPrimary: true };
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [existingPrimary],
      });
      const savedContacts = [{ ...existingPrimary, isPrimary: false }, primaryContact];
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, emergencyContacts: savedContacts }]);

      await service.addEmergencyContact('user-uuid', primaryContact);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: expect.arrayContaining([
            expect.objectContaining({ id: existingPrimary.id, isPrimary: false }),
          ]),
        }),
      );
    });

    it('does not touch existing primaries when isPrimary is false', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [existingPrimary],
      });
      mockReturning.mockResolvedValue([
        { ...mockHealthProfile, emergencyContacts: [existingPrimary, newContact] },
      ]);

      await service.addEmergencyContact('user-uuid', newContact);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: expect.arrayContaining([
            expect.objectContaining({ id: existingPrimary.id, isPrimary: true }),
          ]),
        }),
      );
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.addEmergencyContact('unknown-uuid', newContact)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the profile is deleted between check and insert', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [existingPrimary],
      });
      mockReturning.mockResolvedValue([]);

      await expect(service.addEmergencyContact('user-uuid', newContact)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [existingPrimary],
      });
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(service.addEmergencyContact('user-uuid', newContact)).rejects.toThrow(dbError);
    });
  });

  describe('updateEmergencyContact', () => {
    const contactA: EmergencyContactDto = {
      id: 'contact-a-0000-0000-0000-000000000001',
      fullName: 'Carlos Ruiz',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3109876543',
      relationship: 'father',
      isPrimary: true,
    };
    const contactB: EmergencyContactDto = {
      id: 'contact-b-0000-0000-0000-000000000002',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: false,
    };

    it('updates the specified fields and returns the updated contact', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [contactA, contactB],
      });
      const updated = { ...contactB, fullName: 'María González', relationship: 'sister' };
      mockReturning.mockResolvedValue([
        { ...mockHealthProfile, emergencyContacts: [contactA, updated] },
      ]);

      const result = await service.updateEmergencyContact('user-uuid', contactB.id, {
        fullName: 'María González',
        relationship: 'sister',
      } as UpdateEmergencyContactDto);

      expect(result.fullName).toBe('María González');
      expect(result.relationship).toBe('sister');
    });

    it('unsets other primaries when isPrimary: true', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [contactA, contactB],
      });
      const savedContacts = [
        { ...contactA, isPrimary: false },
        { ...contactB, isPrimary: true },
      ];
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, emergencyContacts: savedContacts }]);

      await service.updateEmergencyContact('user-uuid', contactB.id, { isPrimary: true });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: expect.arrayContaining([
            expect.objectContaining({ id: contactA.id, isPrimary: false }),
            expect.objectContaining({ id: contactB.id, isPrimary: true }),
          ]),
        }),
      );
    });

    it('does not touch primaries when isPrimary is not in the dto', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [contactA, contactB],
      });
      const saved = [contactA, { ...contactB, fullName: 'Ana' }];
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, emergencyContacts: saved }]);

      await service.updateEmergencyContact('user-uuid', contactB.id, { fullName: 'Ana' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: expect.arrayContaining([
            expect.objectContaining({ id: contactA.id, isPrimary: true }),
          ]),
        }),
      );
    });

    it('throws BadRequestException when isPrimary is explicitly set to false', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [contactA, contactB],
      });

      await expect(
        service.updateEmergencyContact('user-uuid', contactA.id, { isPrimary: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when contact id is not found', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [contactA],
      });

      await expect(
        service.updateEmergencyContact('user-uuid', 'nonexistent-id', { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateEmergencyContact('unknown-uuid', contactA.id, { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the profile is deleted between check and update', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [contactA],
      });
      mockReturning.mockResolvedValue([]);

      await expect(
        service.updateEmergencyContact('user-uuid', contactA.id, { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [contactA],
      });
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(
        service.updateEmergencyContact('user-uuid', contactA.id, { fullName: 'X' }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('deleteEmergencyContact', () => {
    const primaryContact: EmergencyContactDto = {
      id: 'primary-id-0000-0000-0000-000000000001',
      fullName: 'Carlos Ruiz',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3109876543',
      relationship: 'father',
      isPrimary: true,
    };
    const secondaryContact: EmergencyContactDto = {
      id: 'secondary-id-0000-0000-0000-00000000002',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: false,
    };

    it('deletes the contact and saves the remaining contacts', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [primaryContact, secondaryContact],
      });

      await service.deleteEmergencyContact('user-uuid', secondaryContact.id);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: [primaryContact],
        }),
      );
    });

    it('throws ConflictException when deleting the primary with other contacts remaining', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [primaryContact, secondaryContact],
      });

      await expect(service.deleteEmergencyContact('user-uuid', primaryContact.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows deleting the primary when it is the only contact', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [primaryContact],
      });

      await service.deleteEmergencyContact('user-uuid', primaryContact.id);

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ emergencyContacts: [] }));
    });

    it('throws NotFoundException when the contact id is not found', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [primaryContact],
      });

      await expect(service.deleteEmergencyContact('user-uuid', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        emergencyContacts: [primaryContact, secondaryContact],
      });
      const dbError = new Error('update failed');
      mockSet.mockReturnValue({ where: jest.fn().mockRejectedValue(dbError) });

      await expect(
        service.deleteEmergencyContact('user-uuid', secondaryContact.id),
      ).rejects.toThrow(dbError);
    });
  });
});
