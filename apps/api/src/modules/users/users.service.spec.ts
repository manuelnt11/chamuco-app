import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
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
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';
import type { AuthenticatedUser } from '@/types/express';

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
  let mockReturning: jest.Mock;

  beforeEach(async () => {
    mockFindFirst = jest.fn();
    mockProfileFindFirst = jest.fn();
    mockReturning = jest.fn();

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
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
