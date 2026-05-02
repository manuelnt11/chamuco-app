import { DocumentStatus } from '@chamuco/shared-types';

export function computeDocumentStatus(expiryDate: string): DocumentStatus {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setUTCDate(thirtyDaysFromNow.getUTCDate() + 30);
  const expiry = new Date(expiryDate);
  if (expiry < today) return DocumentStatus.EXPIRED;
  if (expiry < thirtyDaysFromNow) return DocumentStatus.EXPIRING_SOON;
  return DocumentStatus.ACTIVE;
}
