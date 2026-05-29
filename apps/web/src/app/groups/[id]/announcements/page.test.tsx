import { render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { GroupRole } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
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
  apiClient: { get: mocks.mockApiGet },
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

vi.mock('@/components/ui/announcement-card', () => ({
  AnnouncementCard: ({
    content,
    postedByLabel,
  }: {
    content: string;
    postedByLabel: string;
    createdAt: string;
  }) => (
    <li>
      <span>{content}</span>
      <span>{postedByLabel}</span>
    </li>
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
      return membership
        ? Promise.resolve({ data: membership })
        : Promise.reject(new Error('Not member'));
    if (url.includes('/announcements'))
      return Promise.resolve(makeAnnouncementsResponse(announcements));
    // group detail
    return Promise.resolve({ data: mockGroup });
  });
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

  it('shows new announcement button for admin/owner', async () => {
    setupDefaultMocks({ membership: adminMembership });
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'announcementsNewButton' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/groups/group-id/announcements/new');
    });
  });

  it('hides new announcement button for regular members', async () => {
    setupDefaultMocks({ membership: memberMembership });
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'announcementsNewButton' }),
      ).not.toBeInTheDocument();
    });
  });

  it('back link points to group detail page', async () => {
    setupDefaultMocks();
    render(<GroupAnnouncementsPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Mountain Crew/ });
      expect(link).toHaveAttribute('href', '/groups/group-id');
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
});
