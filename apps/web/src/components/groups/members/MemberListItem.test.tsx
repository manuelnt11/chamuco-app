import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupMemberStatus, GroupMemberTier, GroupRole } from '@chamuco/shared-types';
import type { GroupMember } from '@/types/group';

const mocks = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockPatch: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { delete: mocks.mockDelete, patch: mocks.mockPatch },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.mockToastError },
}));

import { MemberListItem } from './MemberListItem';

const GROUP_ID = 'group-1';
const CURRENT_USER_ID = 'current-user';

const baseMember: GroupMember = {
  userId: 'user-1',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: null,
  role: GroupRole.MEMBER,
  tier: GroupMemberTier.NEWCOMER,
  joinedAt: '2026-01-01T00:00:00.000Z',
};

function renderItem(
  overrides: Partial<GroupMember> = {},
  currentUserRole: GroupRole | null = GroupRole.OWNER,
  currentUserId: string | null = CURRENT_USER_ID,
  onActionSuccess = vi.fn(),
) {
  return render(
    <MemberListItem
      member={{ ...baseMember, ...overrides }}
      groupId={GROUP_ID}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      onActionSuccess={onActionSuccess}
    />,
  );
}

describe('MemberListItem', () => {
  describe('rendering', () => {
    it('renders display name', () => {
      renderItem();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders @username', () => {
      renderItem();
      expect(screen.getByText('@john_doe')).toBeInTheDocument();
    });

    it('renders role badge via t key', () => {
      renderItem();
      expect(screen.getByText(`members.role.${GroupRole.MEMBER}`)).toBeInTheDocument();
    });

    it('renders tier badge via t key', () => {
      renderItem();
      expect(screen.getByText(`members.tier.${GroupMemberTier.NEWCOMER}`)).toBeInTheDocument();
    });

    it('renders OWNER role badge', () => {
      renderItem({ role: GroupRole.OWNER });
      expect(screen.getByText(`members.role.${GroupRole.OWNER}`)).toBeInTheDocument();
    });

    it('renders VETERAN tier badge', () => {
      renderItem({ tier: GroupMemberTier.VETERAN });
      expect(screen.getByText(`members.tier.${GroupMemberTier.VETERAN}`)).toBeInTheDocument();
    });

    it('renders initials as avatar fallback when no avatarUrl', () => {
      renderItem();
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('type-check: GroupMemberStatus enum is accessible', () => {
      expect(GroupMemberStatus.ACTIVE).toBe('ACTIVE');
    });
  });

  describe('action button visibility', () => {
    it('hides actions when currentUserRole is MEMBER', () => {
      renderItem({}, GroupRole.MEMBER);
      expect(screen.queryByTitle('members.actions.remove')).not.toBeInTheDocument();
      expect(screen.queryByTitle('members.actions.promote')).not.toBeInTheDocument();
      expect(screen.queryByTitle('members.actions.demote')).not.toBeInTheDocument();
    });

    it('hides actions when currentUserRole is null', () => {
      renderItem({}, null);
      expect(screen.queryByTitle('members.actions.remove')).not.toBeInTheDocument();
    });

    it('hides actions on own row', () => {
      renderItem({}, GroupRole.OWNER, 'user-1');
      expect(screen.queryByTitle('members.actions.remove')).not.toBeInTheDocument();
    });

    it('shows promote and remove for OWNER viewing a MEMBER', () => {
      renderItem({ role: GroupRole.MEMBER });
      expect(screen.getByTitle('members.actions.promote')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'actions.delete' })).toBeInTheDocument();
    });

    it('shows demote and remove for OWNER viewing an ADMIN', () => {
      renderItem({ role: GroupRole.ADMIN });
      expect(screen.getByTitle('members.actions.demote')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'actions.delete' })).toBeInTheDocument();
    });

    it('does not show promote for ADMIN/OWNER targets', () => {
      renderItem({ role: GroupRole.ADMIN });
      expect(screen.queryByTitle('members.actions.promote')).not.toBeInTheDocument();

      renderItem({ role: GroupRole.OWNER, userId: 'other-owner' });
      expect(screen.queryByTitle('members.actions.promote')).not.toBeInTheDocument();
    });

    it('does not show demote for MEMBER target', () => {
      renderItem({ role: GroupRole.MEMBER });
      expect(screen.queryByTitle('members.actions.demote')).not.toBeInTheDocument();
    });

    it('ADMIN cannot remove or demote OWNER', () => {
      renderItem({ role: GroupRole.OWNER, userId: 'owner-id' }, GroupRole.ADMIN);
      expect(screen.queryByTitle('members.actions.remove')).not.toBeInTheDocument();
      expect(screen.queryByTitle('members.actions.demote')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    beforeEach(() => {
      mocks.mockDelete.mockResolvedValue(undefined);
      mocks.mockPatch.mockResolvedValue(undefined);
    });

    it('calls delete endpoint and onActionSuccess on remove confirm', async () => {
      const onActionSuccess = vi.fn();
      renderItem({ role: GroupRole.MEMBER }, GroupRole.OWNER, CURRENT_USER_ID, onActionSuccess);

      const deleteBtn = screen.getByRole('button', { name: 'actions.delete' });
      await userEvent.click(deleteBtn);
      const confirmBtn = screen.getByRole('button', { name: 'actions.deleteConfirm' });
      await userEvent.click(confirmBtn);

      expect(mocks.mockDelete).toHaveBeenCalledWith(
        `/v1/groups/${GROUP_ID}/members/${baseMember.userId}`,
      );
      expect(onActionSuccess).toHaveBeenCalled();
    });

    it('calls patch with ADMIN role and onActionSuccess on promote', async () => {
      const onActionSuccess = vi.fn();
      renderItem({ role: GroupRole.MEMBER }, GroupRole.OWNER, CURRENT_USER_ID, onActionSuccess);

      await userEvent.click(screen.getByTitle('members.actions.promote'));

      expect(mocks.mockPatch).toHaveBeenCalledWith(
        `/v1/groups/${GROUP_ID}/members/${baseMember.userId}/role`,
        { role: GroupRole.ADMIN },
      );
      expect(onActionSuccess).toHaveBeenCalled();
    });

    it('calls patch with MEMBER role and onActionSuccess on demote', async () => {
      const onActionSuccess = vi.fn();
      renderItem({ role: GroupRole.ADMIN }, GroupRole.OWNER, CURRENT_USER_ID, onActionSuccess);

      await userEvent.click(screen.getByTitle('members.actions.demote'));

      expect(mocks.mockPatch).toHaveBeenCalledWith(
        `/v1/groups/${GROUP_ID}/members/${baseMember.userId}/role`,
        { role: GroupRole.MEMBER },
      );
      expect(onActionSuccess).toHaveBeenCalled();
    });

    it('shows toast error when promote fails', async () => {
      mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
      renderItem({ role: GroupRole.MEMBER }, GroupRole.OWNER, CURRENT_USER_ID, vi.fn());

      await userEvent.click(screen.getByTitle('members.actions.promote'));

      expect(mocks.mockToastError).toHaveBeenCalledWith('members.actions.promoteError');
    });

    it('shows toast error when demote fails', async () => {
      mocks.mockPatch.mockRejectedValueOnce(new Error('fail'));
      renderItem({ role: GroupRole.ADMIN }, GroupRole.OWNER, CURRENT_USER_ID, vi.fn());

      await userEvent.click(screen.getByTitle('members.actions.demote'));

      expect(mocks.mockToastError).toHaveBeenCalledWith('members.actions.demoteError');
    });
  });
});
