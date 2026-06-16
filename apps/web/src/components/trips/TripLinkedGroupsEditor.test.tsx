import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockGetTripLinkedGroups: vi.fn(),
  mockAddTripGroup: vi.fn(),
  mockRemoveTripGroup: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/services/trips.service', () => ({
  getTripLinkedGroups: mocks.mockGetTripLinkedGroups,
  addTripGroup: mocks.mockAddTripGroup,
  removeTripGroup: mocks.mockRemoveTripGroup,
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.mockToastError },
}));

vi.mock('@/components/ui/group-autocomplete', () => ({
  GroupAutocomplete: ({
    onSelect,
    onChange,
  }: {
    onSelect: (g: { id: string; name: string; coverUrl: string }) => void;
    onChange: (v: string) => void;
  }) => (
    <button
      data-testid="group-autocomplete"
      onClick={() => {
        onSelect({ id: 'group-2', name: 'Beach Crew', coverUrl: 'https://cdn/emoji2.svg' });
        onChange('');
      }}
    >
      add-group
    </button>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.name) return `${key}:${String(opts.name)}`;
      return key;
    },
  }),
}));

vi.mock('@phosphor-icons/react', () => ({
  XIcon: () => <span>x</span>,
}));

import { TripLinkedGroupsEditor } from './TripLinkedGroupsEditor';

const existingGroup = { id: 'group-1', name: 'Mountain Crew', coverUrl: 'https://cdn/emoji.svg' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockGetTripLinkedGroups.mockResolvedValue([existingGroup]);
  mocks.mockAddTripGroup.mockResolvedValue({});
  mocks.mockRemoveTripGroup.mockResolvedValue(undefined);
});

describe('TripLinkedGroupsEditor', () => {
  it('loads and displays linked groups', async () => {
    render(<TripLinkedGroupsEditor tripId="trip-1" />);

    await waitFor(() => {
      expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
    });
  });

  it('removes a group on remove button click', async () => {
    const user = userEvent.setup();
    render(<TripLinkedGroupsEditor tripId="trip-1" />);

    await waitFor(() => screen.getByText('Mountain Crew'));

    await user.click(screen.getByRole('button', { name: /linkedGroupRemove/ }));

    await waitFor(() => {
      expect(mocks.mockRemoveTripGroup).toHaveBeenCalledWith('trip-1', 'group-1');
      expect(screen.queryByText('Mountain Crew')).not.toBeInTheDocument();
    });
  });

  it('adds a group via autocomplete', async () => {
    const user = userEvent.setup();
    render(<TripLinkedGroupsEditor tripId="trip-1" />);

    await waitFor(() => screen.getByText('Mountain Crew'));

    await user.click(screen.getByTestId('group-autocomplete'));

    await waitFor(() => {
      expect(mocks.mockAddTripGroup).toHaveBeenCalledWith('trip-1', { groupId: 'group-2' });
      expect(screen.getByText('Beach Crew')).toBeInTheDocument();
    });
  });

  it('shows error toast when remove fails', async () => {
    mocks.mockRemoveTripGroup.mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    render(<TripLinkedGroupsEditor tripId="trip-1" />);

    await waitFor(() => screen.getByText('Mountain Crew'));

    await user.click(screen.getByRole('button', { name: /linkedGroupRemove/ }));

    await waitFor(() => {
      expect(mocks.mockToastError).toHaveBeenCalledWith('settings.linkedGroupRemoveFailed');
    });
  });

  it('shows error toast when add fails', async () => {
    mocks.mockAddTripGroup.mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    render(<TripLinkedGroupsEditor tripId="trip-1" />);

    await waitFor(() => screen.getByText('Mountain Crew'));

    await user.click(screen.getByTestId('group-autocomplete'));

    await waitFor(() => {
      expect(mocks.mockToastError).toHaveBeenCalledWith('settings.linkedGroupAddFailed');
    });
  });

  it('does not add a group that is already linked', async () => {
    mocks.mockGetTripLinkedGroups.mockResolvedValue([
      { id: 'group-2', name: 'Beach Crew', coverUrl: 'https://cdn/emoji2.svg' },
    ]);
    const user = userEvent.setup();
    render(<TripLinkedGroupsEditor tripId="trip-1" />);

    await waitFor(() => screen.getByText('Beach Crew'));

    await user.click(screen.getByTestId('group-autocomplete'));

    await waitFor(() => {
      expect(mocks.mockAddTripGroup).not.toHaveBeenCalled();
    });
  });
});
