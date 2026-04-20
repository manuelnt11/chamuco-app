import { sanitizeProperNoun } from './proper-noun.transform';

describe('sanitizeProperNoun', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeProperNoun('  JUAN  ')).toBe('JUAN');
  });

  it('collapses repeated internal spaces', () => {
    expect(sanitizeProperNoun('JUAN   CARLOS')).toBe('JUAN CARLOS');
  });

  it('converts to uppercase', () => {
    expect(sanitizeProperNoun('juan carlos')).toBe('JUAN CARLOS');
  });

  it('handles accented characters', () => {
    expect(sanitizeProperNoun('  garcía   lópez  ')).toBe('GARCÍA LÓPEZ');
  });

  it('trims and collapses in one pass', () => {
    expect(sanitizeProperNoun('  MANUEL     JOANN  ')).toBe('MANUEL JOANN');
  });

  it('returns non-string values unchanged', () => {
    expect(sanitizeProperNoun(null)).toBeNull();
    expect(sanitizeProperNoun(undefined)).toBeUndefined();
    expect(sanitizeProperNoun(42)).toBe(42);
  });
});
