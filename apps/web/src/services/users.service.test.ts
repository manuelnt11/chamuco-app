import {
  checkUsernameAvailable,
  createEmergencyContact,
  createEta,
  createLoyaltyProgram,
  createNationality,
  createVisa,
  deleteEmergencyContact,
  deleteEta,
  deleteLoyaltyProgram,
  deleteNationality,
  deleteVisa,
  getMe,
  getMyEtas,
  getMyEmergencyContacts,
  getMyHealth,
  getMyLoyaltyPrograms,
  getMyNationalities,
  getMyNotificationPreferences,
  getMyPersonalDetails,
  getMyPreferences,
  getMyProfile,
  getMyVisas,
  getPublicProfile,
  searchUsers,
  updateEmergencyContact,
  updateEta,
  updateLoyaltyProgram,
  updateMe,
  updateMyAvatar,
  updateMyHealth,
  updateMyNotificationPreferences,
  updateMyPreferences,
  updateMyProfile,
  updateNationality,
  updateVisa,
} from './users.service';
import type {
  BasicInfoProfile,
  CreateEmergencyContactPayload,
  CreateEtaPayload,
  CreateLoyaltyProgramPayload,
  CreateNationalityPayload,
  CreateVisaPayload,
  EmergencyContactDto,
  EtaDto,
  HealthData,
  LoyaltyProgramDto,
  NationalityDto,
  NotificationPreferencesData,
  PersonalDetailsProfile,
  PreferencesData,
  PublicProfileData,
  UpdateAvatarPayload,
  UpdateEmergencyContactPayload,
  UpdateEtaPayload,
  UpdateLoyaltyProgramPayload,
  UpdateMePayload,
  UpdateNationalityPayload,
  UpdateVisaPayload,
  VisaDto,
} from '@/services/users.types';
import type { AppUser } from '@/store/user';
import type { UserSearchResponse } from '@/types/user';
import {
  AppCurrency,
  AppLanguage,
  AppTheme,
  DocumentStatus,
  EtaType,
  PassportStatus,
  ProfileVisibility,
  VisaCoverageType,
  VisaEntries,
  VisaType,
} from '@chamuco/shared-types';

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  return { mockGet: get, mockPost: post, mockPatch: patch, mockDelete: del };
});

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

beforeEach(() => {
  mockGet.mockClear();
  mockPost.mockClear();
  mockPatch.mockClear();
  mockDelete.mockClear();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const appUserFixture: AppUser = {
  id: 'user-uuid-1',
  username: 'johndoe',
  displayName: 'John Doe',
  avatar: null,
  timezone: 'America/Mexico_City',
  profileVisibility: ProfileVisibility.PUBLIC,
};

const publicProfileFixture: PublicProfileData = {
  username: 'johndoe',
  displayName: 'John Doe',
  avatar: null,
  bio: null,
  profileVisibility: ProfileVisibility.PUBLIC,
  travelerScore: null,
  achievements: null,
  recognitions: null,
  keyStats: null,
  discoveryMap: null,
};

const basicInfoFixture: BasicInfoProfile = {
  bio: 'Travel enthusiast',
  homeCountry: 'MX',
};

const personalDetailsFixture: PersonalDetailsProfile = {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: { day: 15, month: 6, year: 1990, yearVisible: true },
  phoneCountryCode: '+52',
  phoneLocalNumber: '5551234567',
  birthCountry: null,
  birthCity: null,
  homeCountry: 'MX',
  homeCity: null,
  email: 'john@example.com',
  emailVerified: true,
  phoneVerified: false,
};

const preferencesFixture: PreferencesData = {
  language: AppLanguage.EN,
  currency: AppCurrency.USD,
  theme: AppTheme.SYSTEM,
};

const healthFixture: HealthData = {
  bloodType: null,
  dietaryPreference: null,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
};

const notificationPrefsFixture: NotificationPreferencesData = {
  optOuts: {},
};

const emergencyContactFixture: EmergencyContactDto = {
  id: 'ec-uuid-1',
  fullName: 'Jane Doe',
  phoneCountryCode: '+52',
  phoneLocalNumber: '5559876543',
  relationship: 'Sister',
  isPrimary: true,
};

const loyaltyProgramFixture: LoyaltyProgramDto = {
  id: 'lp-uuid-1',
  programName: 'Aeromexico Club Premier',
  memberId: 'CP123456',
  notes: null,
};

const nationalityFixture: NationalityDto = {
  id: 'nat-uuid-1',
  countryCode: 'MX',
  isPrimary: true,
  nationalIdNumber: null,
  passportNumber: 'G12345678',
  passportIssueDate: '2020-01-01',
  passportExpiryDate: '2030-01-01',
  passportStatus: PassportStatus.ACTIVE,
};

const etaFixture: EtaDto = {
  id: 'eta-uuid-1',
  userNationalityId: 'nat-uuid-1',
  passportNumber: 'G12345678',
  destinationCountry: 'CA',
  authorizationNumber: 'ETA123456',
  etaType: EtaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-01-01',
  etaStatus: DocumentStatus.ACTIVE,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const visaFixture: VisaDto = {
  id: 'visa-uuid-1',
  nationalityId: 'nat-uuid-1',
  coverageType: VisaCoverageType.COUNTRY,
  countryCode: 'US',
  visaZone: null,
  visaType: VisaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-06-01',
  visaStatus: DocumentStatus.ACTIVE,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const userSearchResponseFixture: UserSearchResponse = {
  data: [{ id: 'user-uuid-2', username: 'janedoe', displayName: 'Jane Doe', avatar: null }],
  total: 1,
};

const createEmergencyContactPayload: CreateEmergencyContactPayload = {
  fullName: 'Jane Doe',
  phoneCountryCode: '+52',
  phoneLocalNumber: '5559876543',
  relationship: 'Sister',
  isPrimary: true,
};

const createLoyaltyProgramPayload: CreateLoyaltyProgramPayload = {
  programName: 'Aeromexico Club Premier',
  memberId: 'CP123456',
  notes: null,
};

const createNationalityPayload: CreateNationalityPayload = {
  countryCode: 'MX',
  isPrimary: true,
  nationalIdNumber: null,
  passportNumber: 'G12345678',
  passportIssueDate: '2020-01-01',
  passportExpiryDate: '2030-01-01',
};

const createEtaPayload: CreateEtaPayload = {
  destinationCountry: 'CA',
  authorizationNumber: 'ETA123456',
  etaType: EtaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-01-01',
  notes: null,
};

const createVisaPayload: CreateVisaPayload = {
  coverageType: VisaCoverageType.COUNTRY,
  countryCode: 'US',
  visaZone: null,
  visaType: VisaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-06-01',
  notes: null,
};

const updateMePayload: UpdateMePayload = {
  displayName: 'Johnny Doe',
  timezone: 'America/New_York',
};

const updateAvatarPayload: UpdateAvatarPayload = {
  source: 'emoji',
  target: '👤',
};

// ─── User methods ─────────────────────────────────────────────────────────────

describe('getMe', () => {
  it('gets /v1/users/me and returns the user', async () => {
    mockGet.mockResolvedValueOnce({ data: appUserFixture });
    const result = await getMe();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me');
    expect(result).toEqual(appUserFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMe()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMe()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('getPublicProfile', () => {
  it('gets /v1/users/:username/profile and returns the profile', async () => {
    mockGet.mockResolvedValueOnce({ data: publicProfileFixture });
    const result = await getPublicProfile('johndoe');
    expect(mockGet).toHaveBeenCalledWith('/v1/users/johndoe/profile');
    expect(result).toEqual(publicProfileFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getPublicProfile('johndoe')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getPublicProfile('johndoe')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('updateMe', () => {
  it('patches /v1/users/me with the payload', async () => {
    mockPatch.mockResolvedValueOnce({});
    await updateMe(updateMePayload);
    expect(mockPatch).toHaveBeenCalledWith('/v1/users/me', updateMePayload);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateMe({})).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 422 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(updateMe({})).rejects.toEqual({ response: { status: 422 } });
  });
});

// ─── Profile methods ──────────────────────────────────────────────────────────

describe('getMyProfile', () => {
  it('gets /v1/users/me/profile and returns basic info', async () => {
    mockGet.mockResolvedValueOnce({ data: basicInfoFixture });
    const result = await getMyProfile();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/profile');
    expect(result).toEqual(basicInfoFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyProfile()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyProfile()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('getMyPersonalDetails', () => {
  it('gets /v1/users/me/profile and returns personal details', async () => {
    mockGet.mockResolvedValueOnce({ data: personalDetailsFixture });
    const result = await getMyPersonalDetails();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/profile');
    expect(result).toEqual(personalDetailsFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyPersonalDetails()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyPersonalDetails()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('updateMyProfile', () => {
  it('patches /v1/users/me/profile with the payload', async () => {
    mockPatch.mockResolvedValueOnce({});
    const dto = { bio: 'Updated bio' };
    await updateMyProfile(dto);
    expect(mockPatch).toHaveBeenCalledWith('/v1/users/me/profile', dto);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateMyProfile({})).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 422 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(updateMyProfile({})).rejects.toEqual({ response: { status: 422 } });
  });
});

describe('updateMyAvatar', () => {
  it('patches /v1/users/me/avatar with the payload', async () => {
    mockPatch.mockResolvedValueOnce({});
    await updateMyAvatar(updateAvatarPayload);
    expect(mockPatch).toHaveBeenCalledWith('/v1/users/me/avatar', updateAvatarPayload);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateMyAvatar(updateAvatarPayload)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 422 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(updateMyAvatar(updateAvatarPayload)).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

// ─── Preferences methods ──────────────────────────────────────────────────────

describe('getMyPreferences', () => {
  it('gets /v1/users/me/preferences and returns the preferences', async () => {
    mockGet.mockResolvedValueOnce({ data: preferencesFixture });
    const result = await getMyPreferences();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/preferences');
    expect(result).toEqual(preferencesFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyPreferences()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyPreferences()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('updateMyPreferences', () => {
  it('patches /v1/users/me/preferences with the payload', async () => {
    mockPatch.mockResolvedValueOnce({});
    const dto = { theme: AppTheme.DARK };
    await updateMyPreferences(dto);
    expect(mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', dto);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateMyPreferences({})).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 422 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(updateMyPreferences({})).rejects.toEqual({ response: { status: 422 } });
  });
});

// ─── Health methods ───────────────────────────────────────────────────────────

describe('getMyHealth', () => {
  it('gets /v1/users/me/health and returns the health data', async () => {
    mockGet.mockResolvedValueOnce({ data: healthFixture });
    const result = await getMyHealth();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/health');
    expect(result).toEqual(healthFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyHealth()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyHealth()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('updateMyHealth', () => {
  it('patches /v1/users/me/health with the payload', async () => {
    mockPatch.mockResolvedValueOnce({});
    await updateMyHealth(healthFixture);
    expect(mockPatch).toHaveBeenCalledWith('/v1/users/me/health', healthFixture);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateMyHealth(healthFixture)).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 422 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(updateMyHealth(healthFixture)).rejects.toEqual({ response: { status: 422 } });
  });
});

// ─── Notification preferences methods ────────────────────────────────────────

describe('getMyNotificationPreferences', () => {
  it('gets /v1/users/me/notification-preferences and returns the prefs', async () => {
    mockGet.mockResolvedValueOnce({ data: notificationPrefsFixture });
    const result = await getMyNotificationPreferences();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/notification-preferences');
    expect(result).toEqual(notificationPrefsFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyNotificationPreferences()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyNotificationPreferences()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('updateMyNotificationPreferences', () => {
  it('patches /v1/users/me/notification-preferences with the payload', async () => {
    mockPatch.mockResolvedValueOnce({});
    await updateMyNotificationPreferences(notificationPrefsFixture);
    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/users/me/notification-preferences',
      notificationPrefsFixture,
    );
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateMyNotificationPreferences(notificationPrefsFixture)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 422 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(updateMyNotificationPreferences(notificationPrefsFixture)).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

// ─── Emergency contact methods ────────────────────────────────────────────────

describe('getMyEmergencyContacts', () => {
  it('gets /v1/users/me/emergency-contacts and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [emergencyContactFixture] });
    const result = await getMyEmergencyContacts();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/emergency-contacts');
    expect(result).toEqual([emergencyContactFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyEmergencyContacts()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyEmergencyContacts()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('createEmergencyContact', () => {
  it('posts to /v1/users/me/emergency-contacts', async () => {
    mockPost.mockResolvedValueOnce({});
    await createEmergencyContact(createEmergencyContactPayload);
    expect(mockPost).toHaveBeenCalledWith(
      '/v1/users/me/emergency-contacts',
      createEmergencyContactPayload,
    );
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createEmergencyContact(createEmergencyContactPayload)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(createEmergencyContact(createEmergencyContactPayload)).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

describe('updateEmergencyContact', () => {
  it('patches /v1/users/me/emergency-contacts/:id', async () => {
    const dto: UpdateEmergencyContactPayload = { fullName: 'Jane Updated' };
    mockPatch.mockResolvedValueOnce({});
    await updateEmergencyContact('ec-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith('/v1/users/me/emergency-contacts/ec-uuid-1', dto);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateEmergencyContact('ec-uuid-1', {})).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateEmergencyContact('ec-uuid-1', {})).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('deleteEmergencyContact', () => {
  it('deletes /v1/users/me/emergency-contacts/:id', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteEmergencyContact('ec-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/users/me/emergency-contacts/ec-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteEmergencyContact('ec-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteEmergencyContact('ec-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Loyalty program methods ──────────────────────────────────────────────────

describe('getMyLoyaltyPrograms', () => {
  it('gets /v1/users/me/loyalty-programs and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [loyaltyProgramFixture] });
    const result = await getMyLoyaltyPrograms();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/loyalty-programs');
    expect(result).toEqual([loyaltyProgramFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyLoyaltyPrograms()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyLoyaltyPrograms()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('createLoyaltyProgram', () => {
  it('posts to /v1/users/me/loyalty-programs', async () => {
    mockPost.mockResolvedValueOnce({});
    await createLoyaltyProgram(createLoyaltyProgramPayload);
    expect(mockPost).toHaveBeenCalledWith(
      '/v1/users/me/loyalty-programs',
      createLoyaltyProgramPayload,
    );
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createLoyaltyProgram(createLoyaltyProgramPayload)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(createLoyaltyProgram(createLoyaltyProgramPayload)).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

describe('updateLoyaltyProgram', () => {
  it('patches /v1/users/me/loyalty-programs/:id', async () => {
    const dto: UpdateLoyaltyProgramPayload = { memberId: 'CP999' };
    mockPatch.mockResolvedValueOnce({});
    await updateLoyaltyProgram('lp-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith('/v1/users/me/loyalty-programs/lp-uuid-1', dto);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateLoyaltyProgram('lp-uuid-1', {})).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateLoyaltyProgram('lp-uuid-1', {})).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('deleteLoyaltyProgram', () => {
  it('deletes /v1/users/me/loyalty-programs/:id', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteLoyaltyProgram('lp-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/users/me/loyalty-programs/lp-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteLoyaltyProgram('lp-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteLoyaltyProgram('lp-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Nationality methods ──────────────────────────────────────────────────────

describe('getMyNationalities', () => {
  it('gets /v1/users/me/nationalities and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [nationalityFixture] });
    const result = await getMyNationalities();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/nationalities');
    expect(result).toEqual([nationalityFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyNationalities()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyNationalities()).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('createNationality', () => {
  it('posts to /v1/users/me/nationalities', async () => {
    mockPost.mockResolvedValueOnce({});
    await createNationality(createNationalityPayload);
    expect(mockPost).toHaveBeenCalledWith('/v1/users/me/nationalities', createNationalityPayload);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createNationality(createNationalityPayload)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(createNationality(createNationalityPayload)).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

describe('updateNationality', () => {
  it('patches /v1/users/me/nationalities/:id', async () => {
    const dto: UpdateNationalityPayload = { passportNumber: 'G99999999' };
    mockPatch.mockResolvedValueOnce({});
    await updateNationality('nat-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith('/v1/users/me/nationalities/nat-uuid-1', dto);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateNationality('nat-uuid-1', {})).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateNationality('nat-uuid-1', {})).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('deleteNationality', () => {
  it('deletes /v1/users/me/nationalities/:id', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteNationality('nat-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/users/me/nationalities/nat-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteNationality('nat-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteNationality('nat-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

// ─── ETA methods ──────────────────────────────────────────────────────────────

describe('getMyEtas', () => {
  it('gets /v1/users/me/nationalities/:nationalityId/etas and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [etaFixture] });
    const result = await getMyEtas('nat-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/nationalities/nat-uuid-1/etas');
    expect(result).toEqual([etaFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyEtas('nat-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyEtas('nat-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('createEta', () => {
  it('posts to /v1/users/me/nationalities/:nationalityId/etas', async () => {
    mockPost.mockResolvedValueOnce({});
    await createEta('nat-uuid-1', createEtaPayload);
    expect(mockPost).toHaveBeenCalledWith(
      '/v1/users/me/nationalities/nat-uuid-1/etas',
      createEtaPayload,
    );
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createEta('nat-uuid-1', createEtaPayload)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(createEta('nat-uuid-1', createEtaPayload)).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

describe('updateEta', () => {
  it('patches /v1/users/me/nationalities/:nationalityId/etas/:id', async () => {
    const dto: UpdateEtaPayload = { expiryDate: '2028-01-01' };
    mockPatch.mockResolvedValueOnce({});
    await updateEta('nat-uuid-1', 'eta-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/users/me/nationalities/nat-uuid-1/etas/eta-uuid-1',
      dto,
    );
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateEta('nat-uuid-1', 'eta-uuid-1', {})).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateEta('nat-uuid-1', 'eta-uuid-1', {})).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('deleteEta', () => {
  it('deletes /v1/users/me/nationalities/:nationalityId/etas/:id', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteEta('nat-uuid-1', 'eta-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith(
      '/v1/users/me/nationalities/nat-uuid-1/etas/eta-uuid-1',
    );
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteEta('nat-uuid-1', 'eta-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteEta('nat-uuid-1', 'eta-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Visa methods ─────────────────────────────────────────────────────────────

describe('getMyVisas', () => {
  it('gets /v1/users/me/nationalities/:nationalityId/visas and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [visaFixture] });
    const result = await getMyVisas('nat-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me/nationalities/nat-uuid-1/visas');
    expect(result).toEqual([visaFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyVisas('nat-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyVisas('nat-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('createVisa', () => {
  it('posts to /v1/users/me/nationalities/:nationalityId/visas', async () => {
    mockPost.mockResolvedValueOnce({});
    await createVisa('nat-uuid-1', createVisaPayload);
    expect(mockPost).toHaveBeenCalledWith(
      '/v1/users/me/nationalities/nat-uuid-1/visas',
      createVisaPayload,
    );
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createVisa('nat-uuid-1', createVisaPayload)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(createVisa('nat-uuid-1', createVisaPayload)).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

describe('updateVisa', () => {
  it('patches /v1/users/me/nationalities/:nationalityId/visas/:id', async () => {
    const dto: UpdateVisaPayload = { expiryDate: '2028-06-01' };
    mockPatch.mockResolvedValueOnce({});
    await updateVisa('nat-uuid-1', 'visa-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/users/me/nationalities/nat-uuid-1/visas/visa-uuid-1',
      dto,
    );
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateVisa('nat-uuid-1', 'visa-uuid-1', {})).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateVisa('nat-uuid-1', 'visa-uuid-1', {})).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('deleteVisa', () => {
  it('deletes /v1/users/me/nationalities/:nationalityId/visas/:id', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteVisa('nat-uuid-1', 'visa-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith(
      '/v1/users/me/nationalities/nat-uuid-1/visas/visa-uuid-1',
    );
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteVisa('nat-uuid-1', 'visa-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteVisa('nat-uuid-1', 'visa-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Username availability ────────────────────────────────────────────────────

describe('checkUsernameAvailable', () => {
  it('gets /v1/users/username-available with username baked into URL and returns the result', async () => {
    mockGet.mockResolvedValueOnce({ data: { available: true } });
    const result = await checkUsernameAvailable('johndoe');
    expect(mockGet).toHaveBeenCalledWith('/v1/users/username-available?username=johndoe');
    expect(result).toEqual({ available: true });
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(checkUsernameAvailable('johndoe')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(checkUsernameAvailable('johndoe')).rejects.toEqual({ response: { status: 404 } });
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('searchUsers', () => {
  it('gets /v1/users/search with params and returns the response', async () => {
    mockGet.mockResolvedValueOnce({ data: userSearchResponseFixture });
    const params = { q: 'jane', limit: 10 };
    const result = await searchUsers(params);
    expect(mockGet).toHaveBeenCalledWith('/v1/users/search', { params, signal: undefined });
    expect(result).toEqual(userSearchResponseFixture);
  });

  it('passes AbortSignal when provided', async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce({ data: userSearchResponseFixture });
    await searchUsers({ q: 'jane' }, controller.signal);
    expect(mockGet).toHaveBeenCalledWith('/v1/users/search', {
      params: { q: 'jane' },
      signal: controller.signal,
    });
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(searchUsers({ q: 'jane' })).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(searchUsers({ q: 'jane' })).rejects.toEqual({ response: { status: 404 } });
  });
});
