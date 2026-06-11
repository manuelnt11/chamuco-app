import type {
  AppLanguage,
  AppCurrency,
  AppTheme,
  BloodType,
  DietaryPreference,
  FoodAllergen,
  PassportStatus,
  PhobiaType,
  PhysicalLimitationType,
  MedicalConditionType,
  DocumentStatus,
  EtaType,
  VisaEntries,
  VisaCoverageType,
  VisaZone,
  VisaType,
  DisabledNotificationChannels,
  ProfileVisibility,
  ResolvedAsset,
} from '@chamuco/shared-types';
import type { KeyStats } from '@/components/public-profile';

// ─── Basic info ───────────────────────────────────────────────────────────────

export interface BasicInfoProfile {
  bio: string | null;
  homeCountry: string | null;
}

// ─── Personal details ─────────────────────────────────────────────────────────

export interface PersonalDetailsProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: { day: number; month: number; year: number; yearVisible: boolean };
  phoneCountryCode: string;
  phoneLocalNumber: string;
  birthCountry: string | null;
  birthCity: string | null;
  homeCountry: string;
  homeCity: string | null;
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export interface PreferencesData {
  language: AppLanguage;
  currency: AppCurrency;
  theme: AppTheme;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthArrayItem {
  code: string;
  description: string;
}

export interface HealthData {
  bloodType: BloodType | null;
  dietaryPreference: DietaryPreference | null;
  dietaryNotes: string | null;
  generalMedicalNotes: string | null;
  foodAllergies: { allergen: FoodAllergen; description: string | null }[];
  phobias: { phobia: PhobiaType; description: string | null }[];
  physicalLimitations: { limitation: PhysicalLimitationType; description: string | null }[];
  medicalConditions: { condition: MedicalConditionType; description: string | null }[];
}

// ─── Notification preferences ─────────────────────────────────────────────────

export type NotificationPreferencesData = {
  optOuts: DisabledNotificationChannels;
};

// ─── Emergency contacts ───────────────────────────────────────────────────────

export interface EmergencyContactDto {
  id: string;
  fullName: string;
  phoneCountryCode: string;
  phoneLocalNumber: string;
  relationship: string;
  isPrimary: boolean;
}

// ─── Loyalty programs ─────────────────────────────────────────────────────────

export interface LoyaltyProgramDto {
  id: string;
  programName: string;
  memberId: string;
  notes: string | null;
}

// ─── Nationalities ────────────────────────────────────────────────────────────

export interface NationalityDto {
  id: string;
  countryCode: string;
  isPrimary: boolean;
  nationalIdNumber: string | null;
  passportNumber: string | null;
  passportIssueDate: string | null;
  passportExpiryDate: string | null;
  passportStatus: PassportStatus;
}

// ─── ETAs ─────────────────────────────────────────────────────────────────────

export interface EtaDto {
  id: string;
  userNationalityId: string;
  passportNumber: string;
  destinationCountry: string;
  authorizationNumber: string;
  etaType: EtaType;
  entries: VisaEntries;
  expiryDate: string;
  etaStatus: DocumentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Visas ────────────────────────────────────────────────────────────────────

export interface VisaDto {
  id: string;
  nationalityId: string;
  coverageType: VisaCoverageType;
  countryCode: string | null;
  visaZone: VisaZone | null;
  visaType: VisaType;
  entries: VisaEntries;
  expiryDate: string;
  visaStatus: DocumentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Payload types ────────────────────────────────────────────────────────────

export interface UpdateMePayload {
  displayName?: string;
  profileVisibility?: ProfileVisibility;
  timezone?: string;
}

export type UpdateMyProfilePayload = Partial<BasicInfoProfile & PersonalDetailsProfile>;

export interface UpdateAvatarPayload {
  source: 'emoji' | 'gcs';
  target: string;
  fileSize?: number;
}

export type CreateEmergencyContactPayload = Omit<EmergencyContactDto, 'id'>;
export type UpdateEmergencyContactPayload = Partial<Omit<EmergencyContactDto, 'id'>>;

export type CreateLoyaltyProgramPayload = Omit<LoyaltyProgramDto, 'id'>;
export type UpdateLoyaltyProgramPayload = Partial<Omit<LoyaltyProgramDto, 'id'>>;

export type CreateNationalityPayload = Omit<NationalityDto, 'id' | 'passportStatus'>;
export type UpdateNationalityPayload = Partial<Omit<NationalityDto, 'id' | 'passportStatus'>>;

export type CreateEtaPayload = Omit<
  EtaDto,
  'id' | 'userNationalityId' | 'passportNumber' | 'etaStatus' | 'createdAt' | 'updatedAt'
>;
export type UpdateEtaPayload = Partial<CreateEtaPayload>;

export type CreateVisaPayload = Omit<
  VisaDto,
  'id' | 'nationalityId' | 'visaStatus' | 'createdAt' | 'updatedAt'
>;
export type UpdateVisaPayload = Partial<CreateVisaPayload>;

// ─── Public profile ───────────────────────────────────────────────────────────

export interface PublicProfileData {
  username: string;
  displayName: string;
  avatar: ResolvedAsset | null;
  bio: string | null;
  profileVisibility: ProfileVisibility;
  travelerScore: number | null;
  achievements: string[] | null;
  recognitions: string[] | null;
  keyStats: KeyStats | null;
  discoveryMap: string[] | null;
}
