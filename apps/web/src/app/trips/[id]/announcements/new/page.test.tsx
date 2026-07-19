import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type FormEvent } from 'react';
import { TripRole, TripParticipantStatus } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockUseAuth: vi.fn(),
  mockRouterPush: vi.fn(),
  mockRouterReplace: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: 'trip-id' }),
  };
});

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

import NewTripAnnouncementPage from './page';

const mockTrip = {
  id: 'trip-id',
  name: 'Cancún 2026',
  status: 'DRAFT',
  visibility: 'PUBLIC',
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CDMX',
  landingCountry: 'MX',
  landingCity: 'Cancun',
  defaultTimezone: 'America/Cancun',
  defaultCurrency: 'MXN',
  requiresConfirmation: false,
  createdBy: 'user-id',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockAnnouncement = {
  id: 'a1',
  tripId: 'trip-id',
  createdByUsername: 'organizer-user',
  content: 'Departs Friday at 6am.',
  createdAt: '2026-01-01T00:00:00.000Z',
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
    return Promise.resolve({ data: mockTrip });
  });

  mocks.mockApiPost.mockResolvedValue({ data: mockAnnouncement });
}

describe('NewTripAnnouncementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor for organizer', async () => {
    setupMocks(TripRole.ORGANIZER);
    render(<NewTripAnnouncementPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'announcementsSubmit' })).toBeInTheDocument();
    });
  });

  it('renders editor for co-organizer', async () => {
    setupMocks(TripRole.CO_ORGANIZER);
    render(<NewTripAnnouncementPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('announcementsPlaceholder')).toBeInTheDocument();
    });
  });

  it('redirects regular participant to trip page', async () => {
    setupMocks(TripRole.PARTICIPANT);
    render(<NewTripAnnouncementPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/trips/trip-id');
    });
  });

  it('redirects non-participant to trip page', async () => {
    setupMocks(null);
    render(<NewTripAnnouncementPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/trips/trip-id');
    });
  });

  it('shows trip name in back link', async () => {
    setupMocks();
    render(<NewTripAnnouncementPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Cancún 2026/ });
      expect(link).toHaveAttribute('href', '/trips/trip-id');
    });
  });

  it('submit button is disabled when editor is empty', async () => {
    setupMocks();
    render(<NewTripAnnouncementPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'announcementsSubmit' })).toBeDisabled();
    });
  });

  it('submits announcement and redirects to trip announcements page', async () => {
    setupMocks();
    const user = userEvent.setup();
    render(<NewTripAnnouncementPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByPlaceholderText('announcementsPlaceholder'));

    await user.type(screen.getByPlaceholderText('announcementsPlaceholder'), 'Hello participants!');
    await user.click(screen.getByRole('button', { name: 'announcementsSubmit' }));

    await waitFor(() => {
      expect(mocks.mockApiPost).toHaveBeenCalledWith('/v1/trips/trip-id/announcements', {
        content: 'Hello participants!',
      });
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/trips/trip-id/announcements');
    });
  });

  it('shows error and stays on page when post fails', async () => {
    setupMocks();
    mocks.mockApiPost.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(<NewTripAnnouncementPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByPlaceholderText('announcementsPlaceholder'));

    await user.type(screen.getByPlaceholderText('announcementsPlaceholder'), 'Hello participants!');
    await user.click(screen.getByRole('button', { name: 'announcementsSubmit' }));

    await waitFor(() => {
      expect(screen.getByText('announcementsCreateError')).toBeInTheDocument();
      expect(mocks.mockRouterPush).not.toHaveBeenCalled();
    });
  });
});
