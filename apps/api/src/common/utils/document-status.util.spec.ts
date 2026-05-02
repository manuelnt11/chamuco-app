import { DocumentStatus } from '@chamuco/shared-types';
import { computeDocumentStatus } from './document-status.util';

const dateOffset = (days: number): string => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0]!;
};

describe('computeDocumentStatus', () => {
  it('returns EXPIRED when expiry date is in the past', () => {
    expect(computeDocumentStatus(dateOffset(-1))).toBe(DocumentStatus.EXPIRED);
  });

  it('returns EXPIRING_SOON when expiry is within 30 days', () => {
    expect(computeDocumentStatus(dateOffset(15))).toBe(DocumentStatus.EXPIRING_SOON);
  });

  it('returns EXPIRING_SOON when expiry is 29 days from now (last day inside the window)', () => {
    expect(computeDocumentStatus(dateOffset(29))).toBe(DocumentStatus.EXPIRING_SOON);
  });

  it('returns ACTIVE on the boundary (exactly 30 days from now — not less than threshold)', () => {
    expect(computeDocumentStatus(dateOffset(30))).toBe(DocumentStatus.ACTIVE);
  });

  it('returns ACTIVE when expiry is beyond 30 days', () => {
    expect(computeDocumentStatus(dateOffset(31))).toBe(DocumentStatus.ACTIVE);
  });

  it('returns ACTIVE when expiry is far in the future', () => {
    expect(computeDocumentStatus(dateOffset(365))).toBe(DocumentStatus.ACTIVE);
  });
});
