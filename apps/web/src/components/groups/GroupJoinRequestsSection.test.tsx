import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupVisibility } from '@chamuco/shared-types';
import type { MyGroupJoinRequest } from '@/types/group';

const mocks = vi.hoisted(() => ({
  mockGetMyGroupJoinRequests: vi.fn(),
  mockWithdrawGroupJoinRequest: vi.fn(),
}));

vi.mock('@/services/groups.service', () => ({
  getMyGroupJoinRequests: mocks.mockGetMyGroupJoinRequests,
  withdrawGroupJoinRequest: mocks.mockWithdrawGroupJoinRequest,
}));

import { GroupJoinRequestsSection } from './GroupJoinRequestsSection';

const mockRequest: MyGroupJoinRequest = {
  groupId: 'group-1',
  name: 'Mountain Crew',
  coverUrl: 'https://cdn.example.com/cover.jpg',
  visibility: GroupVisibility.PUBLIC,
  initiatedAt: '2026-01-15T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockWithdrawGroupJoinRequest.mockResolvedValue(undefined);
});

describe('GroupJoinRequestsSection', () => {
  it('renders nothing while loading', () => {
    mocks.mockGetMyGroupJoinRequests.mockReturnValue(new Promise(() => {}));

    const { container } = render(<GroupJoinRequestsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there are no pending requests', async () => {
    mocks.mockGetMyGroupJoinRequests.mockResolvedValue([]);

    const { container } = render(<GroupJoinRequestsSection />);
    await waitFor(() => expect(mocks.mockGetMyGroupJoinRequests).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the fetch fails', async () => {
    mocks.mockGetMyGroupJoinRequests.mockRejectedValue(new Error('network'));

    const { container } = render(<GroupJoinRequestsSection />);
    await waitFor(() => expect(mocks.mockGetMyGroupJoinRequests).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('renders the group name, cover, and cancel button', async () => {
    mocks.mockGetMyGroupJoinRequests.mockResolvedValue([mockRequest]);

    const { container } = render(<GroupJoinRequestsSection />);

    expect(await screen.findByText('Mountain Crew')).toBeInTheDocument();
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/cover.jpg');
    expect(screen.getByRole('button', { name: 'members.myRequests.cancel' })).toBeInTheDocument();
  });

  it('links to the group members page', async () => {
    mocks.mockGetMyGroupJoinRequests.mockResolvedValue([mockRequest]);

    render(<GroupJoinRequestsSection />);

    const link = await screen.findByText('Mountain Crew');
    expect(link.closest('a')).toHaveAttribute('href', '/groups/group-1');
  });

  it('withdraws the request and removes it from the list on cancel', async () => {
    mocks.mockGetMyGroupJoinRequests.mockResolvedValue([mockRequest]);
    const user = userEvent.setup();

    render(<GroupJoinRequestsSection />);
    await screen.findByText('Mountain Crew');

    await user.click(screen.getByRole('button', { name: 'members.myRequests.cancel' }));

    await waitFor(() => {
      expect(mocks.mockWithdrawGroupJoinRequest).toHaveBeenCalledWith('group-1');
    });
    await waitFor(() => {
      expect(screen.queryByText('Mountain Crew')).not.toBeInTheDocument();
    });
  });

  it('shows an error message when withdrawing fails', async () => {
    mocks.mockGetMyGroupJoinRequests.mockResolvedValue([mockRequest]);
    mocks.mockWithdrawGroupJoinRequest.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();

    render(<GroupJoinRequestsSection />);
    await screen.findByText('Mountain Crew');

    await user.click(screen.getByRole('button', { name: 'members.myRequests.cancel' }));

    expect(await screen.findByText('members.myRequests.cancelError')).toBeInTheDocument();
    expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
  });

  it('renders multiple pending requests', async () => {
    const second: MyGroupJoinRequest = {
      groupId: 'group-2',
      name: 'Beach Club',
      coverUrl: 'https://cdn.example.com/cover2.jpg',
      visibility: GroupVisibility.PUBLIC,
      initiatedAt: '2026-02-01T00:00:00.000Z',
    };
    mocks.mockGetMyGroupJoinRequests.mockResolvedValue([mockRequest, second]);

    render(<GroupJoinRequestsSection />);

    expect(await screen.findByText('Mountain Crew')).toBeInTheDocument();
    expect(screen.getByText('Beach Club')).toBeInTheDocument();
  });
});
