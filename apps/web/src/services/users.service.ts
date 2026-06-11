import { apiClient } from '@/services/api-client';
import type { AppUser } from '@/store/user';
import type { UserSearchResponse } from '@/types/user';
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
  UpdateMyProfilePayload,
  UpdateNationalityPayload,
  UpdateVisaPayload,
  VisaDto,
} from '@/services/users.types';

// ─── User methods ─────────────────────────────────────────────────────────────

export async function getMe(): Promise<AppUser> {
  const { data } = await apiClient.get<AppUser>('/v1/users/me');
  return data;
}

export async function getPublicProfile(username: string): Promise<PublicProfileData> {
  const { data } = await apiClient.get<PublicProfileData>(`/v1/users/${username}/profile`);
  return data;
}

export async function updateMe(dto: UpdateMePayload): Promise<void> {
  await apiClient.patch('/v1/users/me', dto);
}

// ─── Profile methods ──────────────────────────────────────────────────────────

export async function getMyProfile(): Promise<BasicInfoProfile> {
  const { data } = await apiClient.get<BasicInfoProfile>('/v1/users/me/profile');
  return data;
}

export async function getMyPersonalDetails(): Promise<PersonalDetailsProfile> {
  const { data } = await apiClient.get<PersonalDetailsProfile>('/v1/users/me/profile');
  return data;
}

export async function updateMyProfile(dto: UpdateMyProfilePayload): Promise<void> {
  await apiClient.patch('/v1/users/me/profile', dto);
}

export async function updateMyAvatar(dto: UpdateAvatarPayload): Promise<void> {
  await apiClient.patch('/v1/users/me/avatar', dto);
}

// ─── Preferences methods ──────────────────────────────────────────────────────

export async function getMyPreferences(): Promise<PreferencesData> {
  const { data } = await apiClient.get<PreferencesData>('/v1/users/me/preferences');
  return data;
}

export async function updateMyPreferences(dto: Partial<PreferencesData>): Promise<void> {
  await apiClient.patch('/v1/users/me/preferences', dto);
}

// ─── Health methods ───────────────────────────────────────────────────────────

export async function getMyHealth(): Promise<HealthData> {
  const { data } = await apiClient.get<HealthData>('/v1/users/me/health');
  return data;
}

export async function updateMyHealth(dto: HealthData): Promise<void> {
  await apiClient.patch('/v1/users/me/health', dto);
}

// ─── Notification preferences methods ────────────────────────────────────────

export async function getMyNotificationPreferences(): Promise<NotificationPreferencesData> {
  const { data } = await apiClient.get<NotificationPreferencesData>(
    '/v1/users/me/notification-preferences',
  );
  return data;
}

export async function updateMyNotificationPreferences(
  dto: NotificationPreferencesData,
): Promise<void> {
  await apiClient.patch('/v1/users/me/notification-preferences', dto);
}

// ─── Emergency contact methods ────────────────────────────────────────────────

export async function getMyEmergencyContacts(): Promise<EmergencyContactDto[]> {
  const { data } = await apiClient.get<EmergencyContactDto[]>('/v1/users/me/emergency-contacts');
  return data;
}

export async function createEmergencyContact(dto: CreateEmergencyContactPayload): Promise<void> {
  await apiClient.post('/v1/users/me/emergency-contacts', dto);
}

export async function updateEmergencyContact(
  id: string,
  dto: UpdateEmergencyContactPayload,
): Promise<void> {
  await apiClient.patch(`/v1/users/me/emergency-contacts/${id}`, dto);
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  await apiClient.delete(`/v1/users/me/emergency-contacts/${id}`);
}

// ─── Loyalty program methods ──────────────────────────────────────────────────

export async function getMyLoyaltyPrograms(): Promise<LoyaltyProgramDto[]> {
  const { data } = await apiClient.get<LoyaltyProgramDto[]>('/v1/users/me/loyalty-programs');
  return data;
}

export async function createLoyaltyProgram(dto: CreateLoyaltyProgramPayload): Promise<void> {
  await apiClient.post('/v1/users/me/loyalty-programs', dto);
}

export async function updateLoyaltyProgram(
  id: string,
  dto: UpdateLoyaltyProgramPayload,
): Promise<void> {
  await apiClient.patch(`/v1/users/me/loyalty-programs/${id}`, dto);
}

export async function deleteLoyaltyProgram(id: string): Promise<void> {
  await apiClient.delete(`/v1/users/me/loyalty-programs/${id}`);
}

// ─── Nationality methods ──────────────────────────────────────────────────────

export async function getMyNationalities(): Promise<NationalityDto[]> {
  const { data } = await apiClient.get<NationalityDto[]>('/v1/users/me/nationalities');
  return data;
}

export async function createNationality(dto: CreateNationalityPayload): Promise<void> {
  await apiClient.post('/v1/users/me/nationalities', dto);
}

export async function updateNationality(id: string, dto: UpdateNationalityPayload): Promise<void> {
  await apiClient.patch(`/v1/users/me/nationalities/${id}`, dto);
}

export async function deleteNationality(id: string): Promise<void> {
  await apiClient.delete(`/v1/users/me/nationalities/${id}`);
}

// ─── ETA methods ──────────────────────────────────────────────────────────────

export async function getMyEtas(nationalityId: string): Promise<EtaDto[]> {
  const { data } = await apiClient.get<EtaDto[]>(
    `/v1/users/me/nationalities/${nationalityId}/etas`,
  );
  return data;
}

export async function createEta(nationalityId: string, dto: CreateEtaPayload): Promise<void> {
  await apiClient.post(`/v1/users/me/nationalities/${nationalityId}/etas`, dto);
}

export async function updateEta(
  nationalityId: string,
  id: string,
  dto: UpdateEtaPayload,
): Promise<void> {
  await apiClient.patch(`/v1/users/me/nationalities/${nationalityId}/etas/${id}`, dto);
}

export async function deleteEta(nationalityId: string, id: string): Promise<void> {
  await apiClient.delete(`/v1/users/me/nationalities/${nationalityId}/etas/${id}`);
}

// ─── Visa methods ─────────────────────────────────────────────────────────────

export async function getMyVisas(nationalityId: string): Promise<VisaDto[]> {
  const { data } = await apiClient.get<VisaDto[]>(
    `/v1/users/me/nationalities/${nationalityId}/visas`,
  );
  return data;
}

export async function createVisa(nationalityId: string, dto: CreateVisaPayload): Promise<void> {
  await apiClient.post(`/v1/users/me/nationalities/${nationalityId}/visas`, dto);
}

export async function updateVisa(
  nationalityId: string,
  id: string,
  dto: UpdateVisaPayload,
): Promise<void> {
  await apiClient.patch(`/v1/users/me/nationalities/${nationalityId}/visas/${id}`, dto);
}

export async function deleteVisa(nationalityId: string, id: string): Promise<void> {
  await apiClient.delete(`/v1/users/me/nationalities/${nationalityId}/visas/${id}`);
}

// ─── Username availability ────────────────────────────────────────────────────

export async function checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
  const { data } = await apiClient.get<{ available: boolean }>(
    `/v1/users/username-available?username=${username}`,
  );
  return data;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchUsers(
  params: { q: string; limit?: number },
  signal?: AbortSignal,
): Promise<UserSearchResponse> {
  const { data } = await apiClient.get<UserSearchResponse>('/v1/users/search', { params, signal });
  return data;
}
