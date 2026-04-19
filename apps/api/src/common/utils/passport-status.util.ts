import { PassportStatus } from '@chamuco/shared-types';

export function computePassportStatus(expiryDate?: string | null): PassportStatus {
  if (!expiryDate) return PassportStatus.OMITTED;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setUTCMonth(sixMonthsFromNow.getUTCMonth() + 6);
  const expiry = new Date(expiryDate);
  if (expiry < today) return PassportStatus.EXPIRED;
  if (expiry < sixMonthsFromNow) return PassportStatus.EXPIRING_SOON;
  return PassportStatus.ACTIVE;
}
