import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { GroupRole } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPatch: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseUser: vi.fn(),
  mockRouterPush: vi.fn(),
  mockRouterReplace: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: 'group-id', announcementId: 'a1' }),
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
  apiClient: { get: mocks.mockApiGet, patch: mocks.mockApiPatch },
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
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import EditAnnouncementPage from './page';

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
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function setupMocks(role: GroupRole | null = GroupRole.OWNER) {
  mocks.mockUseAuth.mockReturnValue({ isLoading: false });
  mocks.mockUseUser.mockReturnValue({ appUser: { id: 'admin-id' }, isLoading: false });

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/members/me')) {
      if (role === null) return Promise.reject(new Error('Not member'));
      return Promise.resolve({ data: { status: 'active', role } });
    }
    if (url.includes('/announcements/')) {
      return Promise.resolve({ data: mockAnnouncement });
    }
    return Promise.resolve({ data: mockGroup });
  });

  mocks.mockApiPatch.mockResolvedValue({ data: mockAnnouncement });
}

describe('EditAnnouncementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor pre-filled with existing content for group owner', async () => {
    setupMocks(GroupRole.OWNER);
    render(
      <EditAnnouncementPage params={Promise.resolve({ id: 'group-id', announcementId: 'a1' })} />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockAnnouncement.content)).toBeInTheDocument();
    });
  });

  it('renders editor for group admin', async () => {
    setupMocks(GroupRole.ADMIN);
    render(
      <EditAnnouncementPage params={Promise.resolve({ id: 'group-id', announcementId: 'a1' })} />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
    });
  });

  it('redirects non-admin member to announcements list', async () => {
    setupMocks(GroupRole.MEMBER);
    render(
      <EditAnnouncementPage params={Promise.resolve({ id: 'group-id', announcementId: 'a1' })} />,
    );

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/groups/group-id/announcements');
    });
  });

  it('redirects non-member to announcements list', async () => {
    setupMocks(null);
    render(
      <EditAnnouncementPage params={Promise.resolve({ id: 'group-id', announcementId: 'a1' })} />,
    );

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/groups/group-id/announcements');
    });
  });

  it('back link points to announcements list', async () => {
    setupMocks();
    render(
      <EditAnnouncementPage params={Promise.resolve({ id: 'group-id', announcementId: 'a1' })} />,
    );

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /announcements/ });
      expect(link).toHaveAttribute('href', '/groups/group-id/announcements');
    });
  });

  it('submit button is disabled when content is empty', async () => {
    setupMocks();
    mocks.mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/members/me'))
        return Promise.resolve({ data: { status: 'active', role: GroupRole.OWNER } });
      if (url.includes('/announcements/'))
        return Promise.resolve({ data: { ...mockAnnouncement, content: '' } });
      return Promise.resolve({ data: mockGroup });
    });
    render(
      <EditAnnouncementPage params={Promise.resolve({ id: 'group-id', announcementId: 'a1' })} />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'announcementsEditSave' })).toBeDisabled();
    });
  });

  it('submits updated content and redirects to announcements list', async () => {
    setupMocks();
    const user = userEvent.setup();
    render(
      <EditAnnouncementPage params={Promise.resolve({ id: 'group-id', announcementId: 'a1' })} />,
    );

    await waitFor(() => screen.getByDisplayValue(mockAnnouncement.content));

    const textarea = screen.getByDisplayValue(mockAnnouncement.content);
    await user.clear(textarea);
    await user.type(textarea, 'Updated announcement.');
    await user.click(screen.getByRole('button', { name: 'announcementsEditSave' }));

    await waitFor(() => {
      expect(mocks.mockApiPatch).toHaveBeenCalledWith('/v1/groups/group-id/announcements/a1', {
        content: 'Updated announcement.',
      });
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/groups/group-id/announcements');
    });
  });

  it('shows error and stays on page when patch fails', async () => {
    setupMocks();
    mocks.mockApiPatch.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(
      <EditAnnouncementPage params={Promise.resolve({ id: 'group-id', announcementId: 'a1' })} />,
    );

    await waitFor(() => screen.getByDisplayValue(mockAnnouncement.content));

    await user.click(screen.getByRole('button', { name: 'announcementsEditSave' }));

    await waitFor(() => {
      expect(screen.getByText('announcementsEditError')).toBeInTheDocument();
      expect(mocks.mockRouterPush).not.toHaveBeenCalled();
    });
  });
});
