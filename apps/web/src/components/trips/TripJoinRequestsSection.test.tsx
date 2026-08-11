import { render, screen } from '@testing-library/react';
import { TripVisibility } from '@chamuco/shared-types';
import type { MyTripJoinRequestResponse } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  mockGetMyTripJoinRequests: vi.fn(),
  mockWithdrawJoinRequest: vi.fn(),
  mockUsePendingJoinRequests: vi.fn(),
}));

vi.mock('@/services/trips.service', () => ({
  getMyTripJoinRequests: mocks.mockGetMyTripJoinRequests,
  withdrawJoinRequest: mocks.mockWithdrawJoinRequest,
}));

vi.mock('@/hooks/usePendingJoinRequests', () => ({
  usePendingJoinRequests: mocks.mockUsePendingJoinRequests,
}));

vi.mock('@/components/shared/PendingJoinRequestsSection', () => ({
  PendingJoinRequestsSection: (props: {
    titleText: string;
    items: MyTripJoinRequestResponse[];
    getId: (item: MyTripJoinRequestResponse) => string;
    getHref: (item: MyTripJoinRequestResponse) => string;
    cancelLabel: string;
    cancelErrorLabel: string;
    locale: string;
  }) => (
    <div data-testid="pending-section">
      <span data-testid="title">{props.titleText}</span>
      <span data-testid="cancel-label">{props.cancelLabel}</span>
      <span data-testid="cancel-error-label">{props.cancelErrorLabel}</span>
      <span data-testid="locale">{props.locale}</span>
      {props.items.map((item) => (
        <span key={props.getId(item)} data-testid="href">
          {props.getHref(item)}
        </span>
      ))}
    </div>
  ),
}));

import { TripJoinRequestsSection } from './TripJoinRequestsSection';

const mockRequest: MyTripJoinRequestResponse = {
  tripId: 'trip-1',
  name: 'Cancún 2026',
  coverUrl: 'https://cdn.example.com/cover.jpg',
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  initiatedAt: '2026-01-15T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TripJoinRequestsSection', () => {
  it('renders nothing while loading', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [],
      isLoading: true,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    const { container } = render(<TripJoinRequestsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there are no pending requests', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [],
      isLoading: false,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    const { container } = render(<TripJoinRequestsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('wires usePendingJoinRequests to the trip service functions', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [mockRequest],
      isLoading: false,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    render(<TripJoinRequestsSection />);

    const options = mocks.mockUsePendingJoinRequests.mock.calls[0]![0];
    expect(options.fetchRequests).toBe(mocks.mockGetMyTripJoinRequests);
    expect(options.cancelRequest).toBe(mocks.mockWithdrawJoinRequest);
    expect(options.getId(mockRequest)).toBe('trip-1');
  });

  it('passes the trip i18n keys and app locale to the shared section', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [mockRequest],
      isLoading: false,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    render(<TripJoinRequestsSection />);

    expect(screen.getByTestId('title')).toHaveTextContent('participants.myRequests.titleWithCount');
    expect(screen.getByTestId('cancel-label')).toHaveTextContent('participants.myRequests.cancel');
    expect(screen.getByTestId('cancel-error-label')).toHaveTextContent(
      'participants.myRequests.cancelError',
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
  });

  it('builds a /trips/:id href for each request', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [mockRequest],
      isLoading: false,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    render(<TripJoinRequestsSection />);

    expect(screen.getByTestId('href')).toHaveTextContent('/trips/trip-1');
  });
});
