import { plainToInstance, Type } from 'class-transformer';
import { IsObject, validate, ValidateNested } from 'class-validator';
import { computeAge, IsMinimumAge } from '@/modules/users/dto/minimum-age.validator';
import { DateOfBirthDto } from '@/modules/users/dto/date-of-birth.dto';

class TestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => DateOfBirthDto)
  @IsMinimumAge(16)
  dateOfBirth!: DateOfBirthDto;
}

function dobOf(
  yearsAgo: number,
  dayOffset = 0,
): { day: number; month: number; year: number; yearVisible: boolean } {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  d.setDate(d.getDate() + dayOffset);
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear(), yearVisible: false };
}

describe('computeAge', () => {
  it('returns correct age for past birthday this year', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 20);
    d.setDate(d.getDate() - 1);
    expect(computeAge({ day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() })).toBe(
      20,
    );
  });

  it('returns age - 1 when birthday not yet reached this year', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 20);
    d.setDate(d.getDate() + 1);
    expect(computeAge({ day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() })).toBe(
      19,
    );
  });

  it('returns correct age on exact birthday', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    expect(computeAge({ day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() })).toBe(
      16,
    );
  });

  it('returns -1 for null', () => {
    expect(computeAge(null)).toBe(-1);
  });

  it('returns -1 for non-object', () => {
    expect(computeAge('string')).toBe(-1);
  });

  it('returns -1 for object with non-finite values', () => {
    expect(computeAge({ day: NaN, month: 1, year: 2000 })).toBe(-1);
  });

  it('returns negative for future date', () => {
    const next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    expect(
      computeAge({ day: next.getDate(), month: next.getMonth() + 1, year: next.getFullYear() }),
    ).toBeLessThan(0);
  });
});

describe('@IsMinimumAge(16) decorator', () => {
  it('passes when age is exactly 16 today', async () => {
    const dto = plainToInstance(TestDto, { dateOfBirth: dobOf(16) });
    const errors = await validate(dto);
    const ageErrors = errors.filter((e) => e.constraints?.['isMinimumAge']);
    expect(ageErrors).toHaveLength(0);
  });

  it('passes when age is 30', async () => {
    const dto = plainToInstance(TestDto, { dateOfBirth: dobOf(30) });
    const errors = await validate(dto);
    const ageErrors = errors.filter((e) => e.constraints?.['isMinimumAge']);
    expect(ageErrors).toHaveLength(0);
  });

  it('fails when age is 15 years and 364 days', async () => {
    const dto = plainToInstance(TestDto, { dateOfBirth: dobOf(16, 1) });
    const errors = await validate(dto);
    const ageErrors = errors.filter((e) => e.constraints?.['isMinimumAge']);
    expect(ageErrors.length).toBeGreaterThan(0);
    expect(Object.values(ageErrors[0]?.constraints ?? {})[0]).toContain('16');
  });

  it('fails when dateOfBirth is null', async () => {
    const dto = plainToInstance(TestDto, { dateOfBirth: null });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'dateOfBirth')).toBe(true);
  });
});
