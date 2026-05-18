import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GroupSearchResult } from '@/types/group';
import { GroupVisibility } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockUseGroupSearch: vi.fn(),
  mockUseUser: vi.fn(),
  mockGroupDiscoveryCard: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

vi.mock('@/hooks/useGroupSearch', () => ({
  useGroupSearch: mocks.mockUseGroupSearch,
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: mocks.mockUseUser,
}));

vi.mock('@/components/groups/GroupDiscoveryCard', () => ({
  GroupDiscoveryCard: ({ group }: { group: GroupSearchResult }) => (
    <div data-testid="discovery-card">{group.name}</div>
  ),
}));

import ExploreGroupsPage from './page';

const makeGroup = (overrides: Partial<GroupSearchResult> = {}): GroupSearchResult => ({
  id: 'g1',
  name: 'Mountain Crew',
  description: null,
  coverUrl: 'https://example.com/cover.svg',
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  memberCount: 3,
  membershipStatus: 'none',
  ...overrides,
});

describe('ExploreGroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUseUser.mockReturnValue({ appUser: { id: 'current-user' }, isLoading: false });
    mocks.mockUseGroupSearch.mockReturnValue({ results: [], total: 0, isLoading: false });
  });

  it('renders search input', () => {
    render(<ExploreGroupsPage />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('shows empty state when query is blank', () => {
    render(<ExploreGroupsPage />);

    expect(screen.getByText('search.empty')).toBeInTheDocument();
  });

  it('shows loading state while fetching', async () => {
    mocks.mockUseGroupSearch.mockReturnValue({ results: [], total: 0, isLoading: true });

    const user = userEvent.setup();
    render(<ExploreGroupsPage />);
    await user.type(screen.getByRole('searchbox'), 'mountain');

    expect(screen.getByText('search.loading')).toBeInTheDocument();
  });

  it('shows no-results state when query has results count zero', async () => {
    // Simulate: query typed, not loading, no results
    mocks.mockUseGroupSearch.mockReturnValue({ results: [], total: 0, isLoading: false });

    const user = userEvent.setup();
    render(<ExploreGroupsPage />);
    await user.type(screen.getByRole('searchbox'), 'zzznomatch');

    expect(screen.getByText(/search\.noResults/)).toBeInTheDocument();
  });

  it('renders group cards when results are present', async () => {
    mocks.mockUseGroupSearch.mockReturnValue({
      results: [makeGroup(), makeGroup({ id: 'g2', name: 'Beach Crew' })],
      total: 2,
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<ExploreGroupsPage />);
    await user.type(screen.getByRole('searchbox'), 'crew');

    expect(screen.getAllByTestId('discovery-card')).toHaveLength(2);
    expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
    expect(screen.getByText('Beach Crew')).toBeInTheDocument();
  });

  it('shows result count when results are present', async () => {
    mocks.mockUseGroupSearch.mockReturnValue({
      results: [makeGroup()],
      total: 42,
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<ExploreGroupsPage />);
    await user.type(screen.getByRole('searchbox'), 'crew');

    expect(screen.getByText(/search\.resultCount/)).toBeInTheDocument();
  });
});
