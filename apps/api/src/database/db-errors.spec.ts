import { isUniqueViolation } from './db-errors';

describe('isUniqueViolation', () => {
  it('returns true for direct pg error code 23505', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  it('returns true when code is nested in cause (DrizzleQueryError shape)', () => {
    expect(isUniqueViolation({ cause: { code: '23505' } })).toBe(true);
  });

  it('returns false for a different pg error code', () => {
    expect(isUniqueViolation({ code: '42P01' })).toBe(false);
  });

  it('returns false for cause with different code', () => {
    expect(isUniqueViolation({ cause: { code: '42P01' } })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUniqueViolation(null)).toBe(false);
  });

  it('returns false for non-object primitives', () => {
    expect(isUniqueViolation('23505')).toBe(false);
    expect(isUniqueViolation(23505)).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(isUniqueViolation({})).toBe(false);
  });

  it('returns false when cause is null', () => {
    expect(isUniqueViolation({ cause: null })).toBe(false);
  });

  it('returns false when cause is not an object', () => {
    expect(isUniqueViolation({ cause: '23505' })).toBe(false);
  });
});
