/**
 * Checks if the current pathname matches the given navigation item path.
 * For the home path ('/'), it requires an exact match.
 * For other paths, it checks if the pathname is exactly the item path or starts with the item path followed by a slash.
 * This prevents false positives like '/trips-archive' matching '/trips'.
 *
 * @param pathname - The current pathname from usePathname()
 * @param itemPath - The navigation item's path
 * @returns true if the route is active, false otherwise
 */
export function isActiveRoute(pathname: string, itemPath: string): boolean {
  if (itemPath === '/') {
    return pathname === '/';
  }
  return pathname === itemPath || pathname.startsWith(itemPath + '/');
}

/**
 * Generates an accessible ARIA label for navigation items.
 *
 * @param label - The translated label for the navigation item
 * @param isActive - Whether the navigation item is currently active
 * @returns An ARIA label string
 */
export function getNavItemAriaLabel(label: string, isActive: boolean): string {
  return isActive ? `${label} (current page)` : label;
}
