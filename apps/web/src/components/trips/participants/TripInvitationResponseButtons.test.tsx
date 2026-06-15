import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockOnSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

import { TripInvitationResponseButtons } from './TripInvitationResponseButtons';

describe('TripInvitationResponseButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPatch.mockResolvedValue({ data: {} });
  });

  it('renders accept and decline buttons', () => {
    render(<TripInvitationResponseButtons tripId="t1" onSuccess={mocks.mockOnSuccess} />);
    expect(screen.getByRole('button', { name: 'common:actions.accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common:actions.decline' })).toBeInTheDocument();
  });

  it('shows received message by default', () => {
    render(<TripInvitationResponseButtons tripId="t1" onSuccess={mocks.mockOnSuccess} />);
    expect(screen.getByText('participants.invitation.received')).toBeInTheDocument();
  });

  it('hides received message when showMessage is false', () => {
    render(
      <TripInvitationResponseButtons
        tripId="t1"
        onSuccess={mocks.mockOnSuccess}
        showMessage={false}
      />,
    );
    expect(screen.queryByText('participants.invitation.received')).not.toBeInTheDocument();
  });

  it('calls PATCH accept and onSuccess when accept clicked', async () => {
    const user = userEvent.setup();
    render(<TripInvitationResponseButtons tripId="t1" onSuccess={mocks.mockOnSuccess} />);
    await user.click(screen.getByRole('button', { name: 'common:actions.accept' }));
    await waitFor(() => {
      expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/trips/t1/invitations/accept');
      expect(mocks.mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls PATCH decline and onSuccess when decline clicked', async () => {
    const user = userEvent.setup();
    render(<TripInvitationResponseButtons tripId="t1" onSuccess={mocks.mockOnSuccess} />);
    await user.click(screen.getByRole('button', { name: 'common:actions.decline' }));
    await waitFor(() => {
      expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/trips/t1/invitations/decline');
      expect(mocks.mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows acceptError on accept failure', async () => {
    mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    render(<TripInvitationResponseButtons tripId="t1" onSuccess={mocks.mockOnSuccess} />);
    await user.click(screen.getByRole('button', { name: 'common:actions.accept' }));
    await waitFor(() => {
      expect(screen.getByText('participants.invitation.acceptError')).toBeInTheDocument();
    });
  });

  it('shows declineError on decline failure', async () => {
    mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    render(<TripInvitationResponseButtons tripId="t1" onSuccess={mocks.mockOnSuccess} />);
    await user.click(screen.getByRole('button', { name: 'common:actions.decline' }));
    await waitFor(() => {
      expect(screen.getByText('participants.invitation.declineError')).toBeInTheDocument();
    });
  });

  it('disables both buttons while accepting', async () => {
    let resolve!: () => void;
    mocks.mockPatch.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)));

    const user = userEvent.setup();
    render(<TripInvitationResponseButtons tripId="t1" onSuccess={mocks.mockOnSuccess} />);
    await user.click(screen.getByRole('button', { name: 'common:actions.accept' }));

    expect(screen.getByRole('button', { name: 'common:actions.accept' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'common:actions.decline' })).toBeDisabled();
    resolve();
  });
});
