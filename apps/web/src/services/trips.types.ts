import type {
  TripParticipantStatus,
  TripRole,
  TripStatus,
  TripVisibility,
} from '@chamuco/shared-types';

// Mirrors the NestJS DTOs in apps/api/src/modules/trips/dto/.
// When the backend adds or removes fields, update this file to match.

// ─── Request payloads ────────────────────────────────────────────────────────

interface CoverPayload {
  source: 'emoji' | 'gcs';
  target: string;
  fileSize?: number;
}

export interface CreateTripPayload {
  name: string;
  description?: string;
  visibility: TripVisibility;
  startDate: string;
  endDate: string;
  participantCapacity: number;
  departureCountry: string;
  departureCity: string;
  landingCountry: string;
  landingCity: string;
  defaultTimezone?: string;
  defaultCurrency?: string;
  itineraryNotes?: string;
  isTravelingParticipant: boolean;
  cover: CoverPayload;
}

export interface UpdateTripPayload {
  name?: string;
  description?: string;
  visibility?: TripVisibility;
  startDate?: string;
  endDate?: string;
  participantCapacity?: number;
  departureCountry?: string;
  departureCity?: string;
  landingCountry?: string;
  landingCity?: string;
  defaultTimezone?: string;
  defaultCurrency?: string;
  itineraryNotes?: string;
  cover?: CoverPayload;
}

export interface TransitionTripStatusPayload {
  status: TripStatus;
}

export interface CreateDestinationPayload {
  countryCode: string;
  city: string;
  label?: string;
}

export interface UpdateDestinationPayload {
  countryCode?: string;
  city?: string;
  label?: string;
}

export interface ReorderDestinationsPayload {
  destinationIds: string[];
}

export interface AddTripGroupPayload {
  groupId: string;
}

// ─── Response shapes ─────────────────────────────────────────────────────────

export interface TripResponse {
  id: string;
  name: string;
  description: string | null;
  status: TripStatus;
  visibility: TripVisibility;
  startDate: string;
  endDate: string;
  participantCapacity: number;
  departureCountry: string;
  departureCity: string;
  landingCountry: string;
  landingCity: string;
  defaultTimezone: string | null;
  defaultCurrency: string | null;
  itineraryNotes: string | null;
  agencyId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  requiresConfirmation: boolean;
  feedbackOpenUntil: string | null;
  coverUrl: string | null;
}

export interface MyTripListItemResponse extends TripResponse {
  confirmedParticipantCount: number;
  userRole: TripRole;
}

export interface DestinationResponse {
  id: string;
  tripId: string;
  position: number;
  countryCode: string;
  city: string;
  label: string | null;
  createdAt: string;
}

export interface DestinationWriteResponse extends DestinationResponse {
  requiresConfirmation: boolean;
}

export interface TripGroupResponse {
  tripId: string;
  groupId: string;
  addedAt: string;
}

export interface TripParticipantResponse {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: TripRole;
  isTraveler: boolean;
  confirmedAt: string | null;
}

export interface PendingTripParticipantResponse {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: TripParticipantStatus.INVITED | TripParticipantStatus.PENDING_REQUEST;
  initiatedAt: string;
}

export interface MyTripParticipationResponse {
  status: TripParticipantStatus;
  role: TripRole;
  isTraveler: boolean;
}

export interface UpdateParticipantRolePayload {
  role: TripRole;
}

export interface CreateTripInvitationPayload {
  usernames: string[];
}

export interface MyTripInvitationResponse {
  trip: {
    id: string;
    name: string;
    coverUrl: string | null;
  };
  initiatedAt: string;
}
