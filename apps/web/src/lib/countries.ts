import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

export type { CountryCode };

export interface CountryEntry {
  iso2: CountryCode;
  name: string;
  dialCode: string;
}

// When multiple countries share a dial code, these are the canonical ones.
const DIAL_CODE_PRIMARY: Record<string, CountryCode> = {
  '1': 'US', // NANP — US over AG, CA, and other territories
  '7': 'RU', // Russia over KZ
  '44': 'GB', // UK over GG, JE, IM
  '61': 'AU', // Australia over CC, CX
  '64': 'NZ', // New Zealand over PN
};

// First-wins so behavior is consistent with a linear find(); then overrides applied.
const CALLING_CODE_TO_ISO2 = new Map<string, CountryCode>();
for (const iso2 of getCountries()) {
  const code = getCountryCallingCode(iso2);
  if (!CALLING_CODE_TO_ISO2.has(code)) CALLING_CODE_TO_ISO2.set(code, iso2);
}
for (const [code, iso2] of Object.entries(DIAL_CODE_PRIMARY)) {
  CALLING_CODE_TO_ISO2.set(code, iso2);
}

export function getEmojiFlag(iso2: string): string {
  const upper = iso2.toUpperCase();
  const offset = 0x1f1e6 - 65;
  return String.fromCodePoint(upper.charCodeAt(0) + offset, upper.charCodeAt(1) + offset);
}

export function getCountryName(iso2: string, locale: string): string {
  try {
    const dn = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
    return (dn.of(iso2.toUpperCase()) ?? iso2).toUpperCase();
  } catch {
    return iso2;
  }
}

export function getCallingCodePrefix(iso2: string): string {
  try {
    return `+${getCountryCallingCode(iso2.toUpperCase() as CountryCode)}`;
  } catch {
    return '';
  }
}

export function isoByCallingCode(dialCode: string): CountryCode | undefined {
  return CALLING_CODE_TO_ISO2.get(dialCode);
}

export function buildCountryList(locale: string): CountryEntry[] {
  const dn = new Intl.DisplayNames([locale, 'en'], { type: 'region' });

  return getCountries()
    .map((iso2) => ({
      iso2,
      name: dn.of(iso2) ?? iso2,
      dialCode: getCountryCallingCode(iso2),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
