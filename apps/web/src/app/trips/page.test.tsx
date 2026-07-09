import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { TripRole, TripStatus, TripVisibility } from '@chamuco/shared-types';
import type { MyTripListItemResponse } from '@/services/trips.types';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock('@/services/trips.service', () => ({
  getMyTrips: vi.fn(),
}));

vi.mock('@/components/trips/TripCard', () => ({
  TripCard: ({ trip }: { trip: MyTripListItemResponse }) => (
    <div data-testid="trip-card">{trip.name}</div>
  ),
}));

vi.mock('@/components/trips/TripInvitationsSection', () => ({
  TripInvitationsSection: () => null,
}));

import { getMyTrips } from '@/services/trips.service';
import TripsPage from './page';

const mockGetMyTrips = vi.mocked(getMyTrips);

const baseTrip: MyTripListItemResponse = {
  id: 'trip-1',
  name: 'Cancún 2026',
  description: null,
  status: TripStatus.OPEN,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 12,
  departureCountry: 'MX',
  departureCity: 'CIUDAD DE MEXICO',
  landingCountry: 'MX',
  landingCity: 'CANCUN',
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
  confirmedParticipantCount: 2,
  userRole: TripRole.ORGANIZER,
};

const completedTrip: MyTripListItemResponse = {
  ...baseTrip,
  id: 'trip-2',
  name: 'Paris 2025',
  status: TripStatus.COMPLETED,
};

describe('TripsPage', () => {
  beforeEach(() => {
    mockGetMyTrips.mockResolvedValue([baseTrip, completedTrip]);
  });

  it('renders the page title', async () => {
    render(<TripsPage />);
    await waitFor(() => expect(screen.getByText('title')).toBeInTheDocument());
  });

  it('renders upcoming and past tabs', async () => {
    render(<TripsPage />);
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'tabs.upcoming' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: 'tabs.past' })).toBeInTheDocument();
  });

  it('shows upcoming trips on the default tab', async () => {
    render(<TripsPage />);
    await waitFor(() => expect(screen.getByText('Cancún 2026')).toBeInTheDocument());
    expect(screen.queryByText('Paris 2025')).not.toBeInTheDocument();
  });

  it('shows past trips after switching to the past tab', async () => {
    const user = userEvent.setup();
    render(<TripsPage />);
    await waitFor(() => screen.getByRole('tab', { name: 'tabs.past' }));
    await user.click(screen.getByRole('tab', { name: 'tabs.past' }));
    expect(screen.getByText('Paris 2025')).toBeInTheDocument();
    expect(screen.queryByText('Cancún 2026')).not.toBeInTheDocument();
  });

  it('shows empty state when no trips in the active tab', async () => {
    mockGetMyTrips.mockResolvedValueOnce([completedTrip]);
    render(<TripsPage />);
    await waitFor(() => expect(screen.getByText('detail.noTrips')).toBeInTheDocument());
    expect(screen.getByText('detail.createFirst')).toBeInTheDocument();
  });

  it('shows empty state for past tab when no past trips', async () => {
    const user = userEvent.setup();
    mockGetMyTrips.mockResolvedValueOnce([baseTrip]);
    render(<TripsPage />);
    await waitFor(() => screen.getByRole('tab', { name: 'tabs.past' }));
    await user.click(screen.getByRole('tab', { name: 'tabs.past' }));
    expect(screen.getByText('detail.noTrips')).toBeInTheDocument();
  });
});
