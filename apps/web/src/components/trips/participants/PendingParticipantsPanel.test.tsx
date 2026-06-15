import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripParticipantStatus } from '@chamuco/shared-types';
import type { PendingTripParticipantResponse } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockOnUpdate: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch, delete: mocks.mockDelete },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.mockToastError },
}));

function makeAxios409() {
  return Object.assign(new Error('409'), {
    isAxiosError: true,
    response: { status: 409 },
  });
}

import { PendingParticipantsPanel } from './PendingParticipantsPanel';

const TRIP_ID = 'trip-1';

const joinRequest: PendingTripParticipantResponse = {
  userId: 'user-req',
  username: 'req_user',
  displayName: 'Request User',
  avatarUrl: null,
  status: TripParticipantStatus.PENDING_REQUEST,
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

const invited: PendingTripParticipantResponse = {
  userId: 'user-inv',
  username: 'inv_user',
  displayName: 'Invited User',
  avatarUrl: null,
  status: TripParticipantStatus.INVITED,
  initiatedAt: '2026-01-02T00:00:00.000Z',
};

describe('PendingParticipantsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPatch.mockResolvedValue({ data: {} });
    mocks.mockDelete.mockResolvedValue({ data: {} });
  });

  describe('empty state', () => {
    it('renders empty state when items is empty', () => {
      render(
        <PendingParticipantsPanel tripId={TRIP_ID} items={[]} onUpdate={mocks.mockOnUpdate} />,
      );
      expect(screen.getByText('participants.pending.noItems')).toBeInTheDocument();
    });
  });

  describe('join request row', () => {
    it('shows statusRequest badge for PENDING_REQUEST', () => {
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[joinRequest]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(screen.getByText('participants.pending.statusRequest')).toBeInTheDocument();
    });

    it('shows Accept and Reject buttons for PENDING_REQUEST', () => {
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[joinRequest]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(
        screen.getByRole('button', { name: 'participants.pending.accept' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'participants.pending.reject' }),
      ).toBeInTheDocument();
    });

    it('calls PATCH accept and onUpdate when Accept clicked', async () => {
      const user = userEvent.setup();
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[joinRequest]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.pending.accept' }));
      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          `/v1/trips/${TRIP_ID}/join-requests/${joinRequest.userId}/accept`,
        );
        expect(mocks.mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('calls PATCH reject and onUpdate when Reject clicked', async () => {
      const user = userEvent.setup();
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[joinRequest]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.pending.reject' }));
      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          `/v1/trips/${TRIP_ID}/join-requests/${joinRequest.userId}/reject`,
        );
        expect(mocks.mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('invited row', () => {
    it('shows statusInvited badge for INVITED', () => {
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[invited]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(screen.getByText('participants.pending.statusInvited')).toBeInTheDocument();
    });

    it('shows only Revoke button for INVITED', () => {
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[invited]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(
        screen.getByRole('button', { name: 'participants.pending.revoke' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'participants.pending.accept' }),
      ).not.toBeInTheDocument();
    });

    it('calls DELETE and onUpdate when Revoke clicked', async () => {
      const user = userEvent.setup();
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[invited]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.pending.revoke' }));
      await waitFor(() => {
        expect(mocks.mockDelete).toHaveBeenCalledWith(
          `/v1/trips/${TRIP_ID}/invitations/${invited.userId}`,
        );
        expect(mocks.mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('mixed items', () => {
    it('renders both request and invited rows', () => {
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[joinRequest, invited]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(screen.getByText('Request User')).toBeInTheDocument();
      expect(screen.getByText('Invited User')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows capacityFull toast when accept fails with 409', async () => {
      mocks.mockPatch.mockRejectedValueOnce(makeAxios409());
      const user = userEvent.setup();
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[joinRequest]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.pending.accept' }));
      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('participants.pending.capacityFull');
      });
      expect(mocks.mockOnUpdate).not.toHaveBeenCalled();
    });

    it('shows acceptError toast when accept fails with non-409', async () => {
      mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
      const user = userEvent.setup();
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[joinRequest]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.pending.accept' }));
      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('participants.pending.acceptError');
      });
    });

    it('shows rejectError toast when reject fails', async () => {
      mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
      const user = userEvent.setup();
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[joinRequest]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.pending.reject' }));
      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('participants.pending.rejectError');
      });
    });

    it('shows revokeError toast when revoke fails', async () => {
      mocks.mockDelete.mockRejectedValueOnce(new Error('fail'));
      const user = userEvent.setup();
      render(
        <PendingParticipantsPanel
          tripId={TRIP_ID}
          items={[invited]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'participants.pending.revoke' }));
      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('participants.pending.revokeError');
      });
    });
  });
});
