import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { toast } from '@/components/ui/toast';
import { TripRole, TripStatus, TripVisibility } from '@chamuco/shared-types';
import type { TripAnnouncement, TripResponse, DestinationResponse } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPatch: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: 'trip-id' }),
  };
});

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mocks.mockApiGet, patch: mocks.mockApiPatch },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
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
    <div data-testid="announcement-card">
      <span>{content}</span>
      <span>{postedByLabel}</span>
    </div>
  ),
}));

vi.mock('@/components/ui/markdown-content', () => ({
  MarkdownContent: ({ content }: { content: string }) => (
    <div data-testid="markdown-content">{content}</div>
  ),
}));

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}));

vi.mock('@/components/trips/TripStatusBadge', () => ({
  TripStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

vi.mock('@/components/trips/TripStatusTransition', () => ({
  TripStatusTransition: () => null,
}));

vi.mock('@/components/trips/TripDestinationList', () => ({
  TripDestinationList: ({
    initialDestinations,
  }: {
    initialDestinations: Array<{
      id: string;
      city: string;
      countryCode: string;
      position: number;
      label: string | null;
    }>;
    tripId: string;
    isOrganizer: boolean;
  }) => {
    if (initialDestinations.length === 0) {
      return <p>detail.noDestinations</p>;
    }
    return (
      <ol>
        {initialDestinations.map((d) => (
          <li key={d.id}>
            {d.city}, {d.countryCode}
            {d.label && <span> — {d.label}</span>}
          </li>
        ))}
      </ol>
    );
  },
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

import TripDetailPage from './page';

const mockTrip: TripResponse = {
  id: 'trip-id',
  name: 'Cancún 2026',
  description: 'Beach trip for the crew.',
  status: TripStatus.OPEN,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-07-01',
  endDate: '2026-07-10',
  participantCapacity: 12,
  departureCountry: 'MX',
  departureCity: 'Mexico City',
  landingCountry: 'MX',
  landingCity: 'Mexico City',
  defaultTimezone: null,
  defaultCurrency: null,
  itineraryNotes: null,
  agencyId: null,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  requiresConfirmation: false,
  feedbackOpenUntil: null,
  coverUrl: null,
};

const mockDestination: DestinationResponse = {
  id: 'dest-1',
  tripId: 'trip-id',
  position: 1,
  countryCode: 'MX',
  city: 'Cancún',
  label: null,
  itinerary: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function setupMocks({
  participation = { role: TripRole.ORGANIZER, userId: 'user-1' } as {
    role: TripRole;
    userId: string;
  } | null,
  destinations = [mockDestination],
  trip = mockTrip,
  announcements = [] as TripAnnouncement[],
}: {
  participation?: { role: TripRole; userId: string } | null;
  destinations?: (typeof mockDestination)[];
  trip?: TripResponse;
  announcements?: TripAnnouncement[];
} = {}) {
  mocks.mockUseAuth.mockReturnValue({ isLoading: false });

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/participants/me'))
      return participation
        ? Promise.resolve({
            data: {
              ...participation,
              username: 'user1',
              displayName: 'User 1',
              avatarUrl: null,
              isTraveler: true,
              confirmedAt: null,
            },
          })
        : Promise.reject(new Error('Not a participant'));
    if (url.includes('/destinations')) return Promise.resolve({ data: destinations });
    if (url.includes('/announcements'))
      return Promise.resolve({ data: { items: announcements, total: announcements.length } });
    if (url.includes('/linked-groups')) return Promise.resolve({ data: [] });
    if (url.includes('/itinerary/pdf'))
      return Promise.resolve({ data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }) });
    return Promise.resolve({ data: trip });
  });
}

describe('TripDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-itinerary-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders trip name, status badge, and dates after load', async () => {
    setupMocks();
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('Cancún 2026')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByText('2026-07-01')).toBeInTheDocument();
      expect(screen.getByText('2026-07-10')).toBeInTheDocument();
    });
  });

  it('renders trip description', async () => {
    setupMocks();
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('Beach trip for the crew.')).toBeInTheDocument();
    });
  });

  it('shows noItineraryNotes when itineraryNotes is null', async () => {
    setupMocks();
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('detail.noItineraryNotes')).toBeInTheDocument();
    });
  });

  it('renders itinerary notes as markdown when present', async () => {
    setupMocks({ trip: { ...mockTrip, itineraryNotes: '## Day 1\nArrival' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const el = screen.getByTestId('markdown-content');
      expect(el).toHaveTextContent('## Day 1');
      expect(el).toHaveTextContent('Arrival');
    });
  });

  it('shows edit itinerary notes button for ORGANIZER', async () => {
    setupMocks({ participation: { role: TripRole.ORGANIZER, userId: 'user-1' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'detail.editItineraryNotes' })).toBeInTheDocument();
    });
  });

  it('hides edit itinerary notes button for PARTICIPANT', async () => {
    setupMocks({ participation: { role: TripRole.PARTICIPANT, userId: 'user-3' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'detail.editItineraryNotes' }),
      ).not.toBeInTheDocument();
    });
  });

  it('clicking edit shows rich text editor', async () => {
    setupMocks({ participation: { role: TripRole.ORGANIZER, userId: 'user-1' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'detail.editItineraryNotes' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'detail.editItineraryNotes' }));

    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common:actions.save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common:actions.cancel' })).toBeInTheDocument();
  });

  it('cancel exits edit mode', async () => {
    setupMocks({ participation: { role: TripRole.ORGANIZER, userId: 'user-1' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'detail.editItineraryNotes' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'detail.editItineraryNotes' }));

    fireEvent.click(screen.getByRole('button', { name: 'common:actions.cancel' }));

    expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();
  });

  it('save calls updateTrip and exits edit mode', async () => {
    const updatedTrip = { ...mockTrip, itineraryNotes: 'Updated notes' };
    mocks.mockApiPatch.mockResolvedValue({ data: updatedTrip });
    setupMocks({ participation: { role: TripRole.ORGANIZER, userId: 'user-1' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'detail.editItineraryNotes' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'detail.editItineraryNotes' }));

    fireEvent.change(screen.getByTestId('rich-text-editor'), {
      target: { value: 'Updated notes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common:actions.save' }));

    await waitFor(() => {
      expect(mocks.mockApiPatch).toHaveBeenCalledWith('/v1/trips/trip-id', {
        itineraryNotes: 'Updated notes',
      });
      expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Updated notes');
    });
  });

  it('renders cover image when coverUrl is set', async () => {
    mocks.mockUseAuth.mockReturnValue({ isLoading: false });
    mocks.mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/participants/me'))
        return Promise.resolve({
          data: {
            role: TripRole.ORGANIZER,
            userId: 'user-1',
            username: 'user1',
            displayName: 'User 1',
            avatarUrl: null,
            isTraveler: true,
            confirmedAt: null,
          },
        });
      if (url.includes('/destinations')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: { ...mockTrip, coverUrl: 'https://example.com/cover.jpg' } });
    });
    const { container } = render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  it('renders destination label when set', async () => {
    setupMocks({
      destinations: [{ ...mockDestination, label: 'Beachfront Hotel' }],
    });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(/Beachfront Hotel/)).toBeInTheDocument();
    });
  });

  it('renders destinations list', async () => {
    setupMocks();
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(/Cancún, MX/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no destinations', async () => {
    setupMocks({ destinations: [] });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('detail.noDestinations')).toBeInTheDocument();
    });
  });

  it('shows edit settings link for ORGANIZER', async () => {
    setupMocks({ participation: { role: TripRole.ORGANIZER, userId: 'user-1' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'actions.editSettings' })).toBeInTheDocument();
    });
  });

  it('shows edit settings link for CO_ORGANIZER', async () => {
    setupMocks({ participation: { role: TripRole.CO_ORGANIZER, userId: 'user-2' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'actions.editSettings' })).toBeInTheDocument();
    });
  });

  it('hides edit settings link for PARTICIPANT', async () => {
    setupMocks({ participation: { role: TripRole.PARTICIPANT, userId: 'user-3' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'actions.editSettings' })).not.toBeInTheDocument();
    });
  });

  it('hides edit settings link when not a participant', async () => {
    setupMocks({ participation: null });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'actions.editSettings' })).not.toBeInTheDocument();
    });
  });

  it('shows participants link for all users', async () => {
    setupMocks({ participation: { role: TripRole.PARTICIPANT, userId: 'user-3' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'participants.title' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/trips/trip-id/participants');
    });
  });

  it('shows participants link when not a participant', async () => {
    setupMocks({ participation: null });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'participants.title' })).toBeInTheDocument();
    });
  });

  it('shows publish announcement link for ORGANIZER', async () => {
    setupMocks({ participation: { role: TripRole.ORGANIZER, userId: 'user-1' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'announcementsPublish' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/trips/trip-id/announcements/new');
    });
  });

  it('shows publish announcement link for CO_ORGANIZER', async () => {
    setupMocks({ participation: { role: TripRole.CO_ORGANIZER, userId: 'user-2' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'announcementsPublish' })).toBeInTheDocument();
    });
  });

  it('hides publish announcement link for PARTICIPANT', async () => {
    setupMocks({ participation: { role: TripRole.PARTICIPANT, userId: 'user-3' } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'announcementsPublish' })).not.toBeInTheDocument();
    });
  });

  it('shows not found when trip fetch fails', async () => {
    mocks.mockUseAuth.mockReturnValue({ isLoading: false });
    mocks.mockApiGet.mockRejectedValue(new Error('Not found'));

    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('errors.notFound')).toBeInTheDocument();
    });
  });

  it('shows announcements empty state when no announcements', async () => {
    setupMocks({ announcements: [] });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('announcementsEmpty')).toBeInTheDocument();
    });
  });

  it('renders announcement cards when announcements exist', async () => {
    const mockAnnouncements: TripAnnouncement[] = [
      {
        id: 'ann-1',
        tripId: 'trip-id',
        content: 'Meet at the airport at 6am.',
        createdByUsername: 'organizer1',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
    ];
    setupMocks({ announcements: mockAnnouncements });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('announcement-card')).toBeInTheDocument();
      expect(screen.getByText('Meet at the airport at 6am.')).toBeInTheDocument();
    });
  });

  it('shows view all link to announcements page', async () => {
    setupMocks();
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'announcementsViewAll' });
      expect(link).toHaveAttribute('href', '/trips/trip-id/announcements');
    });
  });

  it('exports the itinerary PDF on click and triggers a download', async () => {
    setupMocks();
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    const button = await screen.findByRole('button', { name: 'detail.exportPdf' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mocks.mockApiGet).toHaveBeenCalledWith(
        '/v1/trips/trip-id/itinerary/pdf',
        expect.objectContaining({ responseType: 'blob' }),
      );
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-itinerary-url');
    });
    // Returns to the icon (not the loading label) once the download completes.
    expect(screen.getByRole('button', { name: 'detail.exportPdf' })).toBeInTheDocument();
  });

  it('shows the spinner and disables the button while the export is in flight', async () => {
    setupMocks();
    let resolveExport!: (value: { data: Blob }) => void;
    mocks.mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/itinerary/pdf'))
        return new Promise((resolve) => (resolveExport = resolve));
      if (url.includes('/participants/me'))
        return Promise.resolve({
          data: {
            role: TripRole.ORGANIZER,
            userId: 'user-1',
            username: 'user1',
            displayName: 'User 1',
            avatarUrl: null,
            isTraveler: true,
            confirmedAt: null,
          },
        });
      if (url.includes('/destinations')) return Promise.resolve({ data: [mockDestination] });
      if (url.includes('/announcements')) return Promise.resolve({ data: { items: [], total: 0 } });
      if (url.includes('/linked-groups')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockTrip });
    });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    const button = await screen.findByRole('button', { name: 'detail.exportPdf' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'detail.exportingPdf' })).toBeDisabled();
    });

    resolveExport({ data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }) });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'detail.exportPdf' })).not.toBeDisabled();
    });
  });

  it('shows an error toast and re-enables the button when export fails', async () => {
    setupMocks();
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    const button = await screen.findByRole('button', { name: 'detail.exportPdf' });
    mocks.mockApiGet.mockImplementationOnce(() => Promise.reject(new Error('network error')));
    fireEvent.click(button);

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('detail.exportPdfError');
      expect(screen.getByRole('button', { name: 'detail.exportPdf' })).not.toBeDisabled();
    });
  });

  it('disables the export PDF button for a DRAFT trip', async () => {
    setupMocks({ trip: { ...mockTrip, status: TripStatus.DRAFT } });
    render(<TripDetailPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'detail.exportPdf' })).toBeDisabled();
    });
  });
});
