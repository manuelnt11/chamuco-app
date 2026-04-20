export function sanitizeProperNoun(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}
