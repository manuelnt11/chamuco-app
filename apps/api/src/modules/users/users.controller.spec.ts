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
  PassportStatus,
  PlatformRole,
  ProfileVisibility,
  VisaCoverageType,
  VisaEntries,
  VisaType,
} from '@chamuco/shared-types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import type {
  CreateNationalityDto,
  NationalityResponseDto,
  UpdateNationalityDto,
} from './dto/nationality.dto';
import type { LoyaltyProgramDto, UpdateLoyaltyProgramDto } from './dto/loyalty-program.dto';
import type { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { CreateVisaDto, UpdateVisaDto, VisaResponseDto } from './dto/visa.dto';
import type { CreateEtaDto, EtaResponseDto, UpdateEtaDto } from './dto/eta.dto';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';
import type { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import type { UserProfileResponseDto } from './dto/user-profile-response.dto';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: null,
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

// mockUser is the expected shape after getMe strips firebaseUid
const { firebaseUid: _, ...mockUser } = mockAuthUser;

const mockPreferencesResponse: UserPreferencesResponseDto = {
  language: AppLanguage.ES,
  currency: AppCurrency.COP,
  theme: AppTheme.SYSTEM,
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
  let mockGetEmergencyContacts: jest.Mock;
  let mockAddEmergencyContact: jest.Mock;
  let mockUpdateEmergencyContact: jest.Mock;
  let mockDeleteEmergencyContact: jest.Mock;
  let mockGetNationalities: jest.Mock;
  let mockAddNationality: jest.Mock;
  let mockUpdateNationality: jest.Mock;
  let mockDeleteNationality: jest.Mock;
  let mockGetLoyaltyPrograms: jest.Mock;
  let mockAddLoyaltyProgram: jest.Mock;
  let mockUpdateLoyaltyProgram: jest.Mock;
  let mockDeleteLoyaltyProgram: jest.Mock;
  let mockGetVisas: jest.Mock;
  let mockAddVisa: jest.Mock;
  let mockUpdateVisa: jest.Mock;
  let mockDeleteVisa: jest.Mock;
  let mockGetEtas: jest.Mock;
  let mockAddEta: jest.Mock;
  let mockUpdateEta: jest.Mock;
  let mockDeleteEta: jest.Mock;
  let mockGetPublicProfile: jest.Mock;

  const mockPublicProfileResponse: PublicProfileResponseDto = {
    username: 'john_doe',
    displayName: 'John Doe',
    avatarUrl: null,
    bio: null,
    profileVisibility: ProfileVisibility.PRIVATE,
    travelerScore: null,
    achievements: null,
    recognitions: null,
    keyStats: null,
    discoveryMap: null,
  };

  const mockContactResponse: EmergencyContactDto = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    fullName: 'María López',
    phoneCountryCode: '+57',
    phoneLocalNumber: '3001234567',
    relationship: 'mother',
    isPrimary: true,
  };

  const mockLoyaltyProgramResponse: LoyaltyProgramDto = {
    id: 'prog-uuid',
    programName: 'LifeMiles',
    memberId: 'LM123',
    notes: null,
  };

  const mockNationalityResponse: NationalityResponseDto = {
    id: 'nat-uuid',
    countryCode: 'CO',
    isPrimary: true,
    nationalIdNumber: null,
    passportNumber: null,
    passportIssueDate: null,
    passportExpiryDate: null,
    passportStatus: PassportStatus.OMITTED,
  };

  const mockVisaResponse: VisaResponseDto = {
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
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };

  const mockEtaResponse: EtaResponseDto = {
    id: 'eta-uuid',
    userNationalityId: 'nat-uuid',
    passportNumber: 'AB123456',
    destinationCountry: 'CA',
    authorizationNumber: 'A1B2C3D4E5',
    etaType: EtaType.TOURIST,
    entries: VisaEntries.MULTIPLE,
    expiryDate: '2027-12-31',
    etaStatus: DocumentStatus.ACTIVE,
    notes: null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };

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
    mockGetEmergencyContacts = jest.fn().mockResolvedValue([mockContactResponse]);
    mockAddEmergencyContact = jest.fn().mockResolvedValue(mockContactResponse);
    mockUpdateEmergencyContact = jest.fn().mockResolvedValue(mockContactResponse);
    mockDeleteEmergencyContact = jest.fn().mockResolvedValue(undefined);
    mockGetNationalities = jest.fn().mockResolvedValue([mockNationalityResponse]);
    mockAddNationality = jest.fn().mockResolvedValue(mockNationalityResponse);
    mockUpdateNationality = jest.fn().mockResolvedValue(mockNationalityResponse);
    mockDeleteNationality = jest.fn().mockResolvedValue(undefined);
    mockGetLoyaltyPrograms = jest.fn().mockResolvedValue([mockLoyaltyProgramResponse]);
    mockAddLoyaltyProgram = jest.fn().mockResolvedValue(mockLoyaltyProgramResponse);
    mockUpdateLoyaltyProgram = jest.fn().mockResolvedValue(mockLoyaltyProgramResponse);
    mockDeleteLoyaltyProgram = jest.fn().mockResolvedValue(undefined);
    mockGetVisas = jest.fn().mockResolvedValue([mockVisaResponse]);
    mockAddVisa = jest.fn().mockResolvedValue(mockVisaResponse);
    mockUpdateVisa = jest.fn().mockResolvedValue(mockVisaResponse);
    mockDeleteVisa = jest.fn().mockResolvedValue(undefined);
    mockGetEtas = jest.fn().mockResolvedValue([mockEtaResponse]);
    mockAddEta = jest.fn().mockResolvedValue(mockEtaResponse);
    mockUpdateEta = jest.fn().mockResolvedValue(mockEtaResponse);
    mockDeleteEta = jest.fn().mockResolvedValue(undefined);
    mockGetPublicProfile = jest.fn().mockResolvedValue(mockPublicProfileResponse);

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
            getEmergencyContacts: mockGetEmergencyContacts,
            addEmergencyContact: mockAddEmergencyContact,
            updateEmergencyContact: mockUpdateEmergencyContact,
            deleteEmergencyContact: mockDeleteEmergencyContact,
            getNationalities: mockGetNationalities,
            addNationality: mockAddNationality,
            updateNationality: mockUpdateNationality,
            deleteNationality: mockDeleteNationality,
            getLoyaltyPrograms: mockGetLoyaltyPrograms,
            addLoyaltyProgram: mockAddLoyaltyProgram,
            updateLoyaltyProgram: mockUpdateLoyaltyProgram,
            deleteLoyaltyProgram: mockDeleteLoyaltyProgram,
            getVisas: mockGetVisas,
            addVisa: mockAddVisa,
            updateVisa: mockUpdateVisa,
            deleteVisa: mockDeleteVisa,
            getEtas: mockGetEtas,
            addEta: mockAddEta,
            updateEta: mockUpdateEta,
            deleteEta: mockDeleteEta,
            getPublicProfile: mockGetPublicProfile,
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

    it('delegates profileVisibility update to service', async () => {
      const dto: UpdateUserDto = { profileVisibility: ProfileVisibility.PUBLIC };
      const updated = { ...mockUser, profileVisibility: ProfileVisibility.PUBLIC };
      mockUpdateMe.mockResolvedValue(updated);

      const result = await controller.updateMe(mockAuthUser, dto);

      expect(mockUpdateMe).toHaveBeenCalledWith(mockAuthUser, dto);
      expect(result.profileVisibility).toBe(ProfileVisibility.PUBLIC);
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

  describe('GET /v1/users/me/emergency-contacts', () => {
    it('delegates to usersService.getEmergencyContacts with the authenticated user id', async () => {
      const result = await controller.getEmergencyContacts(mockAuthUser);

      expect(mockGetEmergencyContacts).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockContactResponse]);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetEmergencyContacts.mockRejectedValue(new NotFoundException());

      await expect(controller.getEmergencyContacts(mockAuthUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /v1/users/me/emergency-contacts', () => {
    it('delegates to usersService.addEmergencyContact with the user id and dto', async () => {
      const result = await controller.addEmergencyContact(mockAuthUser, mockContactResponse);

      expect(mockAddEmergencyContact).toHaveBeenCalledWith(mockAuthUser.id, mockContactResponse);
      expect(result).toEqual(mockContactResponse);
    });

    it('propagates ConflictException from the service', async () => {
      mockAddEmergencyContact.mockRejectedValue(new ConflictException());

      await expect(
        controller.addEmergencyContact(mockAuthUser, mockContactResponse),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('PATCH /v1/users/me/emergency-contacts/:id', () => {
    it('delegates to usersService.updateEmergencyContact with the user id, contact id, and dto', async () => {
      const dto: UpdateEmergencyContactDto = { fullName: 'Ana López' };
      const updated = { ...mockContactResponse, fullName: 'Ana López' };
      mockUpdateEmergencyContact.mockResolvedValue(updated);

      const result = await controller.updateEmergencyContact(
        mockAuthUser,
        mockContactResponse.id,
        dto,
      );

      expect(mockUpdateEmergencyContact).toHaveBeenCalledWith(
        mockAuthUser.id,
        mockContactResponse.id,
        dto,
      );
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateEmergencyContact.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateEmergencyContact(mockAuthUser, 'nonexistent-id', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /v1/users/me/emergency-contacts/:id', () => {
    it('delegates to usersService.deleteEmergencyContact with the user id and contact id', async () => {
      await controller.deleteEmergencyContact(mockAuthUser, mockContactResponse.id);

      expect(mockDeleteEmergencyContact).toHaveBeenCalledWith(
        mockAuthUser.id,
        mockContactResponse.id,
      );
    });

    it('propagates ConflictException from the service', async () => {
      mockDeleteEmergencyContact.mockRejectedValue(new ConflictException());

      await expect(
        controller.deleteEmergencyContact(mockAuthUser, mockContactResponse.id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('GET /v1/users/me/nationalities', () => {
    it('delegates to usersService.getNationalities with the authenticated user id', async () => {
      const result = await controller.getNationalities(mockAuthUser);

      expect(mockGetNationalities).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockNationalityResponse]);
    });

    it('propagates unexpected errors from the service', async () => {
      mockGetNationalities.mockRejectedValue(new Error('db error'));

      await expect(controller.getNationalities(mockAuthUser)).rejects.toThrow('db error');
    });
  });

  describe('POST /v1/users/me/nationalities', () => {
    it('delegates to usersService.addNationality with the user id and dto', async () => {
      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: true };

      const result = await controller.addNationality(mockAuthUser, dto);

      expect(mockAddNationality).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(mockNationalityResponse);
    });

    it('propagates ConflictException from the service', async () => {
      mockAddNationality.mockRejectedValue(new ConflictException());

      await expect(
        controller.addNationality(mockAuthUser, { countryCode: 'CO', isPrimary: true }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('PATCH /v1/users/me/nationalities/:id', () => {
    it('delegates to usersService.updateNationality with the user id, nationality id, and dto', async () => {
      const dto: UpdateNationalityDto = { nationalIdNumber: '12345678' };
      const updated: NationalityResponseDto = {
        ...mockNationalityResponse,
        nationalIdNumber: '12345678',
      };
      mockUpdateNationality.mockResolvedValue(updated);

      const result = await controller.updateNationality(mockAuthUser, 'nat-uuid', dto);

      expect(mockUpdateNationality).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateNationality.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateNationality(mockAuthUser, 'nonexistent-uuid', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /v1/users/me/nationalities/:id', () => {
    it('delegates to usersService.deleteNationality with the user id and nationality id', async () => {
      await controller.deleteNationality(mockAuthUser, 'nat-uuid');

      expect(mockDeleteNationality).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid');
    });

    it('propagates ConflictException from the service', async () => {
      mockDeleteNationality.mockRejectedValue(new ConflictException());

      await expect(controller.deleteNationality(mockAuthUser, 'nat-uuid')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('GET /v1/users/me/loyalty-programs', () => {
    it('delegates to usersService.getLoyaltyPrograms with the authenticated user id', async () => {
      const result = await controller.getLoyaltyPrograms(mockAuthUser);

      expect(mockGetLoyaltyPrograms).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockLoyaltyProgramResponse]);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetLoyaltyPrograms.mockRejectedValue(new NotFoundException());

      await expect(controller.getLoyaltyPrograms(mockAuthUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /v1/users/me/loyalty-programs', () => {
    it('delegates to usersService.addLoyaltyProgram with the user id and dto', async () => {
      const result = await controller.addLoyaltyProgram(mockAuthUser, mockLoyaltyProgramResponse);

      expect(mockAddLoyaltyProgram).toHaveBeenCalledWith(
        mockAuthUser.id,
        mockLoyaltyProgramResponse,
      );
      expect(result).toEqual(mockLoyaltyProgramResponse);
    });

    it('propagates NotFoundException from the service', async () => {
      mockAddLoyaltyProgram.mockRejectedValue(new NotFoundException());

      await expect(
        controller.addLoyaltyProgram(mockAuthUser, mockLoyaltyProgramResponse),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /v1/users/me/loyalty-programs/:id', () => {
    it('delegates to usersService.updateLoyaltyProgram with the user id, program id, and dto', async () => {
      const dto: UpdateLoyaltyProgramDto = { memberId: 'LM999' };
      const updated: LoyaltyProgramDto = { ...mockLoyaltyProgramResponse, memberId: 'LM999' };
      mockUpdateLoyaltyProgram.mockResolvedValue(updated);

      const result = await controller.updateLoyaltyProgram(mockAuthUser, 'prog-uuid', dto);

      expect(mockUpdateLoyaltyProgram).toHaveBeenCalledWith(mockAuthUser.id, 'prog-uuid', dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateLoyaltyProgram.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateLoyaltyProgram(mockAuthUser, 'nonexistent-uuid', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /v1/users/me/loyalty-programs/:id', () => {
    it('delegates to usersService.deleteLoyaltyProgram with the user id and program id', async () => {
      await controller.deleteLoyaltyProgram(mockAuthUser, 'prog-uuid');

      expect(mockDeleteLoyaltyProgram).toHaveBeenCalledWith(mockAuthUser.id, 'prog-uuid');
    });

    it('propagates NotFoundException from the service', async () => {
      mockDeleteLoyaltyProgram.mockRejectedValue(new NotFoundException());

      await expect(controller.deleteLoyaltyProgram(mockAuthUser, 'prog-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /v1/users/me/nationalities/:nationalityId/visas', () => {
    it('delegates to usersService.getVisas with the user id and nationalityId', async () => {
      const result = await controller.getVisas(mockAuthUser, 'nat-uuid');

      expect(mockGetVisas).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid');
      expect(result).toEqual([mockVisaResponse]);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetVisas.mockRejectedValue(new NotFoundException());

      await expect(controller.getVisas(mockAuthUser, 'bad-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /v1/users/me/nationalities/:nationalityId/visas', () => {
    it('delegates to usersService.addVisa with the user id, nationalityId, and dto', async () => {
      const dto: CreateVisaDto = {
        coverageType: VisaCoverageType.COUNTRY,
        countryCode: 'US',
        visaType: VisaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      };

      const result = await controller.addVisa(mockAuthUser, 'nat-uuid', dto);

      expect(mockAddVisa).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', dto);
      expect(result).toEqual(mockVisaResponse);
    });

    it('propagates NotFoundException from the service', async () => {
      mockAddVisa.mockRejectedValue(new NotFoundException());

      await expect(
        controller.addVisa(mockAuthUser, 'bad-uuid', {} as CreateVisaDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /v1/users/me/nationalities/:nationalityId/visas/:id', () => {
    it('delegates to usersService.updateVisa with the user id, nationalityId, visa id, and dto', async () => {
      const dto: UpdateVisaDto = { expiryDate: '2028-06-30' };
      const updated: VisaResponseDto = { ...mockVisaResponse, expiryDate: '2028-06-30' };
      mockUpdateVisa.mockResolvedValue(updated);

      const result = await controller.updateVisa(mockAuthUser, 'nat-uuid', 'visa-uuid', dto);

      expect(mockUpdateVisa).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', 'visa-uuid', dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateVisa.mockRejectedValue(new NotFoundException());

      await expect(controller.updateVisa(mockAuthUser, 'nat-uuid', 'bad-uuid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /v1/users/me/nationalities/:nationalityId/visas/:id', () => {
    it('delegates to usersService.deleteVisa with the user id, nationalityId, and visa id', async () => {
      await controller.deleteVisa(mockAuthUser, 'nat-uuid', 'visa-uuid');

      expect(mockDeleteVisa).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', 'visa-uuid');
    });

    it('propagates NotFoundException from the service', async () => {
      mockDeleteVisa.mockRejectedValue(new NotFoundException());

      await expect(controller.deleteVisa(mockAuthUser, 'nat-uuid', 'bad-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /v1/users/me/nationalities/:nationalityId/etas', () => {
    it('delegates to usersService.getEtas with the user id and nationalityId', async () => {
      const result = await controller.getEtas(mockAuthUser, 'nat-uuid');

      expect(mockGetEtas).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid');
      expect(result).toEqual([mockEtaResponse]);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetEtas.mockRejectedValue(new NotFoundException());

      await expect(controller.getEtas(mockAuthUser, 'bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /v1/users/me/nationalities/:nationalityId/etas', () => {
    it('delegates to usersService.addEta with the user id, nationalityId, and dto', async () => {
      const dto: CreateEtaDto = {
        destinationCountry: 'CA',
        authorizationNumber: 'A1B2C3D4E5',
        etaType: EtaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      };

      const result = await controller.addEta(mockAuthUser, 'nat-uuid', dto);

      expect(mockAddEta).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', dto);
      expect(result).toEqual(mockEtaResponse);
    });

    it('propagates NotFoundException from the service', async () => {
      mockAddEta.mockRejectedValue(new NotFoundException());

      await expect(controller.addEta(mockAuthUser, 'bad-uuid', {} as CreateEtaDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /v1/users/me/nationalities/:nationalityId/etas/:id', () => {
    it('delegates to usersService.updateEta with the user id, nationalityId, eta id, and dto', async () => {
      const dto: UpdateEtaDto = { expiryDate: '2028-06-30' };
      const updated: EtaResponseDto = { ...mockEtaResponse, expiryDate: '2028-06-30' };
      mockUpdateEta.mockResolvedValue(updated);

      const result = await controller.updateEta(mockAuthUser, 'nat-uuid', 'eta-uuid', dto);

      expect(mockUpdateEta).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', 'eta-uuid', dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from the service', async () => {
      mockUpdateEta.mockRejectedValue(new NotFoundException());

      await expect(controller.updateEta(mockAuthUser, 'nat-uuid', 'bad-uuid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /v1/users/me/nationalities/:nationalityId/etas/:id', () => {
    it('delegates to usersService.deleteEta with the user id, nationalityId, and eta id', async () => {
      await controller.deleteEta(mockAuthUser, 'nat-uuid', 'eta-uuid');

      expect(mockDeleteEta).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', 'eta-uuid');
    });

    it('propagates NotFoundException from the service', async () => {
      mockDeleteEta.mockRejectedValue(new NotFoundException());

      await expect(controller.deleteEta(mockAuthUser, 'nat-uuid', 'bad-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /v1/users/:username/profile', () => {
    it('delegates to usersService.getPublicProfile with the username param', async () => {
      const result = await controller.getPublicProfile('john_doe');

      expect(mockGetPublicProfile).toHaveBeenCalledWith('john_doe');
      expect(result).toEqual(mockPublicProfileResponse);
    });

    it('propagates NotFoundException from the service', async () => {
      mockGetPublicProfile.mockRejectedValue(new NotFoundException());

      await expect(controller.getPublicProfile('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
