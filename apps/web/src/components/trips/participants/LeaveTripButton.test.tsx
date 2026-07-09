import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockRouterPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.mockRouterPush }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { delete: mocks.mockDelete },
}));

import { LeaveTripButton } from './LeaveTripButton';

describe('LeaveTripButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leave button', () => {
    render(<LeaveTripButton tripId="t1" userId="u1" />);
    expect(screen.getByRole('button', { name: 'participants.leave.button' })).toBeInTheDocument();
  });

  it('opens confirmation dialog on click', async () => {
    const user = userEvent.setup();
    render(<LeaveTripButton tripId="t1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'participants.leave.button' }));
    expect(screen.getByText('participants.leave.confirm')).toBeInTheDocument();
  });

  it('calls DELETE and redirects on confirm', async () => {
    mocks.mockDelete.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    render(<LeaveTripButton tripId="t1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'participants.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'participants.leave.confirmButton' }));

    await waitFor(() => {
      expect(mocks.mockDelete).toHaveBeenCalledWith('/v1/trips/t1/participants/u1');
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/trips');
    });
  });

  it('shows lastOrganizer error on 409', async () => {
    const err = Object.assign(new Error('409'), {
      isAxiosError: true,
      response: { status: 409 },
    });
    mocks.mockDelete.mockRejectedValueOnce(err);

    const user = userEvent.setup();
    render(<LeaveTripButton tripId="t1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'participants.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'participants.leave.confirmButton' }));

    await waitFor(() => {
      expect(screen.getByText('participants.leave.lastOrganizer')).toBeInTheDocument();
    });
  });

  it('shows generic error on non-409 failure', async () => {
    const err = Object.assign(new Error('500'), {
      isAxiosError: true,
      response: { status: 500 },
    });
    mocks.mockDelete.mockRejectedValueOnce(err);

    const user = userEvent.setup();
    render(<LeaveTripButton tripId="t1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'participants.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'participants.leave.confirmButton' }));

    await waitFor(() => {
      expect(screen.getByText('participants.leave.error')).toBeInTheDocument();
    });
  });
});
