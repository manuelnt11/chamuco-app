/**
 * Validates that a returnTo value is a safe same-origin path before use in router.replace.
 * Rejects external URLs (https://...), protocol-relative paths (//...), and nulls.
 */
export function sanitizeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}
