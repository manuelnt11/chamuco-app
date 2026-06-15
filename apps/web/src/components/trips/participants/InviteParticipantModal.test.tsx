import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InvitationResult } from '@chamuco/shared-types';
import type { UserSearchResult } from '@/types/user';

const mocks = vi.hoisted(() => ({
  mockInvite: vi.fn(),
  mockOnSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/trips.service', () => ({
  inviteTripParticipants: mocks.mockInvite,
}));

vi.mock('@/components/ui/user-autocomplete', () => ({
  UserAutocomplete: ({
    onSelect,
    placeholder,
  }: {
    onSelect: (user: UserSearchResult) => void;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div>
      <input placeholder={placeholder} readOnly />
      <button
        type="button"
        onClick={() =>
          onSelect({ id: 'user-1', username: 'janedoe', displayName: 'Jane Doe', avatar: null })
        }
      >
        select-user
      </button>
    </div>
  ),
}));

import { InviteParticipantModal } from './InviteParticipantModal';

const TRIP_ID = 'trip-1';

function setup(excludedIds?: string[]) {
  const user = userEvent.setup();
  render(
    <InviteParticipantModal
      tripId={TRIP_ID}
      onSuccess={mocks.mockOnSuccess}
      excludedIds={excludedIds}
    />,
  );
  return { user };
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('participants.invite.button'));
}

async function selectUser(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('select-user'));
}

function makeResults(statuses: InvitationResult['status'][]): { results: InvitationResult[] } {
  return {
    results: statuses.map((status, i) => ({ username: `user${i}`, status })),
  };
}

describe('InviteParticipantModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockInvite.mockResolvedValue(makeResults([]));
  });

  describe('trigger and dialog open/close', () => {
    it('renders trigger button', () => {
      setup();
      expect(screen.getByText('participants.invite.button')).toBeInTheDocument();
    });

    it('dialog not visible initially', () => {
      setup();
      expect(screen.queryByText('participants.invite.title')).not.toBeInTheDocument();
    });

    it('opens dialog on trigger click', async () => {
      const { user } = setup();
      await openDialog(user);
      expect(
        screen.getByRole('heading', { name: 'participants.invite.title' }),
      ).toBeInTheDocument();
    });
  });

  describe('user selection', () => {
    it('submit button disabled when no users selected', async () => {
      const { user } = setup();
      await openDialog(user);
      expect(screen.getByRole('button', { name: 'participants.invite.submit' })).toBeDisabled();
    });

    it('shows chip after selecting user', async () => {
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      expect(screen.getByText('@janedoe')).toBeInTheDocument();
    });

    it('submit enabled after selecting user', async () => {
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      expect(screen.getByRole('button', { name: 'participants.invite.submit' })).not.toBeDisabled();
    });

    it('removes chip when × button clicked', async () => {
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);

      await user.click(screen.getByRole('button', { name: 'participants.invite.removeUser' }));

      expect(screen.queryByText('@janedoe')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'participants.invite.submit' })).toBeDisabled();
    });

    it('shows alreadyExcluded error when selecting excluded user', async () => {
      const { user } = setup(['user-1']);
      await openDialog(user);
      await selectUser(user);

      expect(screen.getByText('participants.invite.alreadyExcluded')).toBeInTheDocument();
      expect(screen.queryByText('@janedoe')).not.toBeInTheDocument();
    });

    it('does not add duplicate user if selected twice', async () => {
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      await selectUser(user);

      expect(screen.getAllByText('@janedoe')).toHaveLength(1);
    });
  });

  describe('submission', () => {
    it('calls inviteTripParticipants with correct payload', async () => {
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      await user.click(screen.getByRole('button', { name: 'participants.invite.submit' }));

      await waitFor(() => {
        expect(mocks.mockInvite).toHaveBeenCalledWith(TRIP_ID, { usernames: ['janedoe'] });
      });
    });

    it('shows sending label while in flight', async () => {
      let resolve!: (val: unknown) => void;
      mocks.mockInvite.mockReturnValue(new Promise((r) => (resolve = r)));

      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      await user.click(screen.getByRole('button', { name: 'participants.invite.submit' }));

      expect(screen.getByRole('button', { name: 'participants.invite.sending' })).toBeDisabled();
      resolve(makeResults([]));
    });

    it('shows results view after successful submission', async () => {
      mocks.mockInvite.mockResolvedValue(makeResults(['INVITED', 'ALREADY_MEMBER']));
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      await user.click(screen.getByRole('button', { name: 'participants.invite.submit' }));

      await waitFor(() => {
        expect(screen.getByText('participants.invite.results.title')).toBeInTheDocument();
        expect(screen.getByText('participants.invite.result.INVITED')).toBeInTheDocument();
        expect(screen.getByText('participants.invite.result.ALREADY_MEMBER')).toBeInTheDocument();
      });
    });

    it('shows error message on submission failure', async () => {
      mocks.mockInvite.mockRejectedValueOnce(new Error('fail'));
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      await user.click(screen.getByRole('button', { name: 'participants.invite.submit' }));

      await waitFor(() => {
        expect(screen.getByText('participants.invite.error')).toBeInTheDocument();
      });
      expect(mocks.mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('done / close', () => {
    it('calls onSuccess and closes when Done clicked after INVITED result', async () => {
      mocks.mockInvite.mockResolvedValue(makeResults(['INVITED']));
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      await user.click(screen.getByRole('button', { name: 'participants.invite.submit' }));

      await waitFor(() => screen.getByRole('button', { name: 'participants.invite.done' }));
      await user.click(screen.getByRole('button', { name: 'participants.invite.done' }));

      await waitFor(() => {
        expect(mocks.mockOnSuccess).toHaveBeenCalledOnce();
        expect(screen.queryByText('participants.invite.title')).not.toBeInTheDocument();
      });
    });

    it('does not call onSuccess when Done clicked with no INVITED results', async () => {
      mocks.mockInvite.mockResolvedValue(makeResults(['ALREADY_MEMBER']));
      const { user } = setup();
      await openDialog(user);
      await selectUser(user);
      await user.click(screen.getByRole('button', { name: 'participants.invite.submit' }));

      await waitFor(() => screen.getByRole('button', { name: 'participants.invite.done' }));
      await user.click(screen.getByRole('button', { name: 'participants.invite.done' }));

      expect(mocks.mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});
