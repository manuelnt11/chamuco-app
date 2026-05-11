import { render, screen } from '@testing-library/react';
import { GroupMemberTier, GroupRole } from '@chamuco/shared-types';
import type { GroupMember } from '@/types/group';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { post: mocks.mockPost },
}));

import { MemberList } from './MemberList';

const makeMember = (overrides: Partial<GroupMember> = {}): GroupMember => ({
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  avatarUrl: null,
  role: GroupRole.MEMBER,
  tier: GroupMemberTier.NEWCOMER,
  joinedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('MemberList', () => {
  describe('rendering', () => {
    it('renders member count in title', () => {
      render(
        <MemberList
          groupId="g1"
          members={[makeMember(), makeMember({ userId: 'user-2', username: 'bob' })]}
          currentUserRole={GroupRole.MEMBER}
          onInviteSuccess={vi.fn()}
        />,
      );
      expect(screen.getByText('members.title (2)')).toBeInTheDocument();
    });

    it('renders all members', () => {
      render(
        <MemberList
          groupId="g1"
          members={[
            makeMember({ displayName: 'Alice' }),
            makeMember({ userId: 'user-2', displayName: 'Bob', username: 'bob' }),
          ]}
          currentUserRole={GroupRole.MEMBER}
          onInviteSuccess={vi.fn()}
        />,
      );
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('renders empty state when no members', () => {
      render(
        <MemberList
          groupId="g1"
          members={[]}
          currentUserRole={GroupRole.MEMBER}
          onInviteSuccess={vi.fn()}
        />,
      );
      expect(screen.getByText('members.empty')).toBeInTheDocument();
    });
  });

  describe('invite button visibility', () => {
    it('shows invite button for OWNER', () => {
      render(
        <MemberList
          groupId="g1"
          members={[makeMember()]}
          currentUserRole={GroupRole.OWNER}
          onInviteSuccess={vi.fn()}
        />,
      );
      expect(screen.getByText('members.invite.button')).toBeInTheDocument();
    });

    it('shows invite button for ADMIN', () => {
      render(
        <MemberList
          groupId="g1"
          members={[makeMember()]}
          currentUserRole={GroupRole.ADMIN}
          onInviteSuccess={vi.fn()}
        />,
      );
      expect(screen.getByText('members.invite.button')).toBeInTheDocument();
    });

    it('hides invite button for MEMBER', () => {
      render(
        <MemberList
          groupId="g1"
          members={[makeMember()]}
          currentUserRole={GroupRole.MEMBER}
          onInviteSuccess={vi.fn()}
        />,
      );
      expect(screen.queryByText('members.invite.button')).not.toBeInTheDocument();
    });

    it('hides invite button when currentUserRole is null', () => {
      render(
        <MemberList
          groupId="g1"
          members={[makeMember()]}
          currentUserRole={null}
          onInviteSuccess={vi.fn()}
        />,
      );
      expect(screen.queryByText('members.invite.button')).not.toBeInTheDocument();
    });
  });
});
