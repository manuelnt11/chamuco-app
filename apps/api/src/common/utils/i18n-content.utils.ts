/**
 * Converts a SCREAMING_SNAKE_CASE enum value to camelCase for use as an i18n key segment.
 * e.g. PASSPORT_EXPIRING_SOON → passportExpiringSoon
 */
export function toI18nPrefix(value: string): string {
  return value.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Filters a payload object down to only the primitive values accepted by nestjs-i18n
 * interpolation (string, number, boolean). Objects, arrays, null, and undefined are stripped.
 */
export function normalizeI18nArgs(
  payload: Record<string, unknown>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
      .map(([k, v]) => [k, v as string | number | boolean]),
  );
}
