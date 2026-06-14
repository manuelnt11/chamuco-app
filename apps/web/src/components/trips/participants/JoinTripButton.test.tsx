import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
  mockOnSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    post: mocks.mockPost,
    delete: mocks.mockDelete,
  },
}));

import { JoinTripButton } from './JoinTripButton';

describe('JoinTripButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPost.mockResolvedValue({ data: {} });
    mocks.mockDelete.mockResolvedValue({ data: {} });
  });

  describe('join mode (hasPendingRequest = false)', () => {
    it('renders join button', () => {
      render(
        <JoinTripButton tripId="t1" hasPendingRequest={false} onSuccess={mocks.mockOnSuccess} />,
      );
      expect(
        screen.getByRole('button', { name: 'participants.joinRequest.button' }),
      ).toBeInTheDocument();
    });

    it('calls POST join-request when clicked', async () => {
      const user = userEvent.setup();
      render(
        <JoinTripButton tripId="t1" hasPendingRequest={false} onSuccess={mocks.mockOnSuccess} />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.joinRequest.button' }));
      await waitFor(() => {
        expect(mocks.mockPost).toHaveBeenCalledWith('/v1/trips/t1/join-request');
      });
    });

    it('calls onSuccess after successful join request', async () => {
      const user = userEvent.setup();
      render(
        <JoinTripButton tripId="t1" hasPendingRequest={false} onSuccess={mocks.mockOnSuccess} />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.joinRequest.button' }));
      await waitFor(() => {
        expect(mocks.mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows requesting label while in flight', async () => {
      let resolve!: () => void;
      mocks.mockPost.mockReturnValue(new Promise<void>((r) => (resolve = r)));

      const user = userEvent.setup();
      render(
        <JoinTripButton tripId="t1" hasPendingRequest={false} onSuccess={mocks.mockOnSuccess} />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.joinRequest.button' }));

      expect(
        screen.getByRole('button', { name: 'participants.joinRequest.requesting' }),
      ).toBeDisabled();
      resolve();
    });
  });

  describe('withdraw mode (hasPendingRequest = true)', () => {
    it('renders withdraw button', () => {
      render(
        <JoinTripButton tripId="t1" hasPendingRequest={true} onSuccess={mocks.mockOnSuccess} />,
      );
      expect(
        screen.getByRole('button', { name: 'participants.joinRequest.withdraw' }),
      ).toBeInTheDocument();
    });

    it('calls DELETE join-request when clicked', async () => {
      const user = userEvent.setup();
      render(
        <JoinTripButton tripId="t1" hasPendingRequest={true} onSuccess={mocks.mockOnSuccess} />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.joinRequest.withdraw' }));
      await waitFor(() => {
        expect(mocks.mockDelete).toHaveBeenCalledWith('/v1/trips/t1/join-request');
      });
    });

    it('calls onSuccess after successful withdraw', async () => {
      const user = userEvent.setup();
      render(
        <JoinTripButton tripId="t1" hasPendingRequest={true} onSuccess={mocks.mockOnSuccess} />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.joinRequest.withdraw' }));
      await waitFor(() => {
        expect(mocks.mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows withdrawing label while in flight', async () => {
      let resolve!: () => void;
      mocks.mockDelete.mockReturnValue(new Promise<void>((r) => (resolve = r)));

      const user = userEvent.setup();
      render(
        <JoinTripButton tripId="t1" hasPendingRequest={true} onSuccess={mocks.mockOnSuccess} />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.joinRequest.withdraw' }));

      expect(
        screen.getByRole('button', { name: 'participants.joinRequest.withdrawing' }),
      ).toBeDisabled();
      resolve();
    });
  });
});
