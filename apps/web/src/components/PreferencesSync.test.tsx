import { render, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';

const mocks = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSetTheme: vi.fn(),
  mockChangeLanguage: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mocks.mockGet },
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme: mocks.mockSetTheme }),
}));

vi.mock('@/lib/i18n/client', () => ({
  changeLanguage: mocks.mockChangeLanguage,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

import { PreferencesSync } from './PreferencesSync';

const fakeUser = { uid: 'uid-123' } as User;

function renderSync() {
  return render(<PreferencesSync />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockChangeLanguage.mockResolvedValue(undefined);
  mocks.mockGet.mockResolvedValue({ data: { language: 'EN', theme: 'DARK' } });
});

describe('PreferencesSync', () => {
  it('does nothing while auth is loading', () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: null, isLoading: true });
    renderSync();
    expect(mocks.mockGet).not.toHaveBeenCalled();
  });

  it('does nothing when there is no current user', () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: null, isLoading: false });
    renderSync();
    expect(mocks.mockGet).not.toHaveBeenCalled();
  });

  it('fetches preferences and applies language + theme on login', async () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser, isLoading: false });
    renderSync();
    await waitFor(() => expect(mocks.mockGet).toHaveBeenCalledWith('/v1/users/me/preferences'));
    expect(mocks.mockChangeLanguage).toHaveBeenCalledWith('en');
    expect(mocks.mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('does not re-fetch on re-render for the same user', async () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser, isLoading: false });
    const { rerender } = renderSync();
    await waitFor(() => expect(mocks.mockGet).toHaveBeenCalledOnce());
    rerender(<PreferencesSync />);
    expect(mocks.mockGet).toHaveBeenCalledOnce();
  });

  it('re-fetches after logout and re-login', async () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser, isLoading: false });
    const { rerender } = renderSync();
    await waitFor(() => expect(mocks.mockGet).toHaveBeenCalledOnce());

    mocks.mockUseAuth.mockReturnValue({ currentUser: null, isLoading: false });
    rerender(<PreferencesSync />);

    const newUser = { uid: 'uid-456' } as User;
    mocks.mockUseAuth.mockReturnValue({ currentUser: newUser, isLoading: false });
    rerender(<PreferencesSync />);
    await waitFor(() => expect(mocks.mockGet).toHaveBeenCalledTimes(2));
  });

  it('fails silently when the preferences endpoint returns an error', async () => {
    mocks.mockGet.mockRejectedValue(new Error('network error'));
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser, isLoading: false });
    renderSync();
    await waitFor(() => expect(mocks.mockGet).toHaveBeenCalled());
    expect(mocks.mockChangeLanguage).not.toHaveBeenCalled();
    expect(mocks.mockSetTheme).not.toHaveBeenCalled();
  });
});
