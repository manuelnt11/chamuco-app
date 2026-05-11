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
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders leave button', () => {
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    expect(screen.getByRole('button', { name: 'members.leave.button' })).toBeInTheDocument();
  });

  it('shows confirm dialog with t key when button clicked', async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));

    expect(window.confirm).toHaveBeenCalledWith('members.leave.confirm');
  });

  it('does not call API when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));

    expect(mocks.mockDelete).not.toHaveBeenCalled();
  });

  it('calls DELETE with correct URL when confirmed', async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));

    await waitFor(() => {
      expect(mocks.mockDelete).toHaveBeenCalledWith('/v1/groups/g1/members/u1');
    });
  });

  it('redirects to /groups on success', async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));

    await waitFor(() => {
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/groups');
    });
  });

  it('shows generic error message on failure', async () => {
    mocks.mockDelete.mockRejectedValue(new Error('Something failed'));
    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));

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

    await waitFor(() => {
      expect(screen.getByText('members.leave.lastAdmin')).toBeInTheDocument();
    });
  });

  it('shows leaving label while request is in flight', async () => {
    let resolve!: () => void;
    mocks.mockDelete.mockReturnValue(new Promise<void>((r) => (resolve = r)));

    const user = userEvent.setup();
    render(<LeaveGroupButton groupId="g1" userId="u1" />);
    await user.click(screen.getByRole('button', { name: 'members.leave.button' }));

    expect(screen.getByRole('button', { name: 'members.leave.leaving' })).toBeDisabled();
    resolve();
  });
});
