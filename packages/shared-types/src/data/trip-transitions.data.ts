import { TripStatus } from '../enums/trip-status.enum';

export const VALID_TRANSITIONS: Partial<Record<TripStatus, readonly TripStatus[]>> = {
  [TripStatus.DRAFT]: [TripStatus.OPEN, TripStatus.CANCELLED],
  [TripStatus.OPEN]: [TripStatus.CONFIRMED, TripStatus.CANCELLED],
  [TripStatus.CONFIRMED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
};
