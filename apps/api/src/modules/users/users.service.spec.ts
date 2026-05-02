import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AppCurrency,
  AppLanguage,
  AppTheme,
  AuthProvider,
  DietaryPreference,
  DocumentStatus,
  EtaType,
  FoodAllergen,
  MedicalConditionType,
  PassportStatus,
  PhobiaType,
  PhysicalLimitationType,
  PlatformRole,
  ProfileVisibility,
  VisaCoverageType,
  VisaEntries,
  VisaType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersService } from './users.service';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import type { CreateNationalityDto, UpdateNationalityDto } from './dto/nationality.dto';
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
  profileVisibility: ProfileVisibility.PRIVATE,
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
  let mockNationalitiesFindFirst: jest.Mock;
  let mockNationalitiesFindMany: jest.Mock;
  let mockVisasFindFirst: jest.Mock;
  let mockVisasFindMany: jest.Mock;
  let mockEtasFindFirst: jest.Mock;
  let mockEtasFindMany: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockDeleteWhere: jest.Mock;

  beforeEach(async () => {
    mockFindFirst = jest.fn();
    mockProfileFindFirst = jest.fn();
    mockPrefFindFirst = jest.fn();
    mockReturning = jest.fn();
    mockNationalitiesFindFirst = jest.fn();
    mockNationalitiesFindMany = jest.fn();
    mockVisasFindFirst = jest.fn();
    mockVisasFindMany = jest.fn();
    mockEtasFindFirst = jest.fn();
    mockEtasFindMany = jest.fn();
    mockInsertReturning = jest.fn();
    mockDeleteWhere = jest.fn();

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
    const mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning });
    const mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });
    const mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

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
              userNationalities: {
                findFirst: mockNationalitiesFindFirst,
                findMany: mockNationalitiesFindMany,
              },
              userVisas: {
                findFirst: mockVisasFindFirst,
                findMany: mockVisasFindMany,
              },
              userEtas: {
                findFirst: mockEtasFindFirst,
                findMany: mockEtasFindMany,
              },
            },
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            transaction: jest
              .fn()
              .mockImplementation(async (callback: (trx: unknown) => Promise<unknown>) =>
                callback({ update: mockUpdate, insert: mockInsert, delete: mockDelete }),
              ),
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

    it('returns profileVisibility in the response when dto has no fields', async () => {
      const result = await service.updateMe(mockUser, {});

      expect(result.profileVisibility).toBe(ProfileVisibility.PRIVATE);
    });

    it('updates profileVisibility and returns it in the response', async () => {
      const updated = { ...mockUser, profileVisibility: ProfileVisibility.PUBLIC };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateMe(mockUser, {
        profileVisibility: ProfileVisibility.PUBLIC,
      });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ profileVisibility: ProfileVisibility.PUBLIC }),
      );
      expect(result.profileVisibility).toBe(ProfileVisibility.PUBLIC);
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

  describe('getNationalities', () => {
    const mockNationality = {
      id: 'nat-uuid',
      userId: 'user-uuid',
      countryCode: 'CO',
      isPrimary: true,
      nationalIdNumber: null,
      passportNumber: null,
      passportIssueDate: null,
      passportExpiryDate: null,
      passportStatus: PassportStatus.OMITTED,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('returns mapped nationalities array', async () => {
      mockNationalitiesFindMany.mockResolvedValue([mockNationality]);

      const result = await service.getNationalities('user-uuid');

      expect(result).toEqual([
        {
          id: mockNationality.id,
          countryCode: mockNationality.countryCode,
          isPrimary: mockNationality.isPrimary,
          nationalIdNumber: null,
          passportNumber: null,
          passportIssueDate: null,
          passportExpiryDate: null,
          passportStatus: PassportStatus.OMITTED,
        },
      ]);
    });

    it('returns empty array when user has no nationalities', async () => {
      mockNationalitiesFindMany.mockResolvedValue([]);

      const result = await service.getNationalities('user-uuid');

      expect(result).toEqual([]);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockNationalitiesFindMany.mockRejectedValue(dbError);

      await expect(service.getNationalities('user-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('addNationality', () => {
    const mockNationality = {
      id: 'nat-uuid',
      userId: 'user-uuid',
      countryCode: 'CO',
      isPrimary: false,
      nationalIdNumber: null,
      passportNumber: null,
      passportIssueDate: null,
      passportExpiryDate: null,
      passportStatus: PassportStatus.OMITTED,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('inserts and returns the new nationality', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([mockNationality]);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      const result = await service.addNationality('user-uuid', dto);

      expect(result).toEqual(expect.objectContaining({ countryCode: 'CO', isPrimary: false }));
      expect(mockInsertReturning).toHaveBeenCalledTimes(1);
    });

    it('demotes current primary when isPrimary is true', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([{ ...mockNationality, isPrimary: true }]);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: true };
      await service.addNationality('user-uuid', dto);

      expect(mockSet).toHaveBeenCalledWith({ isPrimary: false });
    });

    it('does not call demote update when isPrimary is false', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([mockNationality]);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      await service.addNationality('user-uuid', dto);

      expect(mockSet).not.toHaveBeenCalled();
    });

    it('throws ConflictException on duplicate countryCode', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      await expect(service.addNationality('user-uuid', dto)).rejects.toThrow(ConflictException);
    });

    it('computes passportStatus ACTIVE for a far-future expiry date', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([
        {
          ...mockNationality,
          passportExpiryDate: '2035-01-15',
          passportStatus: PassportStatus.ACTIVE,
        },
      ]);

      const dto: CreateNationalityDto = {
        countryCode: 'CO',
        isPrimary: false,
        passportNumber: 'AB123456',
        passportIssueDate: '2020-01-15',
        passportExpiryDate: '2035-01-15',
      };
      const result = await service.addNationality('user-uuid', dto);

      expect(result.passportStatus).toBe(PassportStatus.ACTIVE);
    });

    it('computes passportStatus EXPIRED for a past expiry date', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([
        {
          ...mockNationality,
          passportExpiryDate: '2000-01-01',
          passportStatus: PassportStatus.EXPIRED,
        },
      ]);

      const dto: CreateNationalityDto = {
        countryCode: 'CO',
        isPrimary: false,
        passportNumber: 'AB123456',
        passportIssueDate: '1995-01-01',
        passportExpiryDate: '2000-01-01',
      };
      const result = await service.addNationality('user-uuid', dto);

      expect(result.passportStatus).toBe(PassportStatus.EXPIRED);
    });

    it('computes passportStatus EXPIRING_SOON for an expiry within 6 months', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      const soonExpiry = new Date();
      soonExpiry.setUTCMonth(soonExpiry.getUTCMonth() + 2);
      const expiryStr = soonExpiry.toISOString().slice(0, 10);
      mockInsertReturning.mockResolvedValue([
        {
          ...mockNationality,
          passportExpiryDate: expiryStr,
          passportStatus: PassportStatus.EXPIRING_SOON,
        },
      ]);

      const dto: CreateNationalityDto = {
        countryCode: 'CO',
        isPrimary: false,
        passportNumber: 'AB123456',
        passportIssueDate: '2020-01-15',
        passportExpiryDate: expiryStr,
      };
      const result = await service.addNationality('user-uuid', dto);

      expect(result.passportStatus).toBe(PassportStatus.EXPIRING_SOON);
    });

    it('throws NotFoundException when the insert returns an empty array', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([]);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      await expect(service.addNationality('user-uuid', dto)).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      const dbError = new Error('insert failed');
      mockInsertReturning.mockRejectedValue(dbError);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      await expect(service.addNationality('user-uuid', dto)).rejects.toThrow(dbError);
    });
  });

  describe('updateNationality', () => {
    const mockNationality = {
      id: 'nat-uuid',
      userId: 'user-uuid',
      countryCode: 'CO',
      isPrimary: false,
      nationalIdNumber: null,
      passportNumber: null,
      passportIssueDate: null,
      passportExpiryDate: null,
      passportStatus: PassportStatus.OMITTED,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('updates fields and returns updated nationality', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      const updated = { ...mockNationality, nationalIdNumber: '12345678' };
      mockReturning.mockResolvedValue([updated]);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345678' };
      const result = await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(result.nationalIdNumber).toBe('12345678');
    });

    it('returns existing record without a DB write when dto is empty', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);

      const result = await service.updateNationality('user-uuid', 'nat-uuid', {});

      expect(mockSet).not.toHaveBeenCalled();
      expect(result.countryCode).toBe(mockNationality.countryCode);
    });

    it('demotes other nationalities when isPrimary is true', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockReturning.mockResolvedValue([{ ...mockNationality, isPrimary: true }]);

      const dto: UpdateNationalityDto = { isPrimary: true };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockSet).toHaveBeenNthCalledWith(1, { isPrimary: false });
    });

    it('does not demote when isPrimary is not in dto', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockReturning.mockResolvedValue([mockNationality]);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).not.toHaveBeenCalledWith({ isPrimary: false });
    });

    it('throws BadRequestException when isPrimary is false', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);

      const dto: UpdateNationalityDto = { isPrimary: false };
      await expect(service.updateNationality('user-uuid', 'nat-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when nationality does not exist', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await expect(service.updateNationality('user-uuid', 'nat-uuid', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('recomputes passportStatus when passport fields are in the dto', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockReturning.mockResolvedValue([
        { ...mockNationality, passportStatus: PassportStatus.ACTIVE },
      ]);

      const dto: UpdateNationalityDto = {
        passportNumber: 'AB123456',
        passportIssueDate: '2020-01-15',
        passportExpiryDate: '2035-01-15',
      };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ passportStatus: PassportStatus.ACTIVE }),
      );
    });

    it('preserves existing passportStatus when no passport fields are in the dto', async () => {
      const withActiveStatus = { ...mockNationality, passportStatus: PassportStatus.ACTIVE };
      mockNationalitiesFindFirst.mockResolvedValue(withActiveStatus);
      mockReturning.mockResolvedValue([withActiveStatus]);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockSet).toHaveBeenCalledWith(
        expect.not.objectContaining({ passportStatus: expect.anything() }),
      );
    });

    it('throws NotFoundException when the update returns an empty array', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockReturning.mockResolvedValue([]);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await expect(service.updateNationality('user-uuid', 'nat-uuid', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await expect(service.updateNationality('user-uuid', 'nat-uuid', dto)).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('deleteNationality', () => {
    const mockNationality = {
      id: 'nat-uuid',
      userId: 'user-uuid',
      countryCode: 'CO',
      isPrimary: false,
      nationalIdNumber: null,
      passportNumber: null,
      passportIssueDate: null,
      passportExpiryDate: null,
      passportStatus: PassportStatus.OMITTED,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const primaryNationality = { ...mockNationality, id: 'nat-primary-uuid', isPrimary: true };

    it('deletes the nationality successfully', async () => {
      mockNationalitiesFindMany.mockResolvedValue([mockNationality]);

      await service.deleteNationality('user-uuid', 'nat-uuid');

      expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when deleting the primary with other nationalities remaining', async () => {
      mockNationalitiesFindMany.mockResolvedValue([primaryNationality, mockNationality]);

      await expect(service.deleteNationality('user-uuid', 'nat-primary-uuid')).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows deleting the primary when it is the only nationality', async () => {
      mockNationalitiesFindMany.mockResolvedValue([primaryNationality]);

      await service.deleteNationality('user-uuid', 'nat-primary-uuid');

      expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when nationality does not exist', async () => {
      mockNationalitiesFindMany.mockResolvedValue([mockNationality]);

      await expect(service.deleteNationality('user-uuid', 'nonexistent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      mockNationalitiesFindMany.mockResolvedValue([mockNationality]);
      const dbError = new Error('delete failed');
      mockDeleteWhere.mockRejectedValue(dbError);

      await expect(service.deleteNationality('user-uuid', 'nat-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('getLoyaltyPrograms', () => {
    it('returns the loyalty programs array from the profile', async () => {
      const programs = [
        { id: 'prog-uuid-1', programName: 'LifeMiles', memberId: 'LM123', notes: null },
      ];
      mockProfileFindFirst.mockResolvedValue({ ...mockHealthProfile, loyaltyPrograms: programs });

      const result = await service.getLoyaltyPrograms('user-uuid');

      expect(result).toEqual(programs);
    });

    it('returns an empty array when the user has no programs', async () => {
      mockProfileFindFirst.mockResolvedValue({ ...mockHealthProfile, loyaltyPrograms: [] });

      const result = await service.getLoyaltyPrograms('user-uuid');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException when user profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.getLoyaltyPrograms('user-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addLoyaltyProgram', () => {
    const newProgram = {
      id: 'prog-new-uuid',
      programName: 'Delta SkyMiles',
      memberId: 'DL999',
      notes: null,
    };

    it('appends the new program and returns it', async () => {
      mockProfileFindFirst.mockResolvedValue({ ...mockHealthProfile, loyaltyPrograms: [] });
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, loyaltyPrograms: [newProgram] }]);

      const result = await service.addLoyaltyProgram('user-uuid', newProgram);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ loyaltyPrograms: [newProgram] }),
      );
      expect(result).toEqual(newProgram);
    });

    it('appends to existing programs without removing them', async () => {
      const existing = {
        id: 'prog-existing',
        programName: 'LifeMiles',
        memberId: 'LM1',
        notes: null,
      };
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        loyaltyPrograms: [existing],
      });
      mockReturning.mockResolvedValue([
        { ...mockHealthProfile, loyaltyPrograms: [existing, newProgram] },
      ]);

      await service.addLoyaltyProgram('user-uuid', newProgram);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ loyaltyPrograms: [existing, newProgram] }),
      );
    });

    it('throws NotFoundException when the update returns an empty array', async () => {
      mockProfileFindFirst.mockResolvedValue({ ...mockHealthProfile, loyaltyPrograms: [] });
      mockReturning.mockResolvedValue([]);

      await expect(service.addLoyaltyProgram('user-uuid', newProgram)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.addLoyaltyProgram('user-uuid', newProgram)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateLoyaltyProgram', () => {
    const existingProgram = {
      id: 'prog-uuid',
      programName: 'LifeMiles',
      memberId: 'LM123',
      notes: null,
    };

    it('updates the specified fields and returns the updated program', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        loyaltyPrograms: [existingProgram],
      });
      const updated = { ...existingProgram, memberId: 'LM999' };
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, loyaltyPrograms: [updated] }]);

      const result = await service.updateLoyaltyProgram('user-uuid', 'prog-uuid', {
        memberId: 'LM999',
      });

      expect(result).toEqual(updated);
    });

    it('does not modify other programs in the array', async () => {
      const other = { id: 'prog-other', programName: 'Bonvoy', memberId: 'BV1', notes: null };
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        loyaltyPrograms: [existingProgram, other],
      });
      mockReturning.mockResolvedValue([
        { ...mockHealthProfile, loyaltyPrograms: [{ ...existingProgram, notes: 'Gold' }, other] },
      ]);

      await service.updateLoyaltyProgram('user-uuid', 'prog-uuid', { notes: 'Gold' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          loyaltyPrograms: expect.arrayContaining([expect.objectContaining({ id: 'prog-other' })]),
        }),
      );
    });

    it('throws NotFoundException when the program id is not found', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        loyaltyPrograms: [existingProgram],
      });

      await expect(
        service.updateLoyaltyProgram('user-uuid', 'nonexistent-uuid', { memberId: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the update returns an empty array', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        loyaltyPrograms: [existingProgram],
      });
      mockReturning.mockResolvedValue([]);

      await expect(
        service.updateLoyaltyProgram('user-uuid', 'prog-uuid', { memberId: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when user profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.updateLoyaltyProgram('user-uuid', 'prog-uuid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteLoyaltyProgram', () => {
    const program = {
      id: 'prog-uuid',
      programName: 'LifeMiles',
      memberId: 'LM123',
      notes: null,
    };

    it('removes the program and saves the remaining array', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockHealthProfile,
        loyaltyPrograms: [program],
      });
      mockReturning.mockResolvedValue([{ ...mockHealthProfile, loyaltyPrograms: [] }]);

      await service.deleteLoyaltyProgram('user-uuid', 'prog-uuid');

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ loyaltyPrograms: [] }));
    });

    it('throws NotFoundException when the program is not found', async () => {
      mockProfileFindFirst.mockResolvedValue({ ...mockHealthProfile, loyaltyPrograms: [] });

      await expect(service.deleteLoyaltyProgram('user-uuid', 'prog-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteLoyaltyProgram('user-uuid', 'prog-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPublicProfile', () => {
    const mockProfile = {
      ...mockHealthProfile,
      bio: 'Avid traveler',
    };

    it('returns public profile with bio when user and profile exist', async () => {
      mockFindFirst.mockResolvedValue(mockUser);
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result).toMatchObject({
        username: 'john_doe',
        displayName: 'John Doe',
        avatarUrl: null,
        bio: 'Avid traveler',
        profileVisibility: ProfileVisibility.PRIVATE,
      });
    });

    it('returns bio as null when profile row does not exist', async () => {
      mockFindFirst.mockResolvedValue(mockUser);
      mockProfileFindFirst.mockResolvedValue(undefined);

      const result = await service.getPublicProfile('john_doe');

      expect(result.bio).toBeNull();
    });

    it('returns null gamification fields when profileVisibility is PRIVATE', async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        profileVisibility: ProfileVisibility.PRIVATE,
      });
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result.achievements).toBeNull();
      expect(result.recognitions).toBeNull();
      expect(result.discoveryMap).toBeNull();
      expect(result.travelerScore).toBeNull();
      expect(result.keyStats).toBeNull();
    });

    it('returns null gamification fields when profileVisibility is CONNECTIONS_ONLY', async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        profileVisibility: ProfileVisibility.CONNECTIONS_ONLY,
      });
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result.achievements).toBeNull();
      expect(result.recognitions).toBeNull();
      expect(result.discoveryMap).toBeNull();
    });

    it('returns null gamification fields when profileVisibility is MEMBERS_ONLY', async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        profileVisibility: ProfileVisibility.MEMBERS_ONLY,
      });
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result.achievements).toBeNull();
      expect(result.recognitions).toBeNull();
      expect(result.discoveryMap).toBeNull();
    });

    it('returns empty gamification stubs when profileVisibility is PUBLIC', async () => {
      mockFindFirst.mockResolvedValue({ ...mockUser, profileVisibility: ProfileVisibility.PUBLIC });
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await service.getPublicProfile('john_doe');

      expect(result.achievements).toEqual([]);
      expect(result.recognitions).toEqual([]);
      expect(result.discoveryMap).toEqual([]);
      expect(result.travelerScore).toBeNull();
      expect(result.keyStats).toBeNull();
    });

    it('throws NotFoundException when username not found', async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(service.getPublicProfile('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // Visas
  // ---------------------------------------------------------------------------

  const mockNationality = {
    id: 'nat-uuid',
    userId: 'user-uuid',
    countryCode: 'CO',
    isPrimary: true,
    nationalIdNumber: null,
    passportNumber: 'AB123456',
    passportIssueDate: '2020-01-01',
    passportExpiryDate: '2030-01-01',
    passportStatus: PassportStatus.ACTIVE,
    updatedAt: new Date(),
  };

  const mockVisa = {
    id: 'visa-uuid',
    nationalityId: 'nat-uuid',
    coverageType: VisaCoverageType.COUNTRY,
    countryCode: 'US',
    visaZone: null,
    visaType: VisaType.TOURIST,
    entries: VisaEntries.MULTIPLE,
    expiryDate: '2027-12-31',
    visaStatus: DocumentStatus.ACTIVE,
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  describe('getVisas', () => {
    it('returns mapped visas for a valid nationality', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockVisasFindMany.mockResolvedValue([mockVisa]);

      const result = await service.getVisas('user-uuid', 'nat-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('visa-uuid');
      expect(result[0]!.visaStatus).toBe(DocumentStatus.ACTIVE);
    });

    it('throws NotFoundException when nationality not found or not owned', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      await expect(service.getVisas('user-uuid', 'other-nat')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addVisa', () => {
    it('inserts a visa and returns the mapped response', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockInsertReturning.mockResolvedValue([mockVisa]);

      const dto = {
        coverageType: VisaCoverageType.COUNTRY,
        countryCode: 'US',
        visaType: VisaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      };

      const result = await service.addVisa('user-uuid', 'nat-uuid', dto);

      expect(result.id).toBe('visa-uuid');
      expect(result.nationalityId).toBe('nat-uuid');
    });

    it('throws NotFoundException when nationality not owned', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      await expect(
        service.addVisa('user-uuid', 'other-nat', {
          coverageType: VisaCoverageType.COUNTRY,
          countryCode: 'US',
          visaType: VisaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when passport status is OMITTED', async () => {
      mockNationalitiesFindFirst.mockResolvedValue({
        ...mockNationality,
        passportStatus: PassportStatus.OMITTED,
        passportNumber: null,
        passportIssueDate: null,
        passportExpiryDate: null,
      });

      await expect(
        service.addVisa('user-uuid', 'nat-uuid', {
          coverageType: VisaCoverageType.COUNTRY,
          countryCode: 'US',
          visaType: VisaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when both countryCode and visaZone are provided', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);

      await expect(
        service.addVisa('user-uuid', 'nat-uuid', {
          coverageType: VisaCoverageType.COUNTRY,
          countryCode: 'US',
          visaZone: 'SCHENGEN' as import('@chamuco/shared-types').VisaZone,
          visaType: VisaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateVisa', () => {
    it('updates visa fields and returns the response', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockVisasFindFirst.mockResolvedValue(mockVisa);
      const updated = { ...mockVisa, visaType: VisaType.BUSINESS };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateVisa('user-uuid', 'nat-uuid', 'visa-uuid', {
        visaType: VisaType.BUSINESS,
      });

      expect(result.visaType).toBe(VisaType.BUSINESS);
    });

    it('returns unchanged visa when patch is empty', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockVisasFindFirst.mockResolvedValue(mockVisa);

      const result = await service.updateVisa('user-uuid', 'nat-uuid', 'visa-uuid', {});

      expect(result.id).toBe('visa-uuid');
    });

    it('throws NotFoundException when visa not found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockVisasFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateVisa('user-uuid', 'nat-uuid', 'bad-id', { visaType: VisaType.BUSINESS }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteVisa', () => {
    it('deletes the visa when found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockVisasFindFirst.mockResolvedValue(mockVisa);
      mockDeleteWhere.mockResolvedValue(undefined);

      await expect(
        service.deleteVisa('user-uuid', 'nat-uuid', 'visa-uuid'),
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundException when visa not found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockVisasFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteVisa('user-uuid', 'nat-uuid', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // ETAs
  // ---------------------------------------------------------------------------

  const mockEta = {
    id: 'eta-uuid',
    userNationalityId: 'nat-uuid',
    passportNumber: 'AB123456',
    destinationCountry: 'US',
    authorizationNumber: 'A1B2C3D4E5',
    etaType: EtaType.TOURIST,
    entries: VisaEntries.MULTIPLE,
    expiryDate: '2027-12-31',
    etaStatus: DocumentStatus.ACTIVE,
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  describe('getEtas', () => {
    it('returns mapped ETAs for a valid nationality', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockEtasFindMany.mockResolvedValue([mockEta]);

      const result = await service.getEtas('user-uuid', 'nat-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('eta-uuid');
      expect(result[0]!.etaStatus).toBe(DocumentStatus.ACTIVE);
    });

    it('throws NotFoundException when nationality not found or not owned', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      await expect(service.getEtas('user-uuid', 'other-nat')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addEta', () => {
    it('inserts an ETA and returns the mapped response', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockInsertReturning.mockResolvedValue([mockEta]);

      const dto = {
        passportNumber: 'AB123456',
        destinationCountry: 'US',
        authorizationNumber: 'A1B2C3D4E5',
        etaType: EtaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      };

      const result = await service.addEta('user-uuid', 'nat-uuid', dto);

      expect(result.id).toBe('eta-uuid');
      expect(result.userNationalityId).toBe('nat-uuid');
    });

    it('throws NotFoundException when nationality not owned', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      await expect(
        service.addEta('user-uuid', 'other-nat', {
          passportNumber: 'AB123456',
          destinationCountry: 'US',
          authorizationNumber: 'A1B2C3D4E5',
          etaType: EtaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when passport status is OMITTED', async () => {
      mockNationalitiesFindFirst.mockResolvedValue({
        ...mockNationality,
        passportStatus: PassportStatus.OMITTED,
        passportNumber: null,
        passportIssueDate: null,
        passportExpiryDate: null,
      });

      await expect(
        service.addEta('user-uuid', 'nat-uuid', {
          passportNumber: 'AB123456',
          destinationCountry: 'US',
          authorizationNumber: 'A1B2C3D4E5',
          etaType: EtaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateEta', () => {
    it('updates ETA fields and returns the response', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockEtasFindFirst.mockResolvedValue(mockEta);
      const updated = { ...mockEta, etaType: EtaType.TRANSIT };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateEta('user-uuid', 'nat-uuid', 'eta-uuid', {
        etaType: EtaType.TRANSIT,
      });

      expect(result.etaType).toBe(EtaType.TRANSIT);
    });

    it('returns unchanged ETA when patch is empty', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockEtasFindFirst.mockResolvedValue(mockEta);

      const result = await service.updateEta('user-uuid', 'nat-uuid', 'eta-uuid', {});

      expect(result.id).toBe('eta-uuid');
    });

    it('throws NotFoundException when ETA not found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockEtasFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateEta('user-uuid', 'nat-uuid', 'bad-id', { etaType: EtaType.TRANSIT }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEta', () => {
    it('deletes the ETA when found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockEtasFindFirst.mockResolvedValue(mockEta);
      mockDeleteWhere.mockResolvedValue(undefined);

      await expect(service.deleteEta('user-uuid', 'nat-uuid', 'eta-uuid')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when ETA not found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockEtasFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteEta('user-uuid', 'nat-uuid', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateNationality — ETA invalidation on passport change', () => {
    it('expires ETAs synchronously when passportNumber changes', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockReturning.mockResolvedValue([mockNationality]);

      await service.updateNationality('user-uuid', 'nat-uuid', {
        passportNumber: 'ZZ999999',
        passportIssueDate: '2024-01-01',
        passportExpiryDate: '2034-01-01',
      });

      // mockSet is called twice: once for ETAs expiry, once for the nationality update
      expect(mockSet).toHaveBeenCalledTimes(2);
      const [firstCall] = mockSet.mock.calls;
      expect(firstCall![0]).toMatchObject({ etaStatus: DocumentStatus.EXPIRED });
    });

    it('does not expire ETAs when passportNumber is unchanged', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationality);
      mockReturning.mockResolvedValue([mockNationality]);

      await service.updateNationality('user-uuid', 'nat-uuid', {
        passportNumber: 'AB123456', // same as existing
        passportIssueDate: '2020-01-01',
        passportExpiryDate: '2030-06-01',
      });

      // only one update call: the nationality update itself
      expect(mockSet).toHaveBeenCalledTimes(1);
    });
  });
});
