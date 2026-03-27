/**
 * Utility functions
 */

/**
 * Combines class names conditionally
 * @param classes - Array of class names or conditional expressions
 * @returns Combined class string
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a date to a localized string
 * @param date - Date to format
 * @param locale - Locale to use for formatting
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
