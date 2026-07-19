import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripParticipantStatus, TripRole } from '@chamuco/shared-types';
import type { TripParticipantResponse } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockPatch: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { delete: mocks.mockDelete, patch: mocks.mockPatch },
}));

import { ParticipantListItem } from './ParticipantListItem';
import { toast } from '@/components/ui/toast';

const TRIP_ID = 'trip-1';
const CURRENT_USER_ID = 'current-user';

const baseParticipant: TripParticipantResponse = {
  userId: 'user-1',
  username: 'juan_viajero',
  displayName: 'Juan Viajero',
  avatarUrl: null,
  role: TripRole.PARTICIPANT,
  isTraveler: true,
  status: TripParticipantStatus.ACCEPTED,
  confirmedAt: null,
};

function renderItem(
  overrides: Partial<TripParticipantResponse> = {},
  callerRole: TripRole | null = TripRole.ORGANIZER,
  currentUserId: string | null = CURRENT_USER_ID,
  onActionSuccess = vi.fn(),
) {
  return render(
    <ParticipantListItem
      participant={{ ...baseParticipant, ...overrides }}
      tripId={TRIP_ID}
      currentUserId={currentUserId}
      callerRole={callerRole}
      onActionSuccess={onActionSuccess}
    />,
  );
}

describe('ParticipantListItem', () => {
  describe('rendering', () => {
    it('renders display name', () => {
      renderItem();
      expect(screen.getByText('Juan Viajero')).toBeInTheDocument();
    });

    it('renders @username', () => {
      renderItem();
      expect(screen.getByText('@juan_viajero')).toBeInTheDocument();
    });

    it('does not render role badge for PARTICIPANT (role is obvious)', () => {
      renderItem({ role: TripRole.PARTICIPANT });
      expect(
        screen.queryByText(`participants.role.${TripRole.PARTICIPANT}`),
      ).not.toBeInTheDocument();
    });

    it('renders role badge for ORGANIZER', () => {
      renderItem({ role: TripRole.ORGANIZER });
      expect(screen.getByText(`participants.role.${TripRole.ORGANIZER}`)).toBeInTheDocument();
    });

    it('renders role badge for CO_ORGANIZER', () => {
      renderItem({ role: TripRole.CO_ORGANIZER });
      expect(screen.getByText(`participants.role.${TripRole.CO_ORGANIZER}`)).toBeInTheDocument();
    });

    it('renders traveler badge for ORGANIZER when isTraveler is true', () => {
      renderItem({ isTraveler: true, role: TripRole.ORGANIZER });
      expect(screen.getByText('participants.traveler')).toBeInTheDocument();
    });

    it('renders traveler badge for CO_ORGANIZER when isTraveler is true', () => {
      renderItem({ isTraveler: true, role: TripRole.CO_ORGANIZER });
      expect(screen.getByText('participants.traveler')).toBeInTheDocument();
    });

    it('does not render traveler badge for PARTICIPANT even when isTraveler is true', () => {
      renderItem({ isTraveler: true, role: TripRole.PARTICIPANT });
      expect(screen.queryByText('participants.traveler')).not.toBeInTheDocument();
    });

    it('does not render traveler badge when isTraveler is false', () => {
      renderItem({ isTraveler: false });
      expect(screen.queryByText('participants.traveler')).not.toBeInTheDocument();
    });

    it('renders confirm button (not confirmed) for organizer', () => {
      renderItem({ confirmedAt: null });
      expect(screen.getByTitle('participants.actions.confirm')).toBeInTheDocument();
    });

    it('renders unconfirm button (confirmed) for organizer', () => {
      renderItem({
        status: TripParticipantStatus.CONFIRMED,
        confirmedAt: '2026-01-01T00:00:00.000Z',
      });
      expect(screen.getByTitle('participants.actions.unconfirm')).toBeInTheDocument();
    });

    it('does not render confirmation button for non-organizer viewer', () => {
      renderItem({ confirmedAt: null }, TripRole.PARTICIPANT);
      expect(screen.queryByTitle('participants.actions.confirm')).not.toBeInTheDocument();
    });

    it('does not render confirmation toggle for ORGANIZER target', () => {
      renderItem({ role: TripRole.ORGANIZER, userId: 'other-organizer' }, TripRole.ORGANIZER);
      expect(screen.queryByTitle('participants.actions.confirm')).not.toBeInTheDocument();
      expect(screen.queryByTitle('participants.actions.unconfirm')).not.toBeInTheDocument();
    });

    it('renders initials as avatar fallback when no avatarUrl', () => {
      renderItem();
      expect(screen.getByText('JV')).toBeInTheDocument();
    });
  });

  describe('action button visibility', () => {
    it('hides actions when callerRole is PARTICIPANT', () => {
      renderItem({}, TripRole.PARTICIPANT);
      expect(screen.queryByTitle('participants.actions.remove')).not.toBeInTheDocument();
      expect(screen.queryByTitle('participants.actions.promote')).not.toBeInTheDocument();
    });

    it('hides actions when callerRole is null', () => {
      renderItem({}, null);
      expect(screen.queryByTitle('participants.actions.remove')).not.toBeInTheDocument();
    });

    it('hides actions on own row', () => {
      renderItem({}, TripRole.ORGANIZER, 'user-1');
      expect(screen.queryByTitle('participants.actions.remove')).not.toBeInTheDocument();
    });

    it('hides actions when target is ORGANIZER', () => {
      renderItem({ role: TripRole.ORGANIZER, userId: 'other-organizer' });
      expect(screen.queryByTitle('participants.actions.remove')).not.toBeInTheDocument();
      expect(screen.queryByTitle('participants.actions.promote')).not.toBeInTheDocument();
    });

    it('shows promote and remove for ORGANIZER viewing a PARTICIPANT', () => {
      renderItem({ role: TripRole.PARTICIPANT });
      expect(screen.getByTitle('participants.actions.promote')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'actions.delete' })).toBeInTheDocument();
    });

    it('shows demote and remove for ORGANIZER viewing a CO_ORGANIZER', () => {
      renderItem({ role: TripRole.CO_ORGANIZER });
      expect(screen.getByTitle('participants.actions.demote')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'actions.delete' })).toBeInTheDocument();
    });

    it('shows actions when callerRole is CO_ORGANIZER', () => {
      renderItem({ role: TripRole.PARTICIPANT }, TripRole.CO_ORGANIZER);
      expect(screen.getByTitle('participants.actions.promote')).toBeInTheDocument();
    });

    it('does not show promote for CO_ORGANIZER or ORGANIZER targets', () => {
      renderItem({ role: TripRole.CO_ORGANIZER });
      expect(screen.queryByTitle('participants.actions.promote')).not.toBeInTheDocument();
    });

    it('does not show demote for PARTICIPANT target', () => {
      renderItem({ role: TripRole.PARTICIPANT });
      expect(screen.queryByTitle('participants.actions.demote')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    beforeEach(() => {
      mocks.mockDelete.mockResolvedValue(undefined);
      mocks.mockPatch.mockResolvedValue(undefined);
    });

    it('calls delete endpoint and onActionSuccess on remove confirm', async () => {
      const onActionSuccess = vi.fn();
      renderItem(
        { role: TripRole.PARTICIPANT },
        TripRole.ORGANIZER,
        CURRENT_USER_ID,
        onActionSuccess,
      );

      const deleteBtn = screen.getByRole('button', { name: 'actions.delete' });
      await userEvent.click(deleteBtn);
      const confirmBtn = screen.getByRole('button', { name: 'actions.deleteConfirm' });
      await userEvent.click(confirmBtn);

      expect(mocks.mockDelete).toHaveBeenCalledWith(
        `/v1/trips/${TRIP_ID}/participants/${baseParticipant.userId}`,
      );
      expect(onActionSuccess).toHaveBeenCalled();
    });

    it('calls patch with CO_ORGANIZER role and onActionSuccess on promote', async () => {
      const onActionSuccess = vi.fn();
      renderItem(
        { role: TripRole.PARTICIPANT },
        TripRole.ORGANIZER,
        CURRENT_USER_ID,
        onActionSuccess,
      );

      await userEvent.click(screen.getByTitle('participants.actions.promote'));

      expect(mocks.mockPatch).toHaveBeenCalledWith(
        `/v1/trips/${TRIP_ID}/participants/${baseParticipant.userId}/role`,
        { role: TripRole.CO_ORGANIZER },
      );
      expect(onActionSuccess).toHaveBeenCalled();
    });

    it('calls patch with PARTICIPANT role and onActionSuccess on demote', async () => {
      const onActionSuccess = vi.fn();
      renderItem(
        { role: TripRole.CO_ORGANIZER },
        TripRole.ORGANIZER,
        CURRENT_USER_ID,
        onActionSuccess,
      );

      await userEvent.click(screen.getByTitle('participants.actions.demote'));

      expect(mocks.mockPatch).toHaveBeenCalledWith(
        `/v1/trips/${TRIP_ID}/participants/${baseParticipant.userId}/role`,
        { role: TripRole.PARTICIPANT },
      );
      expect(onActionSuccess).toHaveBeenCalled();
    });

    it('shows toast error when promote fails', async () => {
      mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
      renderItem({ role: TripRole.PARTICIPANT }, TripRole.ORGANIZER, CURRENT_USER_ID, vi.fn());

      await userEvent.click(screen.getByTitle('participants.actions.promote'));

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('participants.actions.promoteError');
    });

    it('shows toast error when demote fails', async () => {
      mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
      renderItem({ role: TripRole.CO_ORGANIZER }, TripRole.ORGANIZER, CURRENT_USER_ID, vi.fn());

      await userEvent.click(screen.getByTitle('participants.actions.demote'));

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('participants.actions.demoteError');
    });

    it('shows toast error when remove fails', async () => {
      mocks.mockDelete.mockRejectedValueOnce(new Error('fail'));
      renderItem({ role: TripRole.PARTICIPANT }, TripRole.ORGANIZER, CURRENT_USER_ID, vi.fn());

      const deleteBtn = screen.getByRole('button', { name: 'actions.delete' });
      await userEvent.click(deleteBtn);
      const confirmBtn = screen.getByRole('button', { name: 'actions.deleteConfirm' });
      await userEvent.click(confirmBtn);

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('participants.actions.removeError');
    });

    it('calls toggle confirmation endpoint and onActionSuccess on click', async () => {
      const onActionSuccess = vi.fn();
      renderItem({ confirmedAt: null }, TripRole.ORGANIZER, CURRENT_USER_ID, onActionSuccess);

      await userEvent.click(screen.getByTitle('participants.actions.confirm'));

      expect(mocks.mockPatch).toHaveBeenCalledWith(
        `/v1/trips/${TRIP_ID}/participants/${baseParticipant.userId}/confirmation`,
      );
      expect(onActionSuccess).toHaveBeenCalled();
    });

    it('shows toast error when confirmation toggle fails', async () => {
      mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
      renderItem({ confirmedAt: null }, TripRole.ORGANIZER, CURRENT_USER_ID, vi.fn());

      await userEvent.click(screen.getByTitle('participants.actions.confirm'));

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('participants.actions.confirmError');
    });
  });
});
