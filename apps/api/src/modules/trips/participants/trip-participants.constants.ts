import { TripParticipantStatus, TripRole } from '@chamuco/shared-types';

export const ORGANIZER_ROLES = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER] as const;
export const ACTIVE_STATUSES = [
  TripParticipantStatus.ACCEPTED,
  TripParticipantStatus.CONFIRMED,
] as const;
