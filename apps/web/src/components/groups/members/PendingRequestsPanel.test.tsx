import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupMemberStatus } from '@chamuco/shared-types';
import type { PendingGroupMember } from '@/types/group';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockOnUpdate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => {
      if (opts?.count !== undefined) return `${key} (${opts.count})`;
      return key;
    },
  }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    patch: mocks.mockPatch,
    delete: mocks.mockDelete,
  },
}));

import { PendingRequestsPanel } from './PendingRequestsPanel';

const makeRequest = (overrides: Partial<PendingGroupMember> = {}): PendingGroupMember => ({
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  avatarUrl: null,
  status: GroupMemberStatus.REQUEST,
  initiatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeInvitation = (overrides: Partial<PendingGroupMember> = {}): PendingGroupMember => ({
  userId: 'user-2',
  username: 'bob',
  displayName: 'Bob',
  avatarUrl: null,
  status: GroupMemberStatus.INVITED,
  initiatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('PendingRequestsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPatch.mockResolvedValue({ data: {} });
    mocks.mockDelete.mockResolvedValue({ data: {} });
  });

  describe('empty state', () => {
    it('renders empty message when no items', () => {
      render(<PendingRequestsPanel groupId="g1" items={[]} onUpdate={mocks.mockOnUpdate} />);
      expect(screen.getByText('members.pending.noItems')).toBeInTheDocument();
    });

    it('renders title with count 0 when empty', () => {
      render(<PendingRequestsPanel groupId="g1" items={[]} onUpdate={mocks.mockOnUpdate} />);
      expect(screen.getByText('members.pending.title (0)')).toBeInTheDocument();
    });
  });

  describe('REQUEST items', () => {
    it('renders accept and reject buttons for REQUEST status', () => {
      render(
        <PendingRequestsPanel groupId="g1" items={[makeRequest()]} onUpdate={mocks.mockOnUpdate} />,
      );
      expect(screen.getByRole('button', { name: 'members.pending.accept' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'members.pending.reject' })).toBeInTheDocument();
    });

    it('renders REQUEST status badge', () => {
      render(
        <PendingRequestsPanel groupId="g1" items={[makeRequest()]} onUpdate={mocks.mockOnUpdate} />,
      );
      expect(screen.getByText('members.pending.statusRequest')).toBeInTheDocument();
    });

    it('calls accept endpoint and onUpdate when accept clicked', async () => {
      const user = userEvent.setup();
      render(
        <PendingRequestsPanel
          groupId="g1"
          items={[makeRequest({ userId: 'user-req-1' })]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'members.pending.accept' }));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/groups/g1/join-requests/user-req-1/accept',
        );
        expect(mocks.mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('calls reject endpoint and onUpdate when reject clicked', async () => {
      const user = userEvent.setup();
      render(
        <PendingRequestsPanel
          groupId="g1"
          items={[makeRequest({ userId: 'user-req-1' })]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'members.pending.reject' }));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/groups/g1/join-requests/user-req-1/reject',
        );
        expect(mocks.mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('INVITED items', () => {
    it('renders revoke button for INVITED status', () => {
      render(
        <PendingRequestsPanel
          groupId="g1"
          items={[makeInvitation()]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(screen.getByRole('button', { name: 'members.pending.revoke' })).toBeInTheDocument();
    });

    it('does not render accept/reject buttons for INVITED status', () => {
      render(
        <PendingRequestsPanel
          groupId="g1"
          items={[makeInvitation()]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'members.pending.accept' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'members.pending.reject' }),
      ).not.toBeInTheDocument();
    });

    it('renders INVITED status badge', () => {
      render(
        <PendingRequestsPanel
          groupId="g1"
          items={[makeInvitation()]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(screen.getByText('members.pending.statusInvited')).toBeInTheDocument();
    });

    it('calls revoke endpoint and onUpdate when revoke clicked', async () => {
      const user = userEvent.setup();
      render(
        <PendingRequestsPanel
          groupId="g1"
          items={[makeInvitation({ userId: 'user-inv-1' })]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'members.pending.revoke' }));

      await waitFor(() => {
        expect(mocks.mockDelete).toHaveBeenCalledWith('/v1/groups/g1/invitations/user-inv-1');
        expect(mocks.mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('mixed items', () => {
    it('renders pending count in title', () => {
      render(
        <PendingRequestsPanel
          groupId="g1"
          items={[makeRequest(), makeInvitation()]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(screen.getByText('members.pending.title (2)')).toBeInTheDocument();
    });

    it('renders displayName and username for each item', () => {
      render(
        <PendingRequestsPanel
          groupId="g1"
          items={[makeRequest(), makeInvitation()]}
          onUpdate={mocks.mockOnUpdate}
        />,
      );
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('@alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('@bob')).toBeInTheDocument();
    });
  });
});
