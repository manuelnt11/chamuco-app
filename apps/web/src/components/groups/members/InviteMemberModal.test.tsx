import { type ComponentProps, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockOnSuccess: vi.fn(),
  mockUseUserSearch: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { post: mocks.mockPost },
}));

vi.mock('@/hooks/useUserSearch', () => ({
  useUserSearch: mocks.mockUseUserSearch,
}));

vi.mock('@base-ui/react/avatar', () => ({
  Avatar: {
    Root: ({ children, ...props }: ComponentProps<'div'>) => <div {...props}>{children}</div>,
    Image: ({ src, alt }: ComponentProps<'img'>) => <img src={src} alt={alt} />,
    Fallback: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  },
}));

import { InviteMemberModal } from './InviteMemberModal';

const janeDoe = {
  id: 'user-1',
  username: 'janedoe',
  displayName: 'Jane Doe',
  avatar: null,
};

function setup() {
  const user = userEvent.setup();
  render(<InviteMemberModal groupId="group-1" onSuccess={mocks.mockOnSuccess} />);
  return { user };
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('members.invite.button'));
}

async function selectUser(user: ReturnType<typeof userEvent.setup>, displayName: string) {
  const input = screen.getByPlaceholderText('members.invite.usernamePlaceholder');
  await user.type(input, 'ja');
  await waitFor(() => screen.getByText(displayName));
  await user.click(screen.getByText(displayName));
}

describe('InviteMemberModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPost.mockResolvedValue({ data: { results: [] } });
    mocks.mockUseUserSearch.mockReturnValue({ results: [], isLoading: false });
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
    await openDialog(user);
    expect(screen.getByRole('heading', { name: 'members.invite.title' })).toBeInTheDocument();
  });

  it('submit button is disabled when no users are selected', async () => {
    const { user } = setup();
    await openDialog(user);
    expect(screen.getByRole('button', { name: 'members.invite.submit' })).toBeDisabled();
  });

  it('submit button is enabled after selecting a user from autocomplete', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');
    expect(screen.getByRole('button', { name: 'members.invite.submit' })).not.toBeDisabled();
  });

  it('shows chip after selecting a user', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');
    expect(screen.getByText('@janedoe')).toBeInTheDocument();
  });

  it('removes chip when × button is clicked', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');

    await user.click(screen.getByRole('button', { name: 'members.invite.removeUser' }));

    expect(screen.queryByText('@janedoe')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'members.invite.submit' })).toBeDisabled();
  });

  it('calls POST with correct payload on submit', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => {
      expect(mocks.mockPost).toHaveBeenCalledWith('/v1/groups/group-1/invitations', {
        usernames: ['janedoe'],
      });
    });
  });

  it('shows results view after successful submission', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    mocks.mockPost.mockResolvedValue({
      data: { results: [{ username: 'janedoe', status: 'INVITED' }] },
    });
    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => {
      expect(screen.getByText('members.invite.results.title')).toBeInTheDocument();
      expect(screen.getByText('members.invite.result.INVITED')).toBeInTheDocument();
    });
  });

  it('calls onSuccess and closes when Done is clicked after any INVITED result', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    mocks.mockPost.mockResolvedValue({
      data: { results: [{ username: 'janedoe', status: 'INVITED' }] },
    });
    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => screen.getByText('members.invite.done'));
    await user.click(screen.getByRole('button', { name: 'members.invite.done' }));

    await waitFor(() => {
      expect(mocks.mockOnSuccess).toHaveBeenCalled();
      expect(screen.queryByText('members.invite.title')).not.toBeInTheDocument();
    });
  });

  it('does not call onSuccess when Done is clicked with no INVITED results', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    mocks.mockPost.mockResolvedValue({
      data: { results: [{ username: 'janedoe', status: 'ALREADY_MEMBER' }] },
    });
    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => screen.getByText('members.invite.done'));
    await user.click(screen.getByRole('button', { name: 'members.invite.done' }));

    expect(mocks.mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows alreadyExcluded error when selecting a user in excludedIds', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    const user = userEvent.setup();
    render(
      <InviteMemberModal
        groupId="group-1"
        onSuccess={mocks.mockOnSuccess}
        excludedIds={['user-1']}
      />,
    );
    await user.click(screen.getByText('members.invite.button'));

    const input = screen.getByPlaceholderText('members.invite.usernamePlaceholder');
    await user.type(input, 'ja');
    await waitFor(() => screen.getByText('Jane Doe'));
    await user.click(screen.getByText('Jane Doe'));

    expect(screen.getByText('members.invite.alreadyExcluded')).toBeInTheDocument();
    expect(screen.queryByText('@janedoe')).not.toBeInTheDocument();
  });

  it('shows error message on failed submission', async () => {
    mocks.mockPost.mockRejectedValue(new Error('Server error'));
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });
    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    await waitFor(() => {
      expect(screen.getByText('members.invite.error')).toBeInTheDocument();
    });
    expect(mocks.mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows sending label while request is in flight', async () => {
    let resolve!: (val: unknown) => void;
    mocks.mockPost.mockReturnValue(new Promise((r) => (resolve = r)));
    mocks.mockUseUserSearch.mockReturnValue({ results: [janeDoe], isLoading: false });

    const { user } = setup();
    await openDialog(user);
    await selectUser(user, 'Jane Doe');
    await user.click(screen.getByRole('button', { name: 'members.invite.submit' }));

    expect(screen.getByRole('button', { name: 'members.invite.sending' })).toBeDisabled();
    resolve({ data: { results: [] } });
  });
});
