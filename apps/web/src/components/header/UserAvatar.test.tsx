import { type ComponentProps, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileVisibility } from '@chamuco/shared-types';
import type { UserContextValue } from '@/store/user';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockRouterReplace: vi.fn(),
  mockRouterPush: vi.fn(),
  mockSignOut: vi.fn(),
  mockChangeLanguage: vi.fn(),
  mockPatch: vi.fn(),
  mockSetTheme: vi.fn(),
  mockUseTheme: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.mockRouterReplace, push: mocks.mockRouterPush }),
  usePathname: () => '/',
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => mocks.mockUseTheme(),
}));

vi.mock('@/lib/i18n/client', () => ({
  changeLanguage: mocks.mockChangeLanguage,
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/components/feedback/FeedbackModal', () => ({
  FeedbackModal: ({ open }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="feedback-modal" /> : null,
}));

// Menu primitives use portals — stub them so assertions work in jsdom
vi.mock('@/components/ui/menu', () => ({
  MenuRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MenuTrigger: ({ children, ...props }: ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  MenuPopup: ({ children }: { children: ReactNode }) => (
    <div data-testid="menu-popup">{children}</div>
  ),
  MenuItem: ({
    children,
    onClick,
    className,
  }: ComponentProps<'div'> & { onClick?: () => void }) => (
    <div role="menuitem" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  MenuSeparator: () => <hr />,
  MenuLabel: ({ children }: { children: ReactNode }) => (
    <div data-testid="menu-label">{children}</div>
  ),
}));

import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { UserAvatar } from './UserAvatar';
import { makeAuth, makeFirebaseUser } from '@test/mocks/auth';
import { toast } from '@/components/ui/toast';

// --- helpers ---

function makeAppUser(
  overrides: Partial<NonNullable<UserContextValue['appUser']>> = {},
): UserContextValue {
  return {
    appUser: {
      id: 'user-uuid',
      username: 'janedoe',
      displayName: 'Jane Doe',
      avatar: null,
      timezone: 'America/Bogota',
      profileVisibility: ProfileVisibility.PUBLIC,
      ...overrides,
    },
    isLoading: false,
    refresh: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockSignOut.mockResolvedValue(undefined);
  mocks.mockChangeLanguage.mockResolvedValue(undefined);
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });
  vi.mocked(useUser).mockReturnValue({
    appUser: null,
    isLoading: false,
    refresh: vi.fn(),
  });
});

describe('UserAvatar', () => {
  describe('loading state', () => {
    it('renders a non-interactive placeholder while auth state is loading', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ isLoading: true }));
      render(<UserAvatar />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders a non-interactive placeholder while user data is loading', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
      vi.mocked(useUser).mockReturnValue({ appUser: null, isLoading: true, refresh: vi.fn() });
      render(<UserAvatar />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated state', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: null }));
    });

    it('renders a sign-in button', () => {
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('navigates to /sign-in when clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar />);
      await user.click(screen.getByRole('button'));
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/sign-in');
    });
  });

  describe('authenticated state', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeFirebaseUser(), signOut: mocks.mockSignOut }),
      );
      vi.mocked(useUser).mockReturnValue(makeAppUser());
    });

    it('renders a trigger button', () => {
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows user initials from appUser displayName when avatar is null', () => {
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toHaveTextContent('JD');
    });

    it('shows a photo img when appUser has avatar url', () => {
      vi.mocked(useUser).mockReturnValue(
        makeAppUser({
          avatar: {
            id: 'a1',
            type: 'image',
            source: 'gcs',
            target: 'avatars/user-uuid/photo.jpg',
            isPublic: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            url: 'https://example.com/avatar.jpg',
          },
        }),
      );
      render(<UserAvatar />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('falls back to firebase photoURL when appUser has no avatar', () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({
          currentUser: makeFirebaseUser({ photoURL: 'https://firebase.example.com/photo.jpg' }),
        }),
      );
      vi.mocked(useUser).mockReturnValue(makeAppUser({ avatar: null }));
      render(<UserAvatar />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://firebase.example.com/photo.jpg');
    });

    it('renders the dropdown menu', () => {
      render(<UserAvatar />);
      expect(screen.getByTestId('menu-popup')).toBeInTheDocument();
    });

    it('shows appUser displayName in the menu label', () => {
      render(<UserAvatar />);
      expect(screen.getByTestId('menu-label')).toHaveTextContent('Jane Doe');
    });

    it('shows @username in the menu label', () => {
      render(<UserAvatar />);
      expect(screen.getByTestId('menu-label')).toHaveTextContent('@janedoe');
    });

    it('hides username line when appUser is null', () => {
      vi.mocked(useUser).mockReturnValue({ appUser: null, isLoading: false, refresh: vi.fn() });
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeFirebaseUser({ displayName: 'Firebase Name' }) }),
      );
      render(<UserAvatar />);
      const label = screen.getByTestId('menu-label');
      expect(label.querySelectorAll('p')).toHaveLength(1);
    });

    it('falls back to firebase displayName when appUser is null', () => {
      vi.mocked(useUser).mockReturnValue({ appUser: null, isLoading: false, refresh: vi.fn() });
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeFirebaseUser({ displayName: 'Firebase Name' }) }),
      );
      render(<UserAvatar />);
      expect(screen.getByTestId('menu-label')).toHaveTextContent('Firebase Name');
    });

    it('renders Profile, Theme, Language, Feedback and Sign out menu items', () => {
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      expect(items).toHaveLength(5);
    });

    it('navigates to /profile when Profile item is clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      await user.click(items[0]!);
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/profile');
    });

    it('cycles theme and persists it when the Theme item is clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      await user.click(items[1]!);
      expect(mocks.mockSetTheme).toHaveBeenCalledWith('dark');
      expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', { theme: 'DARK' });
    });

    it('cycles language and persists it when the Language item is clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      await user.click(items[2]!);
      expect(mocks.mockChangeLanguage).toHaveBeenCalledWith('es');
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', {
          language: 'ES',
        }),
      );
    });

    it('opens the feedback modal when the Feedback item is clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
      await user.click(items[3]!);
      expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
    });

    it('calls signOut and redirects to /sign-in when Sign out is clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      await user.click(items[4]!);
      await waitFor(() => expect(mocks.mockSignOut).toHaveBeenCalledOnce());
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/sign-in');
    });

    it('shows an error toast when signOut fails', async () => {
      mocks.mockSignOut.mockRejectedValue(new Error('network error'));
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      await user.click(items[4]!);
      await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    });
  });

  describe('initials generation', () => {
    it('generates two initials from a two-word display name', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
      vi.mocked(useUser).mockReturnValue(makeAppUser({ displayName: 'John Smith' }));
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toHaveTextContent('JS');
    });

    it('generates one initial from a single-word display name', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
      vi.mocked(useUser).mockReturnValue(makeAppUser({ displayName: 'Janedoe' }));
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toHaveTextContent('J');
    });

    it('falls back to firebase displayName initial when appUser is null', () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeFirebaseUser({ displayName: 'Admin User' }) }),
      );
      vi.mocked(useUser).mockReturnValue({ appUser: null, isLoading: false, refresh: vi.fn() });
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toHaveTextContent('AU');
    });
  });
});
