import { TripParticipantStatus } from '@chamuco/shared-types';

export { ORGANIZER_ROLES } from '@chamuco/shared-types';
export const ACTIVE_STATUSES = [
  TripParticipantStatus.ACCEPTED,
  TripParticipantStatus.CONFIRMED,
] as const;
