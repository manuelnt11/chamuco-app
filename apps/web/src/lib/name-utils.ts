export const NAME_REGEX = /^[\p{L}\s]+$/u;

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function humanizeId(id: string): string {
  return id
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
