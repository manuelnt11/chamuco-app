export const NAME_REGEX = /^[\p{L}\s]+$/u;

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
