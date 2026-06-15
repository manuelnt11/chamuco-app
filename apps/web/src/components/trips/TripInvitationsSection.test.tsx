import { render, screen } from '@testing-library/react';
import type { MyTripInvitationResponse } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  mockUseTripInvitations: vi.fn(),
  mockOnSuccess: vi.fn(),
}));

vi.mock('@/store/trip-invitations', () => ({
  useTripInvitations: mocks.mockUseTripInvitations,
}));

vi.mock('@/components/trips/participants/TripInvitationResponseButtons', () => ({
  TripInvitationResponseButtons: ({
    tripId,
    onSuccess,
  }: {
    tripId: string;
    onSuccess: () => void;
    showMessage?: boolean;
  }) => (
    <div data-testid={`invite-buttons-${tripId}`}>
      <button onClick={onSuccess}>accept</button>
      <button>decline</button>
    </div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, unknown>) => {
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

import { TripInvitationsSection } from './TripInvitationsSection';

const mockInvitation: MyTripInvitationResponse = {
  trip: {
    id: 'trip-1',
    name: 'Cancún 2026',
    coverUrl: 'https://cdn.example.com/cover.jpg',
  },
  initiatedAt: '2026-01-15T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TripInvitationsSection', () => {
  it('renders nothing when count is 0', () => {
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [],
      count: 0,
      isLoading: false,
      refresh: vi.fn(),
    });

    const { container } = render(<TripInvitationsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('renders section when there are invitations', () => {
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation],
      count: 1,
      isLoading: false,
      refresh: vi.fn(),
    });

    render(<TripInvitationsSection />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('renders heading with count', () => {
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation],
      count: 1,
      isLoading: false,
      refresh: vi.fn(),
    });

    render(<TripInvitationsSection />);
    expect(screen.getByText('invitations.titleWithCount', { exact: false })).toBeInTheDocument();
  });

  it('renders trip name for each invitation', () => {
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation],
      count: 1,
      isLoading: false,
      refresh: vi.fn(),
    });

    render(<TripInvitationsSection />);
    expect(screen.getByText('Cancún 2026')).toBeInTheDocument();
  });

  it('renders accept/decline buttons for each invitation', () => {
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation],
      count: 1,
      isLoading: false,
      refresh: vi.fn(),
    });

    render(<TripInvitationsSection />);
    expect(screen.getByTestId('invite-buttons-trip-1')).toBeInTheDocument();
  });

  it('renders cover image when coverUrl is set', () => {
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation],
      count: 1,
      isLoading: false,
      refresh: vi.fn(),
    });

    const { container } = render(<TripInvitationsSection />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/cover.jpg');
  });

  it('renders multiple invitations', () => {
    const second: MyTripInvitationResponse = {
      trip: { id: 'trip-2', name: 'Bacalar Trip', coverUrl: null },
      initiatedAt: '2026-02-01T00:00:00.000Z',
    };
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation, second],
      count: 2,
      isLoading: false,
      refresh: vi.fn(),
    });

    render(<TripInvitationsSection />);
    expect(screen.getByText('Cancún 2026')).toBeInTheDocument();
    expect(screen.getByText('Bacalar Trip')).toBeInTheDocument();
  });

  it('calls store refresh on button action', () => {
    const refresh = vi.fn();
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation],
      count: 1,
      isLoading: false,
      refresh,
    });

    render(<TripInvitationsSection />);
    screen.getByText('accept').click();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('calls onSuccess prop on button action', () => {
    const onSuccess = vi.fn();
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation],
      count: 1,
      isLoading: false,
      refresh: vi.fn(),
    });

    render(<TripInvitationsSection onSuccess={onSuccess} />);
    screen.getByText('accept').click();
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('does not throw when onSuccess is not provided', () => {
    mocks.mockUseTripInvitations.mockReturnValue({
      invitations: [mockInvitation],
      count: 1,
      isLoading: false,
      refresh: vi.fn(),
    });

    expect(() => {
      render(<TripInvitationsSection />);
      screen.getByText('accept').click();
    }).not.toThrow();
  });
});
