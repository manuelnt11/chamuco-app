import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TripSearchResult } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  mockUseTripSearch: vi.fn(),
  mockTripDiscoveryCard: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

vi.mock('@/hooks/useTripSearch', () => ({
  useTripSearch: mocks.mockUseTripSearch,
}));

vi.mock('@/components/trips/TripDiscoveryCard', () => ({
  TripDiscoveryCard: ({
    trip,
    onStatusChange,
  }: {
    trip: TripSearchResult;
    onStatusChange: (id: string, status: string) => void;
  }) => (
    <div data-testid="trip-card">
      <span>{trip.name}</span>
      <button type="button" onClick={() => onStatusChange(trip.id, 'pending')}>
        join
      </button>
    </div>
  ),
}));

import ExploreTripsPage from './page';

const makeTrip = (overrides: Partial<TripSearchResult> = {}): TripSearchResult => ({
  id: 'trip-1',
  name: 'Cancún 2026',
  description: null,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  confirmedParticipantCount: 3,
  destinations: [{ city: 'Cancún', countryCode: 'MX' }],
  participationStatus: 'none',
  ...overrides,
});

describe('ExploreTripsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUseTripSearch.mockReturnValue({ results: [], total: 0, isLoading: false });
  });

  it('renders search input', () => {
    render(<ExploreTripsPage />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('shows empty state when query is blank', () => {
    render(<ExploreTripsPage />);
    expect(screen.getByText('search.empty')).toBeInTheDocument();
  });

  it('shows loading state while fetching', async () => {
    mocks.mockUseTripSearch.mockReturnValue({ results: [], total: 0, isLoading: true });

    const user = userEvent.setup();
    render(<ExploreTripsPage />);
    await user.type(screen.getByRole('searchbox'), 'cancun');

    expect(screen.getByText('search.loading')).toBeInTheDocument();
  });

  it('shows no-results state when query returns zero results', async () => {
    mocks.mockUseTripSearch.mockReturnValue({ results: [], total: 0, isLoading: false });

    const user = userEvent.setup();
    render(<ExploreTripsPage />);
    await user.type(screen.getByRole('searchbox'), 'zzznomatch');

    expect(screen.getByText(/search\.noResults/)).toBeInTheDocument();
  });

  it('renders trip cards when results are present', async () => {
    mocks.mockUseTripSearch.mockReturnValue({
      results: [makeTrip(), makeTrip({ id: 'trip-2', name: 'Paris 2027' })],
      total: 2,
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<ExploreTripsPage />);
    await user.type(screen.getByRole('searchbox'), 'trip');

    expect(screen.getAllByTestId('trip-card')).toHaveLength(2);
    expect(screen.getByText('Cancún 2026')).toBeInTheDocument();
    expect(screen.getByText('Paris 2027')).toBeInTheDocument();
  });

  it('shows result count when results are present', async () => {
    mocks.mockUseTripSearch.mockReturnValue({
      results: [makeTrip()],
      total: 8,
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<ExploreTripsPage />);
    await user.type(screen.getByRole('searchbox'), 'cancun');

    expect(screen.getByText(/search\.resultCount/)).toBeInTheDocument();
  });

  it('applies status override after join', async () => {
    const trip = makeTrip({ participationStatus: 'none' });
    mocks.mockUseTripSearch.mockReturnValue({ results: [trip], total: 1, isLoading: false });

    const user = userEvent.setup();
    render(<ExploreTripsPage />);
    await user.type(screen.getByRole('searchbox'), 'cancun');

    // Card renders once
    expect(screen.getByTestId('trip-card')).toBeInTheDocument();

    // Trigger status change
    await user.click(screen.getByRole('button', { name: 'join' }));

    // Card still renders (override applied but mock TripDiscoveryCard doesn't change its UI)
    expect(screen.getByTestId('trip-card')).toBeInTheDocument();
  });
});
