import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode, type FormEvent } from 'react';
import { TripRole, TripParticipantStatus } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPatch: vi.fn(),
  mockUseAuth: vi.fn(),
  mockRouterPush: vi.fn(),
  mockRouterReplace: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: 'trip-id', announcementId: 'a1' }),
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

vi.mock('@phosphor-icons/react', () => ({
  ArrowLeftIcon: () => <span data-testid="arrow-left-icon" />,
  MegaphoneIcon: () => <span data-testid="megaphone-icon" />,
}));

vi.mock('@/components/ui/announcement-form', () => ({
  AnnouncementForm: ({
    value,
    onChange,
    onSubmit,
    isSubmitting,
    submitLabel,
    placeholder,
    errorMessage,
  }: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    isSubmitting: boolean;
    submitLabel: string;
    placeholder: string;
    errorMessage?: string;
  }) => (
    <form onSubmit={onSubmit}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
      />
      {errorMessage && <p>{errorMessage}</p>}
      <button type="submit" disabled={isSubmitting || !value.trim()}>
        {submitLabel}
      </button>
    </form>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import EditTripAnnouncementPage from './page';

const mockAnnouncement = {
  id: 'a1',
  tripId: 'trip-id',
  createdByUsername: 'organizer-user',
  content: 'Departs Friday at 6am.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function setupMocks(role: TripRole | null = TripRole.ORGANIZER) {
  mocks.mockUseAuth.mockReturnValue({ isLoading: false });

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/participants/me')) {
      if (role === null) return Promise.reject(new Error('Not participant'));
      return Promise.resolve({
        data: { status: TripParticipantStatus.ACCEPTED, role, isTraveler: true },
      });
    }
    return Promise.resolve({ data: mockAnnouncement });
  });

  mocks.mockApiPatch.mockResolvedValue({ data: mockAnnouncement });
}

describe('EditTripAnnouncementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor pre-filled with existing content for organizer', async () => {
    setupMocks(TripRole.ORGANIZER);
    render(
      <EditTripAnnouncementPage
        params={Promise.resolve({ id: 'trip-id', announcementId: 'a1' })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockAnnouncement.content)).toBeInTheDocument();
    });
  });

  it('renders editor for co-organizer', async () => {
    setupMocks(TripRole.CO_ORGANIZER);
    render(
      <EditTripAnnouncementPage
        params={Promise.resolve({ id: 'trip-id', announcementId: 'a1' })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
    });
  });

  it('redirects regular participant to announcements list', async () => {
    setupMocks(TripRole.PARTICIPANT);
    render(
      <EditTripAnnouncementPage
        params={Promise.resolve({ id: 'trip-id', announcementId: 'a1' })}
      />,
    );

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/trips/trip-id/announcements');
    });
  });

  it('redirects non-participant to announcements list', async () => {
    setupMocks(null);
    render(
      <EditTripAnnouncementPage
        params={Promise.resolve({ id: 'trip-id', announcementId: 'a1' })}
      />,
    );

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/trips/trip-id/announcements');
    });
  });

  it('back link points to announcements list', async () => {
    setupMocks();
    render(
      <EditTripAnnouncementPage
        params={Promise.resolve({ id: 'trip-id', announcementId: 'a1' })}
      />,
    );

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /announcements/ });
      expect(link).toHaveAttribute('href', '/trips/trip-id/announcements');
    });
  });

  it('submit button is disabled when content is empty', async () => {
    setupMocks();
    mocks.mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/participants/me'))
        return Promise.resolve({
          data: {
            status: TripParticipantStatus.ACCEPTED,
            role: TripRole.ORGANIZER,
            isTraveler: true,
          },
        });
      return Promise.resolve({ data: { ...mockAnnouncement, content: '' } });
    });
    render(
      <EditTripAnnouncementPage
        params={Promise.resolve({ id: 'trip-id', announcementId: 'a1' })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'announcementsEditSave' })).toBeDisabled();
    });
  });

  it('submits updated content and redirects to announcements list', async () => {
    setupMocks();
    const user = userEvent.setup();
    render(
      <EditTripAnnouncementPage
        params={Promise.resolve({ id: 'trip-id', announcementId: 'a1' })}
      />,
    );

    await waitFor(() => screen.getByDisplayValue(mockAnnouncement.content));

    const textarea = screen.getByDisplayValue(mockAnnouncement.content);
    await user.clear(textarea);
    await user.type(textarea, 'Updated announcement.');
    await user.click(screen.getByRole('button', { name: 'announcementsEditSave' }));

    await waitFor(() => {
      expect(mocks.mockApiPatch).toHaveBeenCalledWith('/v1/trips/trip-id/announcements/a1', {
        content: 'Updated announcement.',
      });
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/trips/trip-id/announcements');
    });
  });

  it('shows error and stays on page when patch fails', async () => {
    setupMocks();
    mocks.mockApiPatch.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(
      <EditTripAnnouncementPage
        params={Promise.resolve({ id: 'trip-id', announcementId: 'a1' })}
      />,
    );

    await waitFor(() => screen.getByDisplayValue(mockAnnouncement.content));

    await user.click(screen.getByRole('button', { name: 'announcementsEditSave' }));

    await waitFor(() => {
      expect(screen.getByText('announcementsEditError')).toBeInTheDocument();
      expect(mocks.mockRouterPush).not.toHaveBeenCalled();
    });
  });
});
