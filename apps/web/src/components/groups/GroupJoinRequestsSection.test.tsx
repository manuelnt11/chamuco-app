import { render, screen } from '@testing-library/react';
import { GroupVisibility } from '@chamuco/shared-types';
import type { MyGroupJoinRequest } from '@/types/group';

const mocks = vi.hoisted(() => ({
  mockGetMyGroupJoinRequests: vi.fn(),
  mockWithdrawGroupJoinRequest: vi.fn(),
  mockUsePendingJoinRequests: vi.fn(),
}));

vi.mock('@/services/groups.service', () => ({
  getMyGroupJoinRequests: mocks.mockGetMyGroupJoinRequests,
  withdrawGroupJoinRequest: mocks.mockWithdrawGroupJoinRequest,
}));

vi.mock('@/hooks/usePendingJoinRequests', () => ({
  usePendingJoinRequests: mocks.mockUsePendingJoinRequests,
}));

vi.mock('@/components/shared/PendingJoinRequestsSection', () => ({
  PendingJoinRequestsSection: (props: {
    titleText: string;
    items: MyGroupJoinRequest[];
    getId: (item: MyGroupJoinRequest) => string;
    getHref: (item: MyGroupJoinRequest) => string;
    cancelLabel: string;
    cancelErrorLabel: string;
    locale: string;
  }) => (
    <div data-testid="pending-section">
      <span data-testid="title">{props.titleText}</span>
      <span data-testid="cancel-label">{props.cancelLabel}</span>
      <span data-testid="cancel-error-label">{props.cancelErrorLabel}</span>
      <span data-testid="locale">{props.locale}</span>
      {props.items.map((item) => (
        <span key={props.getId(item)} data-testid="href">
          {props.getHref(item)}
        </span>
      ))}
    </div>
  ),
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
});

describe('GroupJoinRequestsSection', () => {
  it('renders nothing while loading', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [],
      isLoading: true,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    const { container } = render(<GroupJoinRequestsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there are no pending requests', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [],
      isLoading: false,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    const { container } = render(<GroupJoinRequestsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('wires usePendingJoinRequests to the group service functions', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [mockRequest],
      isLoading: false,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    render(<GroupJoinRequestsSection />);

    const options = mocks.mockUsePendingJoinRequests.mock.calls[0]![0];
    expect(options.fetchRequests).toBe(mocks.mockGetMyGroupJoinRequests);
    expect(options.cancelRequest).toBe(mocks.mockWithdrawGroupJoinRequest);
    expect(options.getId(mockRequest)).toBe('group-1');
  });

  it('passes the group i18n keys and app locale to the shared section', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [mockRequest],
      isLoading: false,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    render(<GroupJoinRequestsSection />);

    expect(screen.getByTestId('title')).toHaveTextContent('members.myRequests.titleWithCount');
    expect(screen.getByTestId('cancel-label')).toHaveTextContent('members.myRequests.cancel');
    expect(screen.getByTestId('cancel-error-label')).toHaveTextContent(
      'members.myRequests.cancelError',
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
  });

  it('builds a /groups/:id href for each request', () => {
    mocks.mockUsePendingJoinRequests.mockReturnValue({
      requests: [mockRequest],
      isLoading: false,
      cancellingIds: new Set(),
      errorIds: new Set(),
      cancel: vi.fn(),
    });

    render(<GroupJoinRequestsSection />);

    expect(screen.getByTestId('href')).toHaveTextContent('/groups/group-1');
  });
});
