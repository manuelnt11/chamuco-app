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

import { InvitationResponseButtons } from './InvitationResponseButtons';

describe('InvitationResponseButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPatch.mockResolvedValue({ data: {} });
  });

  it('renders received message and both buttons', () => {
    render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);

    expect(screen.getByText('members.invitation.received')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'members.invitation.accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'members.invitation.decline' })).toBeInTheDocument();
  });

  describe('accept', () => {
    it('calls PATCH invitations/accept when accept is clicked', async () => {
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'members.invitation.accept' }));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/groups/g1/invitations/accept');
      });
    });

    it('calls onSuccess after accepting', async () => {
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'members.invitation.accept' }));

      await waitFor(() => {
        expect(mocks.mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows accepting label while in flight', async () => {
      let resolve!: () => void;
      mocks.mockPatch.mockReturnValue(new Promise<void>((r) => (resolve = r)));

      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'members.invitation.accept' }));

      expect(screen.getByRole('button', { name: 'members.invitation.accepting' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'members.invitation.decline' })).toBeDisabled();
      resolve();
    });

    it('shows error and re-enables buttons when accept fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('fail'));
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'members.invitation.accept' }));

      await waitFor(() => {
        expect(screen.getByText('members.invitation.acceptError')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'members.invitation.accept' })).not.toBeDisabled();
    });
  });

  describe('decline', () => {
    it('calls PATCH invitations/decline when decline is clicked', async () => {
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'members.invitation.decline' }));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/groups/g1/invitations/decline');
      });
    });

    it('calls onSuccess after declining', async () => {
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'members.invitation.decline' }));

      await waitFor(() => {
        expect(mocks.mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows declining label while in flight', async () => {
      let resolve!: () => void;
      mocks.mockPatch.mockReturnValue(new Promise<void>((r) => (resolve = r)));

      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'members.invitation.decline' }));

      expect(screen.getByRole('button', { name: 'members.invitation.declining' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'members.invitation.accept' })).toBeDisabled();
      resolve();
    });

    it('shows error and re-enables buttons when decline fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('fail'));
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'members.invitation.decline' }));

      await waitFor(() => {
        expect(screen.getByText('members.invitation.declineError')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'members.invitation.decline' })).not.toBeDisabled();
    });
  });
});
