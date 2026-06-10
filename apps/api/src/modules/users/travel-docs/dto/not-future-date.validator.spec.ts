import { ValidationArguments } from 'class-validator';
import { IsNotFutureDateConstraint } from './not-future-date.validator';

function makeArgs(property = 'passportIssueDate'): ValidationArguments {
  return { object: {}, value: undefined, constraints: [], targetName: '', property };
}

const today = new Date().toISOString().split('T')[0] as string;
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0] as string;
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0] as string;

describe('IsNotFutureDateConstraint', () => {
  const constraint = new IsNotFutureDateConstraint();

  describe('skip cases (return true)', () => {
    it('returns true when value is not a string', () => {
      expect(constraint.validate(null)).toBe(true);
    });

    it('returns true when value is an empty string', () => {
      expect(constraint.validate('')).toBe(true);
    });

    it('returns true when value is an invalid date string', () => {
      expect(constraint.validate('not-a-date')).toBe(true);
    });
  });

  describe('comparison cases', () => {
    it('returns true for a past date', () => {
      expect(constraint.validate(yesterday)).toBe(true);
    });

    it('returns true for today', () => {
      expect(constraint.validate(today)).toBe(true);
    });

    it('returns false for a future date', () => {
      expect(constraint.validate(tomorrow)).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('includes the property name', () => {
      expect(constraint.defaultMessage(makeArgs())).toContain('passportIssueDate');
    });
  });
});
