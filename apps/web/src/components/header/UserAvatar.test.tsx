import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from 'firebase/auth';
import type { AuthContextValue } from '@/store/auth';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockRouterReplace: vi.fn(),
  mockRouterPush: vi.fn(),
  mockSignOut: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.mockRouterReplace, push: mocks.mockRouterPush }),
  usePathname: () => '/',
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.mockToastError },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Menu primitives use portals — stub them so assertions work in jsdom
vi.mock('@/components/ui/menu', () => ({
  MenuRoot: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MenuTrigger: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  MenuPopup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="menu-popup">{children}</div>
  ),
  MenuItem: ({
    children,
    onClick,
    className,
  }: React.ComponentProps<'div'> & { onClick?: () => void }) => (
    <div role="menuitem" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  MenuSeparator: () => <hr />,
  MenuLabel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="menu-label">{children}</div>
  ),
}));

import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from './UserAvatar';

// --- helpers ---

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    currentUser: null,
    idToken: null,
    isLoading: false,
    getIdToken: vi.fn().mockResolvedValue(null),
    signInWithGoogle: vi.fn(),
    signInWithFacebook: vi.fn(),
    signOut: mocks.mockSignOut,
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'uid-123',
    displayName: 'Jane Doe',
    email: 'jane@example.com',
    photoURL: null,
    ...overrides,
  } as User;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockSignOut.mockResolvedValue(undefined);
});

describe('UserAvatar', () => {
  describe('loading state', () => {
    it('renders a non-interactive placeholder while auth state is loading', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ isLoading: true }));
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
      vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeUser() }));
    });

    it('renders a trigger button', () => {
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows user initials when photoURL is null', () => {
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toHaveTextContent('JD');
    });

    it('shows a photo img when photoURL is set', () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ photoURL: 'https://example.com/avatar.jpg' }) }),
      );
      render(<UserAvatar />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders the dropdown menu', () => {
      render(<UserAvatar />);
      expect(screen.getByTestId('menu-popup')).toBeInTheDocument();
    });

    it('shows the display name in the menu label', () => {
      render(<UserAvatar />);
      expect(screen.getByTestId('menu-label')).toHaveTextContent('Jane Doe');
    });

    it('shows the email in the menu label when different from display name', () => {
      render(<UserAvatar />);
      expect(screen.getByTestId('menu-label')).toHaveTextContent('jane@example.com');
    });

    it('hides the email line when displayName equals email', () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({
          currentUser: makeUser({ displayName: null, email: 'jane@example.com' }),
        }),
      );
      render(<UserAvatar />);
      // email is used as displayName — the secondary email line should not appear twice
      const label = screen.getByTestId('menu-label');
      expect(label.querySelectorAll('p')).toHaveLength(1);
    });

    it('renders Profile and Sign out menu items', () => {
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      expect(items).toHaveLength(2);
    });

    it('navigates to /profile when Profile item is clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      await user.click(items[0]!);
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/profile');
    });

    it('calls signOut and redirects to /sign-in when Sign out is clicked', async () => {
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      await user.click(items[1]!);
      await waitFor(() => expect(mocks.mockSignOut).toHaveBeenCalledOnce());
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/sign-in');
    });

    it('shows an error toast when signOut fails', async () => {
      mocks.mockSignOut.mockRejectedValue(new Error('network error'));
      const user = userEvent.setup();
      render(<UserAvatar />);
      const items = screen.getAllByRole('menuitem');
      await user.click(items[1]!);
      await waitFor(() => expect(mocks.mockToastError).toHaveBeenCalled());
    });
  });

  describe('initials generation', () => {
    it('generates two initials from a two-word display name', () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ displayName: 'John Smith' }) }),
      );
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toHaveTextContent('JS');
    });

    it('falls back to email-based initial when displayName is null', () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ displayName: null, email: 'admin@example.com' }) }),
      );
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toHaveTextContent('A');
    });

    it('shows "?" initial when both displayName and email are null', () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ displayName: null, email: null }) }),
      );
      render(<UserAvatar />);
      expect(screen.getByRole('button')).toHaveTextContent('?');
    });
  });
});
