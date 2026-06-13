import { TripStatus } from '@chamuco/shared-types';

export const STATUS_CLASSES: Record<TripStatus, string> = {
  [TripStatus.DRAFT]: 'bg-muted text-muted-foreground',
  [TripStatus.OPEN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [TripStatus.CONFIRMED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [TripStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  [TripStatus.COMPLETED]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  [TripStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const STATUS_I18N_KEYS: Record<TripStatus, string> = {
  [TripStatus.DRAFT]: 'status.draft',
  [TripStatus.OPEN]: 'status.open',
  [TripStatus.CONFIRMED]: 'status.confirmed',
  [TripStatus.IN_PROGRESS]: 'status.inProgress',
  [TripStatus.COMPLETED]: 'status.completed',
  [TripStatus.CANCELLED]: 'status.cancelled',
};
