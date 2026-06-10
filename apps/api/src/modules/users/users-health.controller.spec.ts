import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  DietaryPreference,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { UsersHealthController } from './users-health.controller';
import { UsersHealthService } from './users-health.service';
import type { AuthenticatedUser } from '@/types/express';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';

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

const mockHealthResponse: UserHealthResponseDto = {
  bloodType: null,
  dietaryPreference: DietaryPreference.OMNIVORE,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
};

describe('UsersHealthController', () => {
  let controller: UsersHealthController;
  let mockGetHealth: jest.Mock;
  let mockUpdateHealth: jest.Mock;

  beforeEach(async () => {
    mockGetHealth = jest.fn().mockResolvedValue(mockHealthResponse);
    mockUpdateHealth = jest.fn().mockResolvedValue(mockHealthResponse);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersHealthController],
      providers: [
        {
          provide: UsersHealthService,
          useValue: {
            getHealth: mockGetHealth,
            updateHealth: mockUpdateHealth,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersHealthController>(UsersHealthController);
  });

  describe('GET /v1/users/me/health', () => {
    it('delegates to UsersHealthService.getHealth and returns the result', async () => {
      const result = await controller.getHealthProfile(mockAuthUser);

      expect(mockGetHealth).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual(mockHealthResponse);
    });
  });

  describe('PATCH /v1/users/me/health', () => {
    it('delegates to UsersHealthService.updateHealth and returns the result', async () => {
      const dto: UpdateUserHealthDto = { dietaryPreference: DietaryPreference.VEGAN };
      const result = await controller.updateHealthProfile(mockAuthUser, dto);

      expect(mockUpdateHealth).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(mockHealthResponse);
    });
  });
});
