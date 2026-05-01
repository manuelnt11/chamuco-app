import { ValidationArguments } from 'class-validator';
import { IsDateAfterConstraint } from './date-after.validator';

function makeArgs(object: Record<string, unknown>, property = 'expiryDate'): ValidationArguments {
  return { object, value: undefined, constraints: ['issueDate'], targetName: '', property };
}

describe('IsDateAfterConstraint', () => {
  const constraint = new IsDateAfterConstraint();

  describe('skip cases (return true)', () => {
    it('returns true when value is not a string', () => {
      expect(constraint.validate(null, makeArgs({ issueDate: '2024-01-01' }))).toBe(true);
    });

    it('returns true when value is an empty string', () => {
      expect(constraint.validate('', makeArgs({ issueDate: '2024-01-01' }))).toBe(true);
    });

    it('returns true when related value is missing', () => {
      expect(constraint.validate('2025-01-01', makeArgs({}))).toBe(true);
    });

    it('returns true when related value is not a string', () => {
      expect(constraint.validate('2025-01-01', makeArgs({ issueDate: 20240101 as never }))).toBe(
        true,
      );
    });

    it('returns true when related value is an empty string', () => {
      expect(constraint.validate('2025-01-01', makeArgs({ issueDate: '' }))).toBe(true);
    });

    it('returns true when value is an invalid date string', () => {
      expect(constraint.validate('not-a-date', makeArgs({ issueDate: '2024-01-01' }))).toBe(true);
    });

    it('returns true when related value is an invalid date string', () => {
      expect(constraint.validate('2025-01-01', makeArgs({ issueDate: 'not-a-date' }))).toBe(true);
    });
  });

  describe('comparison cases', () => {
    it('returns true when value is strictly after related value', () => {
      expect(constraint.validate('2026-01-01', makeArgs({ issueDate: '2024-01-01' }))).toBe(true);
    });

    it('returns false when value is before related value', () => {
      expect(constraint.validate('2023-01-01', makeArgs({ issueDate: '2024-01-01' }))).toBe(false);
    });

    it('returns false when value equals related value (same day not allowed)', () => {
      expect(constraint.validate('2024-01-01', makeArgs({ issueDate: '2024-01-01' }))).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('includes the property name and related property name', () => {
      const args = makeArgs({ issueDate: '2024-01-01' }, 'passportExpiryDate');
      expect(constraint.defaultMessage(args)).toContain('passportExpiryDate');
      expect(constraint.defaultMessage(args)).toContain('issueDate');
    });
  });
});
