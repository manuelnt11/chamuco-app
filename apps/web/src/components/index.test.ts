import { describe, it, expect, vi } from 'vitest';

// UserAvatar (exported from this barrel) imports useAuth → @/store/auth → @/lib/firebase → env validation.
// Mock the firebase layer so the env check never runs in this barrel test.
vi.mock('@/lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  facebookProvider: {},
}));
vi.mock('@/services/api-client', () => ({
  setTokenProvider: vi.fn(),
  apiClient: { get: vi.fn() },
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    currentUser: null,
    isLoading: false,
    signOut: vi.fn(),
  }),
}));

import { Button, ThemeProvider, ThemeToggle } from './index';

describe('Component exports', () => {
  it('exports all components', () => {
    expect(Button).toBeDefined();
    expect(ThemeProvider).toBeDefined();
    expect(ThemeToggle).toBeDefined();
  });

  it('exports are not null', () => {
    expect(Button).not.toBeNull();
    expect(ThemeProvider).not.toBeNull();
    expect(ThemeToggle).not.toBeNull();
  });

  it('exports are valid React components', () => {
    // Button is a forwardRef component (object)
    expect(Button).toBeTruthy();
    // ThemeProvider and ThemeToggle are function components
    expect(typeof ThemeProvider).toBe('function');
    expect(typeof ThemeToggle).toBe('function');
  });
});
