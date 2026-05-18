import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupVisibility } from '@chamuco/shared-types';
import type { ReactNode } from 'react';
import type { GroupSearchResult } from '@/types/group';

const mocks = vi.hoisted(() => ({
  mockJoinRequestButton: vi.fn(),
  mockOnStatusChange: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/groups/members/JoinRequestButton', () => ({
  JoinRequestButton: ({
    hasPendingRequest,
    onSuccess,
  }: {
    hasPendingRequest: boolean;
    onSuccess: () => void;
  }) => <button onClick={onSuccess}>{hasPendingRequest ? 'withdraw' : 'join'}</button>,
}));

import { GroupDiscoveryCard } from './GroupDiscoveryCard';

const makeGroup = (overrides: Partial<GroupSearchResult> = {}): GroupSearchResult => ({
  id: 'g1',
  name: 'Mountain Crew',
  description: 'Hikers welcome',
  coverUrl: 'https://example.com/cover.svg',
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  memberCount: 5,
  membershipStatus: 'none',
  ...overrides,
});

describe('GroupDiscoveryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders group name and description', () => {
    render(
      <GroupDiscoveryCard
        group={makeGroup()}
        currentUserId="current-user"
        onStatusChange={mocks.mockOnStatusChange}
      />,
    );

    expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
    expect(screen.getByText('Hikers welcome')).toBeInTheDocument();
  });

  it('renders member count', () => {
    render(
      <GroupDiscoveryCard
        group={makeGroup({ memberCount: 7 })}
        currentUserId="current-user"
        onStatusChange={mocks.mockOnStatusChange}
      />,
    );

    expect(screen.getByText(/search\.memberCount/)).toBeInTheDocument();
  });

  it('renders join button when membershipStatus is none', () => {
    render(
      <GroupDiscoveryCard
        group={makeGroup({ membershipStatus: 'none' })}
        currentUserId="current-user"
        onStatusChange={mocks.mockOnStatusChange}
      />,
    );

    expect(screen.getByRole('button', { name: 'join' })).toBeInTheDocument();
  });

  it('renders withdraw button when membershipStatus is pending', () => {
    render(
      <GroupDiscoveryCard
        group={makeGroup({ membershipStatus: 'pending' })}
        currentUserId="current-user"
        onStatusChange={mocks.mockOnStatusChange}
      />,
    );

    expect(screen.getByRole('button', { name: 'withdraw' })).toBeInTheDocument();
  });

  it('renders view link when membershipStatus is active', () => {
    render(
      <GroupDiscoveryCard
        group={makeGroup({ membershipStatus: 'active' })}
        currentUserId="current-user"
        onStatusChange={mocks.mockOnStatusChange}
      />,
    );

    expect(screen.getByRole('link', { name: 'detail.view' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onStatusChange with pending when join is clicked from none', async () => {
    const user = userEvent.setup();
    render(
      <GroupDiscoveryCard
        group={makeGroup({ membershipStatus: 'none' })}
        currentUserId="current-user"
        onStatusChange={mocks.mockOnStatusChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'join' }));

    expect(mocks.mockOnStatusChange).toHaveBeenCalledWith('g1', 'pending');
  });

  it('calls onStatusChange with none when withdraw is clicked from pending', async () => {
    const user = userEvent.setup();
    render(
      <GroupDiscoveryCard
        group={makeGroup({ membershipStatus: 'pending' })}
        currentUserId="current-user"
        onStatusChange={mocks.mockOnStatusChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'withdraw' }));

    expect(mocks.mockOnStatusChange).toHaveBeenCalledWith('g1', 'none');
  });
});
