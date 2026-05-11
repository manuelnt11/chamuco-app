import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockOnSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { post: mocks.mockPost },
}));

import { InviteMemberModal } from './InviteMemberModal';

function setup() {
  const user = userEvent.setup();
  render(<InviteMemberModal groupId="group-1" onSuccess={mocks.mockOnSuccess} />);
  return { user };
}

describe('InviteMemberModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPost.mockResolvedValue({ data: {} });
  });

  it('renders trigger button', () => {
    setup();
    expect(screen.getByText('members.invite.button')).toBeInTheDocument();
  });

  it('dialog is not visible initially', () => {
    setup();
    expect(screen.queryByText('members.invite.title')).not.toBeInTheDocument();
  });

  it('opens dialog when trigger button is clicked', async () => {
    const { user } = setup();
    await user.click(screen.getByText('members.invite.button'));
    expect(screen.getByRole('heading', { name: 'members.invite.title' })).toBeInTheDocument();
  });

  it('submit button is disabled when username is empty', async () => {
    const { user } = setup();
    await user.click(screen.getByText('members.invite.button'));
    expect(screen.getByRole('button', { name: 'members.invite.submit' })).toBeDisabled();
  });

  it('submit button is enabled when username has value', async () => {
    const { user } = setup();
    await user.click(screen.getByText('members.invite.button'));
    await user.type(screen.getByPlaceholderText('members.invite.usernamePlaceholder'), 'johndoe');
    expect(screen.getByRole('button', { name: 'members.invite.submit' })).not.toBeDisabled();
  });

  it('calls POST with correct payload on submit', async () => {
    const { user } = setup();
    await user.click(screen.getByText('members.invite.button'));
    await user.type(screen.getByPlaceholderText('members.invite.usernamePlaceholder'), 'johndoe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => {
      expect(mocks.mockPost).toHaveBeenCalledWith('/v1/groups/group-1/invitations', {
        targetUsername: 'johndoe',
      });
    });
  });

  it('trims whitespace from username before submitting', async () => {
    const { user } = setup();
    await user.click(screen.getByText('members.invite.button'));
    await user.type(
      screen.getByPlaceholderText('members.invite.usernamePlaceholder'),
      '  johndoe  ',
    );
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => {
      expect(mocks.mockPost).toHaveBeenCalledWith('/v1/groups/group-1/invitations', {
        targetUsername: 'johndoe',
      });
    });
  });

  it('calls onSuccess and closes dialog after successful submission', async () => {
    const { user } = setup();
    await user.click(screen.getByText('members.invite.button'));
    await user.type(screen.getByPlaceholderText('members.invite.usernamePlaceholder'), 'johndoe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => {
      expect(mocks.mockOnSuccess).toHaveBeenCalled();
      expect(screen.queryByText('members.invite.title')).not.toBeInTheDocument();
    });
  });

  it('shows error message on failed submission', async () => {
    mocks.mockPost.mockRejectedValue(new Error('Server error'));
    const { user } = setup();
    await user.click(screen.getByText('members.invite.button'));
    await user.type(screen.getByPlaceholderText('members.invite.usernamePlaceholder'), 'johndoe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => {
      expect(screen.getByText('members.invite.error')).toBeInTheDocument();
    });
    expect(mocks.mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows sending label while request is in flight', async () => {
    let resolve!: () => void;
    mocks.mockPost.mockReturnValue(new Promise<void>((r) => (resolve = r)));

    const { user } = setup();
    await user.click(screen.getByText('members.invite.button'));
    await user.type(screen.getByPlaceholderText('members.invite.usernamePlaceholder'), 'johndoe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    expect(screen.getByRole('button', { name: 'members.invite.sending' })).toBeDisabled();
    resolve();
  });
});
