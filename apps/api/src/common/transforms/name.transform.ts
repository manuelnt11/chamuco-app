export function sanitizeUpperCase(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.toUpperCase();
}

export function sanitizeProperNoun(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function sanitizeName(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
}
