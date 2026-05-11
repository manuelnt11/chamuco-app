import { render, screen } from '@testing-library/react';
import { GroupMemberStatus, GroupMemberTier, GroupRole } from '@chamuco/shared-types';
import type { GroupMember } from '@/types/group';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { MemberListItem } from './MemberListItem';

const baseMember: GroupMember = {
  userId: 'user-1',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: null,
  role: GroupRole.MEMBER,
  tier: GroupMemberTier.NEWCOMER,
  joinedAt: '2026-01-01T00:00:00.000Z',
};

describe('MemberListItem', () => {
  it('renders display name', () => {
    render(<MemberListItem member={baseMember} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders @username', () => {
    render(<MemberListItem member={baseMember} />);
    expect(screen.getByText('@john_doe')).toBeInTheDocument();
  });

  it('renders role badge via t key', () => {
    render(<MemberListItem member={baseMember} />);
    expect(screen.getByText(`members.role.${GroupRole.MEMBER}`)).toBeInTheDocument();
  });

  it('renders tier badge via t key', () => {
    render(<MemberListItem member={baseMember} />);
    expect(screen.getByText(`members.tier.${GroupMemberTier.NEWCOMER}`)).toBeInTheDocument();
  });

  it('renders OWNER role badge', () => {
    render(<MemberListItem member={{ ...baseMember, role: GroupRole.OWNER }} />);
    expect(screen.getByText(`members.role.${GroupRole.OWNER}`)).toBeInTheDocument();
  });

  it('renders VETERAN tier badge', () => {
    render(<MemberListItem member={{ ...baseMember, tier: GroupMemberTier.VETERAN }} />);
    expect(screen.getByText(`members.tier.${GroupMemberTier.VETERAN}`)).toBeInTheDocument();
  });

  it('renders initials as avatar fallback when no avatarUrl', () => {
    render(<MemberListItem member={baseMember} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  // GroupMemberStatus is imported but only used at the type level in GroupMember interface
  it('type-check: GroupMemberStatus enum is accessible', () => {
    expect(GroupMemberStatus.ACTIVE).toBe('ACTIVE');
  });
});
