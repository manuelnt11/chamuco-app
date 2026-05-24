import { normalizeI18nArgs, toI18nPrefix } from './i18n-content.utils';

describe('toI18nPrefix()', () => {
  it('converts SCREAMING_SNAKE_CASE to camelCase', () => {
    expect(toI18nPrefix('PASSPORT_EXPIRING_SOON')).toBe('passportExpiringSoon');
    expect(toI18nPrefix('GROUP_ANNOUNCEMENT')).toBe('groupAnnouncement');
    expect(toI18nPrefix('WELCOME_EMAIL')).toBe('welcomeEmail');
  });

  it('handles single-word values', () => {
    expect(toI18nPrefix('COMPLETED')).toBe('completed');
  });
});

describe('normalizeI18nArgs()', () => {
  it('keeps string values', () => {
    expect(normalizeI18nArgs({ name: 'Alice' })).toEqual({ name: 'Alice' });
  });

  it('keeps number values', () => {
    expect(normalizeI18nArgs({ count: 3 })).toEqual({ count: 3 });
  });

  it('keeps boolean values', () => {
    expect(normalizeI18nArgs({ enabled: true })).toEqual({ enabled: true });
  });

  it('strips object values', () => {
    expect(normalizeI18nArgs({ meta: { nested: true }, label: 'x' })).toEqual({ label: 'x' });
  });

  it('strips null and undefined', () => {
    expect(normalizeI18nArgs({ a: null, b: undefined, c: 'keep' })).toEqual({ c: 'keep' });
  });

  it('returns empty object for empty payload', () => {
    expect(normalizeI18nArgs({})).toEqual({});
  });
});
