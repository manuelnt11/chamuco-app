import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BloodType,
  DietaryPreference,
  FoodAllergen,
  MedicalConditionType,
  PhobiaType,
  PhysicalLimitationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersHealthService } from './users-health.service';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';

const mockProfileRow = {
  userId: 'user-uuid',
  bloodType: null,
  dietaryPreference: DietaryPreference.OMNIVORE,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('UsersHealthService', () => {
  let service: UsersHealthService;
  let mockProfileFindFirst: jest.Mock;
  let mockReturning: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(async () => {
    mockProfileFindFirst = jest.fn();
    mockReturning = jest.fn();

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersHealthService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              userProfiles: { findFirst: mockProfileFindFirst },
            },
            update: mockUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<UsersHealthService>(UsersHealthService);
  });

  describe('getHealth', () => {
    it('returns the mapped health response when the profile is found', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);

      const result = await service.getHealth('user-uuid');

      const expected: UserHealthResponseDto = {
        bloodType: null,
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
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);

      const result = await service.updateHealth('user-uuid', {} as UpdateUserHealthDto);

      expect(result.dietaryPreference).toBe(DietaryPreference.OMNIVORE);
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('normalizes empty and whitespace-only text fields to null before saving', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      mockReturning.mockResolvedValue([
        { ...mockProfileRow, dietaryNotes: null, generalMedicalNotes: null },
      ]);

      await service.updateHealth('user-uuid', { dietaryNotes: '', generalMedicalNotes: '   ' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ dietaryNotes: null, generalMedicalNotes: null }),
      );
    });

    it('updates and returns the mapped health response on success', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      const updated = {
        ...mockProfileRow,
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
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      const updated = {
        ...mockProfileRow,
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

    it('updates blood type and returns mapped response', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      const updated = { ...mockProfileRow, bloodType: BloodType.O_POSITIVE };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateHealth('user-uuid', { bloodType: BloodType.O_POSITIVE });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ bloodType: BloodType.O_POSITIVE }),
      );
      expect(result.bloodType).toBe(BloodType.O_POSITIVE);
    });

    it('clears blood type when null is passed', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockProfileRow,
        bloodType: BloodType.A_NEGATIVE,
      });
      const updated = { ...mockProfileRow, bloodType: null };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateHealth('user-uuid', { bloodType: null });

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ bloodType: null }));
      expect(result.bloodType).toBeNull();
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
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      mockReturning.mockResolvedValue([]);

      await expect(
        service.updateHealth('user-uuid', { dietaryPreference: DietaryPreference.VEGAN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors on the update', async () => {
      mockProfileFindFirst.mockResolvedValue(mockProfileRow);
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(
        service.updateHealth('user-uuid', { dietaryPreference: DietaryPreference.VEGAN }),
      ).rejects.toThrow(dbError);
    });
  });
});
