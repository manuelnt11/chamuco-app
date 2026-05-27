import { render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { GroupVisibility } from '@chamuco/shared-types';

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

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) {
        const interpolated = Object.entries(opts).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, v),
          key,
        );
        // If no placeholders were replaced, append the values so they appear in the DOM
        return interpolated === key ? [key, ...Object.values(opts)].join(' ') : interpolated;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

import GroupDetailPage from './page';

const OWNER_ID = 'owner-id';

const mockGroup = {
  id: 'group-id',
  name: 'Mountain Crew',
  description: 'A group for mountain lovers',
  coverUrl: '',
  visibility: GroupVisibility.PUBLIC,
  createdBy: OWNER_ID,
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

function setupMocks({
  userId = OWNER_ID,
  announcements = [mockAnnouncement],
}: {
  userId?: string;
  announcements?: (typeof mockAnnouncement)[];
} = {}) {
  mocks.mockUseAuth.mockReturnValue({ isLoading: false });
  mocks.mockUseUser.mockReturnValue({ appUser: { id: userId }, isLoading: false });

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/announcements'))
      return Promise.resolve({ data: { items: announcements, total: announcements.length } });
    return Promise.resolve({ data: mockGroup });
  });
}

describe('GroupDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders group name and description after load', async () => {
    setupMocks();
    render(<GroupDetailPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
      expect(screen.getByText('A group for mountain lovers')).toBeInTheDocument();
    });
  });

  it('shows announcement feed items', async () => {
    setupMocks();
    render(<GroupDetailPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(mockAnnouncement.content)).toBeInTheDocument();
    });
  });

  it('shows @username in announcement feed', async () => {
    setupMocks();
    render(<GroupDetailPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(/@admin-user/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no announcements', async () => {
    setupMocks({ announcements: [] });
    render(<GroupDetailPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('announcementsEmpty')).toBeInTheDocument();
    });
  });

  it('shows settings link only for owner', async () => {
    setupMocks({ userId: OWNER_ID });
    render(<GroupDetailPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'settings.title' })).toBeInTheDocument();
    });
  });

  it('hides settings link for non-owner', async () => {
    setupMocks({ userId: 'other-user' });
    render(<GroupDetailPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'settings.title' })).not.toBeInTheDocument();
    });
  });

  it('shows view all link pointing to announcements page', async () => {
    setupMocks();
    render(<GroupDetailPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      const viewAllLink = screen.getByRole('link', { name: 'announcementsViewAll' });
      expect(viewAllLink).toHaveAttribute('href', '/groups/group-id/announcements');
    });
  });

  it('shows not found when group request fails', async () => {
    mocks.mockUseAuth.mockReturnValue({ isLoading: false });
    mocks.mockUseUser.mockReturnValue({ appUser: { id: OWNER_ID }, isLoading: false });
    mocks.mockApiGet.mockRejectedValue(new Error('Not found'));

    render(<GroupDetailPage params={Promise.resolve({ id: 'group-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('errors.notFound')).toBeInTheDocument();
    });
  });
});
