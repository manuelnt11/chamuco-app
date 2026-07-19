import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TripRole, TripParticipantStatus } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiDelete: vi.fn(),
  mockUseAuth: vi.fn(),
  mockRouterPush: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: 'trip-id' }),
  };
});

vi.mock('next/navigation', () => {
  let stableRouter: { push: typeof mocks.mockRouterPush } | null = null;
  return {
    useRouter: () => {
      if (!stableRouter) stableRouter = { push: mocks.mockRouterPush };
      return stableRouter;
    },
  };
});

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mocks.mockApiGet, delete: mocks.mockApiDelete },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

vi.mock('@/components/ui/announcement-card', () => ({
  AnnouncementCard: ({
    content,
    postedByLabel,
    onEdit,
    onDelete,
  }: {
    content: string;
    postedByLabel: string;
    createdAt: string;
    onEdit?: () => void;
    onDelete?: () => Promise<void>;
  }) => (
    <li>
      <span>{content}</span>
      <span>{postedByLabel}</span>
      {onEdit && (
        <button type="button" onClick={onEdit} data-testid="edit-btn">
          edit
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={() => void onDelete()} data-testid="delete-btn">
          delete
        </button>
      )}
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

import TripAnnouncementsPage from './page';

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

const organizerParticipation = {
  status: TripParticipantStatus.ACCEPTED,
  role: TripRole.ORGANIZER,
  isTraveler: true,
};
const participantParticipation = {
  status: TripParticipantStatus.ACCEPTED,
  role: TripRole.PARTICIPANT,
  isTraveler: true,
};

const makeAnnouncementsResponse = (items = [mockAnnouncement]) => ({
  data: { items, total: items.length },
});

function setupDefaultMocks(
  overrides: {
    participation?: typeof organizerParticipation | null;
    announcements?: (typeof mockAnnouncement)[];
  } = {},
) {
  const { participation = organizerParticipation, announcements = [mockAnnouncement] } = overrides;

  mocks.mockUseAuth.mockReturnValue({ isLoading: false });
  mocks.mockApiDelete.mockResolvedValue({});

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/participants/me'))
      return participation
        ? Promise.resolve({ data: participation })
        : Promise.reject(new Error('Not participant'));
    if (url.includes('/announcements'))
      return Promise.resolve(makeAnnouncementsResponse(announcements));
    return Promise.resolve({ data: mockTrip });
  });
}

describe('TripAnnouncementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders announcements feed after load', async () => {
    setupDefaultMocks();
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(mockAnnouncement.content)).toBeInTheDocument();
    });
  });

  it('shows @username in announcement feed', async () => {
    setupDefaultMocks();
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(/@organizer-user/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no announcements', async () => {
    setupDefaultMocks({ announcements: [] });
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('announcementsEmpty')).toBeInTheDocument();
    });
  });

  it('shows new announcement button for organizer', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'announcementsSubmit' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/trips/trip-id/announcements/new');
    });
  });

  it('shows new announcement button for co-organizer', async () => {
    setupDefaultMocks({
      participation: { ...organizerParticipation, role: TripRole.CO_ORGANIZER },
    });
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'announcementsSubmit' })).toBeInTheDocument();
    });
  });

  it('hides new announcement button for regular participant', async () => {
    setupDefaultMocks({ participation: participantParticipation });
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'announcementsSubmit' })).not.toBeInTheDocument();
    });
  });

  it('back link points to trip detail page', async () => {
    setupDefaultMocks();
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Cancún 2026/ });
      expect(link).toHaveAttribute('href', '/trips/trip-id');
    });
  });

  it('shows error message when trip fails to load', async () => {
    mocks.mockUseAuth.mockReturnValue({ isLoading: false });
    mocks.mockApiGet.mockRejectedValue(new Error('Network error'));

    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('announcementsLoadError')).toBeInTheDocument();
    });
  });

  it('shows edit and delete buttons for organizer', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
      expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
    });
  });

  it('hides edit and delete buttons for regular participant', async () => {
    setupDefaultMocks({ participation: participantParticipation });
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.queryByTestId('edit-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-btn')).not.toBeInTheDocument();
    });
  });

  it('navigates to edit page when edit button is clicked', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByTestId('edit-btn'));
    fireEvent.click(screen.getByTestId('edit-btn'));

    expect(mocks.mockRouterPush).toHaveBeenCalledWith('/trips/trip-id/announcements/a1/edit');
  });

  it('removes announcement from list after successful delete', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByTestId('delete-btn'));
    fireEvent.click(screen.getByTestId('delete-btn'));

    await waitFor(() => {
      expect(mocks.mockApiDelete).toHaveBeenCalledWith('/v1/trips/trip-id/announcements/a1');
      expect(screen.queryByText(mockAnnouncement.content)).not.toBeInTheDocument();
    });
  });

  it('shows delete error when delete fails', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    mocks.mockApiDelete.mockRejectedValue(new Error('Server error'));
    render(<TripAnnouncementsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByTestId('delete-btn'));
    fireEvent.click(screen.getByTestId('delete-btn'));

    await waitFor(() => {
      expect(screen.getByText('announcementsDeleteError')).toBeInTheDocument();
    });
  });
});
