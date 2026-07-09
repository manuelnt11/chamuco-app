import { describe, it, expect } from 'vitest';
import { isValidCalendarDay, computeAge } from './date-utils';

describe('isValidCalendarDay', () => {
  it('returns true for a real calendar day', () => {
    expect(isValidCalendarDay(15, 6, 2000)).toBe(true);
  });

  it('returns false for day 31 in a 30-day month', () => {
    expect(isValidCalendarDay(31, 4, 2023)).toBe(false);
  });

  it('returns false for Feb 29 in a non-leap year', () => {
    expect(isValidCalendarDay(29, 2, 2023)).toBe(false);
  });

  it('returns true for Feb 29 in a leap year', () => {
    expect(isValidCalendarDay(29, 2, 2024)).toBe(true);
  });

  it('returns false for day 0', () => {
    expect(isValidCalendarDay(0, 1, 2000)).toBe(false);
  });

  it('returns false for month 13', () => {
    expect(isValidCalendarDay(1, 13, 2000)).toBe(false);
  });
});

describe('computeAge', () => {
  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;
  const y = today.getFullYear();

  it('returns 0 when born today', () => {
    expect(computeAge(d, m, y)).toBe(0);
  });

  it('returns exact age when birthday falls on today', () => {
    expect(computeAge(d, m, y - 30)).toBe(30);
  });

  it('returns age - 1 when birthday is tomorrow', () => {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const td = tomorrow.getDate();
    const tm = tomorrow.getMonth() + 1;
    // Born on tomorrow's date 20 years ago → birthday hasn't occurred yet this year
    expect(computeAge(td, tm, y - 20)).toBe(19);
  });

  it('returns full age when birthday was yesterday', () => {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yd = yesterday.getDate();
    const ym = yesterday.getMonth() + 1;
    const yy = y - 20;
    expect(computeAge(yd, ym, yy)).toBe(20);
  });
});
