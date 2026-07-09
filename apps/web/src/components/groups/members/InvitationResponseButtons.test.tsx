import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockOnSuccess: vi.fn(),
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
    expect(screen.getByRole('button', { name: 'common:actions.accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common:actions.decline' })).toBeInTheDocument();
  });

  describe('accept', () => {
    it('calls PATCH invitations/accept when accept is clicked', async () => {
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'common:actions.accept' }));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/groups/g1/invitations/accept');
      });
    });

    it('calls onSuccess after accepting', async () => {
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'common:actions.accept' }));

      await waitFor(() => {
        expect(mocks.mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('disables both buttons while accept is in flight', async () => {
      let resolve!: () => void;
      mocks.mockPatch.mockReturnValue(new Promise<void>((r) => (resolve = r)));

      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'common:actions.accept' }));

      expect(screen.getByRole('button', { name: 'common:actions.accept' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'common:actions.decline' })).toBeDisabled();
      resolve();
    });

    it('shows error and re-enables buttons when accept fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('fail'));
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'common:actions.accept' }));

      await waitFor(() => {
        expect(screen.getByText('members.invitation.acceptError')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'common:actions.accept' })).not.toBeDisabled();
    });
  });

  describe('decline', () => {
    it('calls PATCH invitations/decline when decline is clicked', async () => {
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'common:actions.decline' }));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/groups/g1/invitations/decline');
      });
    });

    it('calls onSuccess after declining', async () => {
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'common:actions.decline' }));

      await waitFor(() => {
        expect(mocks.mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('disables both buttons while decline is in flight', async () => {
      let resolve!: () => void;
      mocks.mockPatch.mockReturnValue(new Promise<void>((r) => (resolve = r)));

      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'common:actions.decline' }));

      expect(screen.getByRole('button', { name: 'common:actions.decline' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'common:actions.accept' })).toBeDisabled();
      resolve();
    });

    it('shows error and re-enables buttons when decline fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('fail'));
      const user = userEvent.setup();
      render(<InvitationResponseButtons groupId="g1" onSuccess={mocks.mockOnSuccess} />);
      await user.click(screen.getByRole('button', { name: 'common:actions.decline' }));

      await waitFor(() => {
        expect(screen.getByText('members.invitation.declineError')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'common:actions.decline' })).not.toBeDisabled();
    });
  });
});
