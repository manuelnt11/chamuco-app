import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { UsersProfileController } from './users-profile.controller';
import { UsersProfileService } from './users-profile.service';
import type { AuthenticatedUser } from '@/types/express';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import type { UserProfileResponseDto } from './dto/user-profile-response.dto';

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

const mockProfileResponse: UserProfileResponseDto = {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: { day: 1, month: 1, year: 1990, yearVisible: true },
  birthCountry: null,
  birthCity: null,
  homeCountry: 'CO',
  homeCity: null,
  email: 'john@example.com',
  emailVerified: true,
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  phoneVerified: false,
  bio: null,
};

describe('UsersProfileController', () => {
  let controller: UsersProfileController;
  let mockGetProfile: jest.Mock;
  let mockUpdateProfile: jest.Mock;

  beforeEach(async () => {
    mockGetProfile = jest.fn().mockResolvedValue(mockProfileResponse);
    mockUpdateProfile = jest.fn().mockResolvedValue(mockProfileResponse);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersProfileController],
      providers: [
        {
          provide: UsersProfileService,
          useValue: {
            getProfile: mockGetProfile,
            updateProfile: mockUpdateProfile,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersProfileController>(UsersProfileController);
  });

  describe('GET /v1/users/me/profile', () => {
    it('delegates to UsersProfileService.getProfile and returns the result', async () => {
      const result = await controller.getProfile(mockAuthUser);

      expect(mockGetProfile).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual(mockProfileResponse);
    });
  });

  describe('PATCH /v1/users/me/profile', () => {
    it('delegates to UsersProfileService.updateProfile and returns the result', async () => {
      const dto: UpdateUserProfileDto = { firstName: 'Jane' };
      const result = await controller.updateProfile(mockAuthUser, dto);

      expect(mockUpdateProfile).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(mockProfileResponse);
    });
  });
});
