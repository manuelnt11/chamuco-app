import { PassportStatus } from '@chamuco/shared-types';
import { computePassportStatus } from '@/common/utils/passport-status.util';

function dateOffset(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0]!;
}

describe('computePassportStatus', () => {
  it('returns OMITTED for null', () => {
    expect(computePassportStatus(null)).toBe(PassportStatus.OMITTED);
  });

  it('returns OMITTED for undefined', () => {
    expect(computePassportStatus(undefined)).toBe(PassportStatus.OMITTED);
  });

  it('returns EXPIRED for a past date', () => {
    expect(computePassportStatus(dateOffset(-1))).toBe(PassportStatus.EXPIRED);
  });

  it('returns EXPIRING_SOON for a date within 6 months', () => {
    expect(computePassportStatus(dateOffset(30))).toBe(PassportStatus.EXPIRING_SOON);
  });

  it('returns ACTIVE for a date beyond 6 months', () => {
    expect(computePassportStatus(dateOffset(200))).toBe(PassportStatus.ACTIVE);
  });
});
