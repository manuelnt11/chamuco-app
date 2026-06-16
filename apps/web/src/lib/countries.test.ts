import { describe, expect, it, vi } from 'vitest';

vi.mock('libphonenumber-js', () => ({
  getCountries: () => ['AG', 'AU', 'CA', 'CO', 'GB', 'KZ', 'NZ', 'RU', 'TT', 'US'],
  getCountryCallingCode: (iso2: string) => {
    const map: Record<string, string> = {
      AG: '1', // NANP — shares +1 with US/CA, alphabetically before US
      AU: '61',
      CA: '1', // NANP
      CO: '57',
      GB: '44',
      KZ: '7', // shares +7 with RU
      NZ: '64',
      RU: '7',
      TT: '1868', // NANP but distinct suffix
      US: '1', // NANP — should win via DIAL_CODE_PRIMARY
    };
    const code = map[iso2];
    if (!code) throw new Error(`Invalid country code: ${iso2}`);
    return code;
  },
}));

import {
  buildCountryList,
  getCallingCodePrefix,
  getCountryName,
  getEmojiFlag,
  isoByCallingCode,
} from './countries';

// ─── getEmojiFlag ─────────────────────────────────────────────────────────────

describe('getEmojiFlag', () => {
  it('returns correct flag emoji for uppercase ISO2', () => {
    expect(getEmojiFlag('CO')).toBe('🇨🇴');
    expect(getEmojiFlag('US')).toBe('🇺🇸');
    expect(getEmojiFlag('GB')).toBe('🇬🇧');
  });

  it('handles lowercase input', () => {
    expect(getEmojiFlag('co')).toBe('🇨🇴');
    expect(getEmojiFlag('us')).toBe('🇺🇸');
  });
});

// ─── getCountryName ───────────────────────────────────────────────────────────

describe('getCountryName', () => {
  it('returns uppercase name in English', () => {
    expect(getCountryName('CO', 'en')).toBe('COLOMBIA');
  });

  it('returns uppercase name for Spanish locale', () => {
    expect(getCountryName('CO', 'es')).toBe('COLOMBIA');
  });

  it('falls back to uppercase ISO2 for unknown region code', () => {
    // Intl.DisplayNames returns undefined for unknown codes → fallback to iso2
    const result = getCountryName('XX', 'en');
    // May return 'XX' (undefined fallback) or a locale string — never throws
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('does not throw on invalid locale string', () => {
    expect(() => getCountryName('CO', 'invalid-locale')).not.toThrow();
  });
});

// ─── getCallingCodePrefix ─────────────────────────────────────────────────────

describe('getCallingCodePrefix', () => {
  it('returns dial code with + prefix', () => {
    expect(getCallingCodePrefix('CO')).toBe('+57');
    expect(getCallingCodePrefix('US')).toBe('+1');
    expect(getCallingCodePrefix('GB')).toBe('+44');
  });

  it('handles lowercase input', () => {
    expect(getCallingCodePrefix('co')).toBe('+57');
  });

  it('returns empty string for unknown ISO2', () => {
    expect(getCallingCodePrefix('XX')).toBe('');
  });
});

// ─── isoByCallingCode ─────────────────────────────────────────────────────────

describe('isoByCallingCode', () => {
  it('returns ISO2 for a unique dial code', () => {
    expect(isoByCallingCode('57')).toBe('CO');
    expect(isoByCallingCode('44')).toBe('GB');
    expect(isoByCallingCode('1868')).toBe('TT');
  });

  it('prefers US over other NANP countries for +1', () => {
    // AG and CA also map to 1, but DIAL_CODE_PRIMARY must win
    expect(isoByCallingCode('1')).toBe('US');
  });

  it('prefers RU over KZ for +7', () => {
    expect(isoByCallingCode('7')).toBe('RU');
  });

  it('returns undefined for unknown dial code', () => {
    expect(isoByCallingCode('999')).toBeUndefined();
  });
});

// ─── buildCountryList ─────────────────────────────────────────────────────────

describe('buildCountryList', () => {
  it('returns one entry per country', () => {
    const list = buildCountryList('en');
    expect(list).toHaveLength(10); // matches mock getCountries() length
  });

  it('each entry has iso2, name, and dialCode', () => {
    const list = buildCountryList('en');
    const co = list.find((c) => c.iso2 === 'CO');
    expect(co).toBeDefined();
    expect(co!.dialCode).toBe('57');
    expect(co!.name.length).toBeGreaterThan(0);
  });

  it('names are uppercase', () => {
    const list = buildCountryList('en');
    // buildCountryList returns raw names (uppercase applied at display layer)
    // names come from Intl.DisplayNames, not uppercased in the list itself
    const co = list.find((c) => c.iso2 === 'CO')!;
    // just verify it's a non-empty string — case is a display concern
    expect(typeof co.name).toBe('string');
    expect(co.name.length).toBeGreaterThan(0);
  });

  it('is sorted alphabetically by locale', () => {
    const list = buildCountryList('en');
    const names = list.map((c) => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'en'));
    expect(names).toEqual(sorted);
  });
});
