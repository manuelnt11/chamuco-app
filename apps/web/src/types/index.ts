/**
 * Common types for the web application
 */

export type Theme = 'light' | 'dark' | 'system';

export type Locale = 'en' | 'es';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
}
