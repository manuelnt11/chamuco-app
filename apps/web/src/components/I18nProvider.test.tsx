/**
 * I18nProvider Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nProvider } from './I18nProvider';

// Mock the i18n client module
vi.mock('@/lib/i18n/client', () => ({
  initI18n: vi.fn(() => Promise.resolve()),
  getI18n: vi.fn(() => ({
    isInitialized: true,
    use: vi.fn(() => ({ init: vi.fn() })),
    t: vi.fn((key: string) => key),
    language: 'en',
    changeLanguage: vi.fn(),
  })),
}));

describe('I18nProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially', () => {
    render(
      <I18nProvider>
        <div>Child content</div>
      </I18nProvider>,
    );

    // Should show loading spinner (has animation classes)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('renders children after i18n initializes', async () => {
    const { initI18n } = await import('@/lib/i18n/client');

    render(
      <I18nProvider>
        <div>Child content</div>
      </I18nProvider>,
    );

    // Wait for i18n to initialize
    await waitFor(() => {
      expect(initI18n).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  it('passes i18n instance to I18nextProvider', async () => {
    const { getI18n } = await import('@/lib/i18n/client');

    render(
      <I18nProvider>
        <div>Test</div>
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(getI18n).toHaveBeenCalled();
    });
  });
});
