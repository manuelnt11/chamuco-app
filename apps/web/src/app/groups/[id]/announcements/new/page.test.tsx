import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { GroupRole } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseUser: vi.fn(),
  mockRouterPush: vi.fn(),
  mockRouterReplace: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: 'group-id' }),
  };
});

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => {
  let stableRouter: {
    push: typeof mocks.mockRouterPush;
    replace: typeof mocks.mockRouterReplace;
  } | null = null;
  return {
    useRouter: () => {
      if (!stableRouter)
        stableRouter = { push: mocks.mockRouterPush, replace: mocks.mockRouterReplace };
      return stableRouter;
    },
  };
});

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mocks.mockApiGet, post: mocks.mockApiPost },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: mocks.mockUseUser,
}));

vi.mock('@phosphor-icons/react', () => ({
  ArrowLeftIcon: () => <span data-testid="arrow-left-icon" />,
  MegaphoneIcon: () => <span data-testid="megaphone-icon" />,
}));

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) {
        const interpolated = Object.entries(opts).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, v),
          key,
        );
        return interpolated === key ? [key, ...Object.values(opts)].join(' ') : interpolated;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

import NewAnnouncementPage from './page';

const mockGroup = {
  id: 'group-id',
  name: 'Mountain Crew',
  description: null,
  coverUrl: '',
  visibility: 'PUBLIC',
  createdBy: 'admin-id',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockAnnouncement = {
  id: 'a1',
  groupId: 'group-id',
  createdByUsername: 'admin-user',
  content: 'Trip departs Sunday at 6am.',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function setupMocks(role: GroupRole | null = GroupRole.OWNER) {
  mocks.mockUseAuth.mockReturnValue({ isLoading: false });
  mocks.mockUseUser.mockReturnValue({ appUser: { id: 'admin-id' }, isLoading: false });

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/members/me')) {
      if (role === null) return Promise.reject(new Error('Not member'));
      return Promise.resolve({ data: { status: 'active', role } });
    }
    return Promise.resolve({ data: mockGroup });
  });

  mocks.mockApiPost.mockResolvedValue({ data: mockAnnouncement });
}

describe('NewAnnouncementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor for group owner', async () => {
    setupMocks(GroupRole.OWNER);
    render(<NewAnnouncementPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'announcementsSubmit' })).toBeInTheDocument();
    });
  });

  it('renders editor for group admin', async () => {
    setupMocks(GroupRole.ADMIN);
    render(<NewAnnouncementPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
    });
  });

  it('redirects non-admin member to group announcements page', async () => {
    setupMocks(GroupRole.MEMBER);
    render(<NewAnnouncementPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/groups/group-id');
    });
  });

  it('redirects non-member to group announcements page', async () => {
    setupMocks(null);
    render(<NewAnnouncementPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/groups/group-id');
    });
  });

  it('shows group name in back link', async () => {
    setupMocks();
    render(<NewAnnouncementPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Mountain Crew/ });
      expect(link).toHaveAttribute('href', '/groups/group-id');
    });
  });

  it('submit button is disabled when editor is empty', async () => {
    setupMocks();
    render(<NewAnnouncementPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'announcementsSubmit' })).toBeDisabled();
    });
  });

  it('submits announcement and redirects to group page', async () => {
    setupMocks();
    const user = userEvent.setup();
    render(<NewAnnouncementPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => screen.getByPlaceholderText('announcementsPlaceholder'));

    await user.type(screen.getByPlaceholderText('announcementsPlaceholder'), 'Hello members!');
    await user.click(screen.getByRole('button', { name: 'announcementsSubmit' }));

    await waitFor(() => {
      expect(mocks.mockApiPost).toHaveBeenCalledWith('/v1/groups/group-id/announcements', {
        content: 'Hello members!',
      });
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/groups/group-id/announcements');
    });
  });

  it('shows error and stays on page when post fails', async () => {
    setupMocks();
    mocks.mockApiPost.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(<NewAnnouncementPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => screen.getByPlaceholderText('announcementsPlaceholder'));

    await user.type(screen.getByPlaceholderText('announcementsPlaceholder'), 'Hello members!');
    await user.click(screen.getByRole('button', { name: 'announcementsSubmit' }));

    await waitFor(() => {
      expect(screen.getByText('announcementsCreateError')).toBeInTheDocument();
      expect(mocks.mockRouterPush).not.toHaveBeenCalled();
    });
  });
});
