import type { TripStatus, TripVisibility } from '@chamuco/shared-types';

// ─── Request payloads ────────────────────────────────────────────────────────

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
