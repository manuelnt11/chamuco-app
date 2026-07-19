import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockApiPost: vi.fn(),
  mockApiDelete: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { post: mocks.mockApiPost, delete: mocks.mockApiDelete },
}));

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, string | number>) => {
      if (opts) {
        return Object.entries(opts).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          key,
        );
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

import { TripDiscoveryCard } from './TripDiscoveryCard';
import type { TripSearchResult } from '@/services/trips.types';

const baseTrip: TripSearchResult = {
  id: 'trip-1',
  name: 'Cancún 2026',
  description: 'A beach trip.',
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  confirmedParticipantCount: 3,
  destinations: [
    { city: 'Cancún', countryCode: 'MX' },
    { city: 'Playa del Carmen', countryCode: 'MX' },
  ],
  participationStatus: 'none',
};

describe('TripDiscoveryCard', () => {
  const onStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trip name and description', () => {
    render(<TripDiscoveryCard trip={baseTrip} onStatusChange={onStatusChange} />);
    expect(screen.getByText('Cancún 2026')).toBeInTheDocument();
    expect(screen.getByText('A beach trip.')).toBeInTheDocument();
  });

  it('renders destination list', () => {
    render(<TripDiscoveryCard trip={baseTrip} onStatusChange={onStatusChange} />);
    expect(screen.getByText(/Cancún · Playa del Carmen/)).toBeInTheDocument();
  });

  it('shows +N indicator when destinations exceed 3', () => {
    render(
      <TripDiscoveryCard
        trip={{
          ...baseTrip,
          destinations: [
            { city: 'Cancún', countryCode: 'MX' },
            { city: 'Playa del Carmen', countryCode: 'MX' },
            { city: 'Tulum', countryCode: 'MX' },
            { city: 'Bacalar', countryCode: 'MX' },
          ],
        }}
        onStatusChange={onStatusChange}
      />,
    );
    expect(screen.getByText(/Cancún · Playa del Carmen · Tulum \+1/)).toBeInTheDocument();
  });

  it('renders dates', () => {
    render(<TripDiscoveryCard trip={baseTrip} onStatusChange={onStatusChange} />);
    expect(screen.getByText('2026-12-01 – 2026-12-08')).toBeInTheDocument();
  });

  it('renders participant count i18n key', () => {
    render(<TripDiscoveryCard trip={baseTrip} onStatusChange={onStatusChange} />);
    expect(screen.getByText(/search\.participants/)).toBeInTheDocument();
  });

  it('shows join button when participationStatus is none', () => {
    render(<TripDiscoveryCard trip={baseTrip} onStatusChange={onStatusChange} />);
    expect(screen.getByRole('button', { name: 'search.joinRequest.button' })).toBeInTheDocument();
  });

  it('shows withdraw button when participationStatus is pending', () => {
    render(
      <TripDiscoveryCard
        trip={{ ...baseTrip, participationStatus: 'pending' }}
        onStatusChange={onStatusChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'search.joinRequest.withdraw' })).toBeInTheDocument();
  });

  it('shows view link when participationStatus is active', () => {
    render(
      <TripDiscoveryCard
        trip={{ ...baseTrip, participationStatus: 'active' }}
        onStatusChange={onStatusChange}
      />,
    );
    const link = screen.getByRole('link', { name: 'search.viewTrip' });
    expect(link).toHaveAttribute('href', '/trips/trip-1');
  });

  it('calls submitJoinRequest and updates status to pending on join', async () => {
    mocks.mockApiPost.mockResolvedValue({});
    const user = userEvent.setup();
    render(<TripDiscoveryCard trip={baseTrip} onStatusChange={onStatusChange} />);

    await user.click(screen.getByRole('button', { name: 'search.joinRequest.button' }));

    await waitFor(() => {
      expect(mocks.mockApiPost).toHaveBeenCalledWith('/v1/trips/trip-1/join-request');
      expect(onStatusChange).toHaveBeenCalledWith('trip-1', 'pending');
    });
  });

  it('calls withdrawJoinRequest and updates status to none on withdraw', async () => {
    mocks.mockApiDelete.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <TripDiscoveryCard
        trip={{ ...baseTrip, participationStatus: 'pending' }}
        onStatusChange={onStatusChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'search.joinRequest.withdraw' }));

    await waitFor(() => {
      expect(mocks.mockApiDelete).toHaveBeenCalledWith('/v1/trips/trip-1/join-request');
      expect(onStatusChange).toHaveBeenCalledWith('trip-1', 'none');
    });
  });

  it('does not render description when null', () => {
    render(
      <TripDiscoveryCard
        trip={{ ...baseTrip, description: null }}
        onStatusChange={onStatusChange}
      />,
    );
    expect(screen.queryByText('A beach trip.')).not.toBeInTheDocument();
  });
});
