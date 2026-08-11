import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripVisibility } from '@chamuco/shared-types';
import type { MyTripJoinRequestResponse } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  mockGetMyTripJoinRequests: vi.fn(),
  mockWithdrawJoinRequest: vi.fn(),
}));

vi.mock('@/services/trips.service', () => ({
  getMyTripJoinRequests: mocks.mockGetMyTripJoinRequests,
  withdrawJoinRequest: mocks.mockWithdrawJoinRequest,
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
  mocks.mockWithdrawJoinRequest.mockResolvedValue(undefined);
});

describe('TripJoinRequestsSection', () => {
  it('renders nothing while loading', () => {
    mocks.mockGetMyTripJoinRequests.mockReturnValue(new Promise(() => {}));

    const { container } = render(<TripJoinRequestsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there are no pending requests', async () => {
    mocks.mockGetMyTripJoinRequests.mockResolvedValue([]);

    const { container } = render(<TripJoinRequestsSection />);
    await waitFor(() => expect(mocks.mockGetMyTripJoinRequests).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the fetch fails', async () => {
    mocks.mockGetMyTripJoinRequests.mockRejectedValue(new Error('network'));

    const { container } = render(<TripJoinRequestsSection />);
    await waitFor(() => expect(mocks.mockGetMyTripJoinRequests).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('renders the trip name, cover, and cancel button', async () => {
    mocks.mockGetMyTripJoinRequests.mockResolvedValue([mockRequest]);

    const { container } = render(<TripJoinRequestsSection />);

    expect(await screen.findByText('Cancún 2026')).toBeInTheDocument();
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/cover.jpg');
    expect(
      screen.getByRole('button', { name: 'participants.myRequests.cancel' }),
    ).toBeInTheDocument();
  });

  it('omits the cover image when coverUrl is null', async () => {
    mocks.mockGetMyTripJoinRequests.mockResolvedValue([{ ...mockRequest, coverUrl: null }]);

    const { container } = render(<TripJoinRequestsSection />);

    await screen.findByText('Cancún 2026');
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('links to the trip page', async () => {
    mocks.mockGetMyTripJoinRequests.mockResolvedValue([mockRequest]);

    render(<TripJoinRequestsSection />);

    const link = await screen.findByText('Cancún 2026');
    expect(link.closest('a')).toHaveAttribute('href', '/trips/trip-1');
  });

  it('withdraws the request and removes it from the list on cancel', async () => {
    mocks.mockGetMyTripJoinRequests.mockResolvedValue([mockRequest]);
    const user = userEvent.setup();

    render(<TripJoinRequestsSection />);
    await screen.findByText('Cancún 2026');

    await user.click(screen.getByRole('button', { name: 'participants.myRequests.cancel' }));

    await waitFor(() => {
      expect(mocks.mockWithdrawJoinRequest).toHaveBeenCalledWith('trip-1');
    });
    await waitFor(() => {
      expect(screen.queryByText('Cancún 2026')).not.toBeInTheDocument();
    });
  });

  it('shows an error message when withdrawing fails', async () => {
    mocks.mockGetMyTripJoinRequests.mockResolvedValue([mockRequest]);
    mocks.mockWithdrawJoinRequest.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();

    render(<TripJoinRequestsSection />);
    await screen.findByText('Cancún 2026');

    await user.click(screen.getByRole('button', { name: 'participants.myRequests.cancel' }));

    expect(await screen.findByText('participants.myRequests.cancelError')).toBeInTheDocument();
    expect(screen.getByText('Cancún 2026')).toBeInTheDocument();
  });

  it('renders multiple pending requests', async () => {
    const second: MyTripJoinRequestResponse = {
      tripId: 'trip-2',
      name: 'Bacalar Trip',
      coverUrl: null,
      visibility: TripVisibility.PUBLIC,
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      initiatedAt: '2026-02-01T00:00:00.000Z',
    };
    mocks.mockGetMyTripJoinRequests.mockResolvedValue([mockRequest, second]);

    render(<TripJoinRequestsSection />);

    expect(await screen.findByText('Cancún 2026')).toBeInTheDocument();
    expect(screen.getByText('Bacalar Trip')).toBeInTheDocument();
  });
});
