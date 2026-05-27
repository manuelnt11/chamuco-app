import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { GroupRole } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseUser: vi.fn(),
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

import GroupAnnouncementsPage from './page';

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

const adminMembership = { status: 'active', role: GroupRole.OWNER };
const memberMembership = { status: 'active', role: GroupRole.MEMBER };

const makeAnnouncementsResponse = (items = [mockAnnouncement]) => ({
  data: { items, total: items.length },
});

function setupDefaultMocks(
  overrides: {
    membership?: typeof adminMembership | null;
    announcements?: (typeof mockAnnouncement)[];
  } = {},
) {
  const { membership = adminMembership, announcements = [mockAnnouncement] } = overrides;

  mocks.mockUseAuth.mockReturnValue({ isLoading: false });
  mocks.mockUseUser.mockReturnValue({ appUser: { id: 'admin-id' }, isLoading: false });

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/members/me'))
      return Promise.resolve(membership ? { data: membership } : null);
    if (url.includes('/announcements'))
      return Promise.resolve(makeAnnouncementsResponse(announcements));
    // group detail
    return Promise.resolve({ data: mockGroup });
  });

  mocks.mockApiPost.mockResolvedValue({ data: mockAnnouncement });
}

describe('GroupAnnouncementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders announcements feed after load', async () => {
    setupDefaultMocks();
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(mockAnnouncement.content)).toBeInTheDocument();
    });
  });

  it('shows @username in announcement feed', async () => {
    setupDefaultMocks();
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(/@admin-user/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no announcements', async () => {
    setupDefaultMocks({ announcements: [] });
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('announcementsEmpty')).toBeInTheDocument();
    });
  });

  it('shows create form for admin/owner', async () => {
    setupDefaultMocks({ membership: adminMembership });
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'announcementsSubmit' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
    });
  });

  it('hides create form for regular members', async () => {
    setupDefaultMocks({ membership: memberMembership });
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'announcementsSubmit' })).not.toBeInTheDocument();
    });
  });

  it('submits announcement and prepends to list', async () => {
    setupDefaultMocks({ announcements: [] });
    const newAnnouncement = { ...mockAnnouncement, id: 'a2', content: 'New announcement!' };
    mocks.mockApiPost.mockResolvedValue({ data: newAnnouncement });

    const user = userEvent.setup();
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('announcementsPlaceholder'), 'New announcement!');
    await user.click(screen.getByRole('button', { name: 'announcementsSubmit' }));

    await waitFor(() => {
      expect(mocks.mockApiPost).toHaveBeenCalledWith('/v1/groups/group-id/announcements', {
        content: 'New announcement!',
      });
      expect(screen.getByText('New announcement!')).toBeInTheDocument();
    });
  });

  it('submit button is disabled when textarea is empty', async () => {
    setupDefaultMocks();
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'announcementsSubmit' });
      expect(button).toBeDisabled();
    });
  });

  it('shows error message when announcements fail to load', async () => {
    mocks.mockUseAuth.mockReturnValue({ isLoading: false });
    mocks.mockUseUser.mockReturnValue({ appUser: { id: 'admin-id' }, isLoading: false });
    mocks.mockApiGet.mockRejectedValue(new Error('Network error'));

    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('announcementsLoadError')).toBeInTheDocument();
    });
  });

  it('shows error when post fails', async () => {
    setupDefaultMocks({ announcements: [] });
    mocks.mockApiPost.mockRejectedValue(new Error('Server error'));

    const user = userEvent.setup();
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('announcementsPlaceholder'), 'Hello members!');
    await user.click(screen.getByRole('button', { name: 'announcementsSubmit' }));

    await waitFor(() => {
      expect(screen.getByText('announcementsCreateError')).toBeInTheDocument();
    });
  });
});
