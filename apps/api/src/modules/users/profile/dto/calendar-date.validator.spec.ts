import { plainToInstance } from 'class-transformer';
import { validate, ValidationArguments } from 'class-validator';
import { IsRealCalendarDayConstraint } from './calendar-date.validator';
import { DateOfBirthDto } from './date-of-birth.dto';

async function validateDob(day: number, month: number, year: number): Promise<string[]> {
  const dto = plainToInstance(DateOfBirthDto, { day, month, year, yearVisible: true });
  const errors = await validate(dto);
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

function makeArgs(object: object): ValidationArguments {
  return { object, value: undefined, constraints: [], targetName: '', property: '' };
}

describe('IsRealCalendarDayConstraint — guard branches', () => {
  const constraint = new IsRealCalendarDayConstraint();

  it('returns true for non-number day', () => {
    expect(constraint.validate('foo', makeArgs({ month: 2, year: 2000 }))).toBe(true);
  });

  it('returns true when month is missing', () => {
    expect(constraint.validate(15, makeArgs({ year: 2000 }))).toBe(true);
  });

  it('returns true when year is missing', () => {
    expect(constraint.validate(15, makeArgs({ month: 6 }))).toBe(true);
  });

  it('returns true when month is out of range (>12)', () => {
    expect(constraint.validate(15, makeArgs({ month: 13, year: 2000 }))).toBe(true);
  });

  it('returns true when year is before 1900', () => {
    expect(constraint.validate(15, makeArgs({ month: 6, year: 1899 }))).toBe(true);
  });

  it('has a default error message mentioning calendar', () => {
    expect(constraint.defaultMessage()).toContain('calendar');
  });
});

describe('DateOfBirthDto — calendar date validation', () => {
  it('accepts a valid date (Feb 28)', async () => {
    expect(await validateDob(28, 2, 1990)).toHaveLength(0);
  });

  it('accepts Feb 29 on a leap year', async () => {
    expect(await validateDob(29, 2, 2000)).toHaveLength(0);
  });

  it('rejects Feb 29 on a non-leap year', async () => {
    const errors = await validateDob(29, 2, 1990);
    expect(errors.some((e) => e.includes('calendar'))).toBe(true);
  });

  it('rejects Feb 30', async () => {
    const errors = await validateDob(30, 2, 2000);
    expect(errors.some((e) => e.includes('calendar'))).toBe(true);
  });

  it('rejects Feb 31', async () => {
    const errors = await validateDob(31, 2, 2000);
    expect(errors.some((e) => e.includes('calendar'))).toBe(true);
  });

  it('rejects April 31 (month with 30 days)', async () => {
    const errors = await validateDob(31, 4, 2000);
    expect(errors.some((e) => e.includes('calendar'))).toBe(true);
  });

  it('accepts December 31', async () => {
    expect(await validateDob(31, 12, 1990)).toHaveLength(0);
  });
});
