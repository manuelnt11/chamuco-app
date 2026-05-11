import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockRouterPush: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { delete: mocks.mockDelete },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.mockRouterPush }),
}));

import { LeaveGroupButton } from './LeaveGroupButton';

describe('LeaveGroupButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockDelete.mockResolvedValue({ data: {} });
  });

  it('renders leave button', () => {
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    expect(screen.getByRole('button', { name: 'members.leave.button' })).toBeInTheDocument();
  });

  it('dialog is not visible initially', () => {
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    expect(screen.queryByText('members.leave.confirm')).not.toBeInTheDocument();
  });

  it('opens confirmation dialog when leave button is clicked', async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));

    expect(screen.getByText('members.leave.confirm')).toBeInTheDocument();
  });

  it('does not call API when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'members.leave.cancel' }));

    expect(mocks.mockDelete).not.toHaveBeenCalled();
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'members.leave.cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('members.leave.confirm')).not.toBeInTheDocument();
    });
  });

  it('calls DELETE with correct URL when confirmed', async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'members.leave.confirmButton' }));

    await waitFor(() => {
      expect(mocks.mockDelete).toHaveBeenCalledWith('/v1/groups/g1/members/u1');
    });
  });

  it('redirects to /groups on success', async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'members.leave.confirmButton' }));

    await waitFor(() => {
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/groups');
    });
  });

  it('shows error in dialog on failure', async () => {
    mocks.mockDelete.mockRejectedValue(new Error('Something failed'));
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'members.leave.confirmButton' }));

    await waitFor(() => {
      expect(screen.getByText('members.leave.error')).toBeInTheDocument();
    });
    expect(mocks.mockRouterPush).not.toHaveBeenCalled();
  });

  it('shows last admin error on HTTP 409 response', async () => {
    const axiosError = Object.assign(new Error('Conflict'), {
      isAxiosError: true,
      response: { status: 409 },
    });
    mocks.mockDelete.mockRejectedValue(axiosError);
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'members.leave.confirmButton' }));

    await waitFor(() => {
      expect(screen.getByText('members.leave.lastAdmin')).toBeInTheDocument();
    });
  });

  it('shows leaving label on confirm button while request is in flight', async () => {
    let resolve!: () => void;
    mocks.mockDelete.mockReturnValue(new Promise<void>((r) => (resolve = r)));

    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'members.leave.confirmButton' }));

    expect(screen.getByRole('button', { name: 'members.leave.leaving' })).toBeDisabled();
    resolve();
  });

  it('disables cancel button while request is in flight', async () => {
    let resolve!: () => void;
    mocks.mockDelete.mockReturnValue(new Promise<void>((r) => (resolve = r)));

    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));
    await user.click(screen.getByRole('button', { name: 'members.leave.confirmButton' }));

    expect(screen.getByRole('button', { name: 'members.leave.cancel' })).toBeDisabled();
    resolve();
  });
});
