import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TripRole, TripParticipantStatus, TripTaskScope } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiPatch: vi.fn(),
  mockApiDelete: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: 'trip-id' }),
  };
});

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mocks.mockApiGet,
    post: mocks.mockApiPost,
    patch: mocks.mockApiPatch,
    delete: mocks.mockApiDelete,
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

vi.mock('@/components/ui/trip-task-item', () => ({
  TripTaskItem: ({
    task,
    onToggle,
    onDelete,
  }: {
    task: { id: string; title: string; completed: boolean };
    onToggle: (completed: boolean) => Promise<void>;
    onDelete?: () => Promise<void>;
  }) => (
    <li>
      <span>{task.title}</span>
      <button
        type="button"
        onClick={() => void onToggle(!task.completed)}
        data-testid={`toggle-${task.id}`}
      >
        toggle
      </button>
      {onDelete && (
        <button type="button" onClick={() => void onDelete()} data-testid={`delete-${task.id}`}>
          delete
        </button>
      )}
    </li>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) {
        const interpolated = Object.entries(opts).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, v),
          key,
        );
        return interpolated === key ? [key, ...Object.values(opts)].join(' ') : interpolated;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

import TripTasksPage from './page';

const mockTrip = {
  id: 'trip-id',
  name: 'Cancún 2026',
  status: 'OPEN',
  visibility: 'PUBLIC',
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CDMX',
  landingCountry: 'MX',
  landingCity: 'Cancun',
  defaultTimezone: 'America/Cancun',
  defaultCurrency: 'MXN',
  requiresConfirmation: false,
  createdBy: 'user-id',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const sharedTask = {
  id: 'shared-1',
  tripId: 'trip-id',
  scope: TripTaskScope.SHARED,
  title: 'Book the group van',
  completed: false,
  ownerId: null,
  createdBy: 'organizer-id',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const personalTask = {
  id: 'personal-1',
  tripId: 'trip-id',
  scope: TripTaskScope.PERSONAL,
  title: 'Pack sunscreen',
  completed: false,
  ownerId: 'user-id',
  createdBy: 'user-id',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const organizerParticipation = {
  status: TripParticipantStatus.CONFIRMED,
  role: TripRole.ORGANIZER,
  isTraveler: true,
};
const participantParticipation = {
  status: TripParticipantStatus.CONFIRMED,
  role: TripRole.PARTICIPANT,
  isTraveler: true,
};

function setupDefaultMocks(
  overrides: {
    participation?: typeof organizerParticipation | null;
    tasks?: (typeof sharedTask)[];
  } = {},
) {
  const { participation = organizerParticipation, tasks = [sharedTask, personalTask] } = overrides;

  mocks.mockUseAuth.mockReturnValue({ isLoading: false });
  mocks.mockApiDelete.mockResolvedValue({});
  mocks.mockApiPatch.mockResolvedValue({ data: { ...sharedTask, completed: true } });
  mocks.mockApiPost.mockResolvedValue({ data: personalTask });

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/participants/me'))
      return participation
        ? Promise.resolve({ data: participation })
        : Promise.reject(new Error('Not participant'));
    if (url.includes('/tasks')) return Promise.resolve({ data: tasks });
    return Promise.resolve({ data: mockTrip });
  });
}

describe('TripTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shared and personal tasks in separate sections', async () => {
    setupDefaultMocks();
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(sharedTask.title)).toBeInTheDocument();
      expect(screen.getByText(personalTask.title)).toBeInTheDocument();
    });
  });

  it('shows empty states when there are no tasks', async () => {
    setupDefaultMocks({ tasks: [] });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('tasks.sharedEmpty')).toBeInTheDocument();
      expect(screen.getByText('tasks.personalEmpty')).toBeInTheDocument();
    });
  });

  it('shows scope toggle for organizer, defaulting to personal', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const toggle = screen.getByTitle('tasks.scope.PERSONAL');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('hides scope toggle for regular participant', async () => {
    setupDefaultMocks({ participation: participantParticipation });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText(sharedTask.title)).toBeInTheDocument();
    });
    expect(screen.queryByTitle('tasks.scope.PERSONAL')).not.toBeInTheDocument();
    expect(screen.queryByTitle('tasks.scope.SHARED')).not.toBeInTheDocument();
  });

  it('toggles the scope button to shared when clicked, then back to personal', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByTitle('tasks.scope.PERSONAL'));
    fireEvent.click(screen.getByTitle('tasks.scope.PERSONAL'));

    const toggle = screen.getByTitle('tasks.scope.SHARED');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle);
    expect(screen.getByTitle('tasks.scope.PERSONAL')).toHaveAttribute('aria-pressed', 'false');
  });

  it('creates a shared task after toggling scope to group', async () => {
    setupDefaultMocks({ participation: organizerParticipation, tasks: [] });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByTitle('tasks.scope.PERSONAL'));
    fireEvent.click(screen.getByTitle('tasks.scope.PERSONAL'));
    fireEvent.change(screen.getByPlaceholderText('tasks.addPlaceholder'), {
      target: { value: 'Book the group van' },
    });
    fireEvent.click(screen.getByTitle('tasks.addButton'));

    await waitFor(() => {
      expect(mocks.mockApiPost).toHaveBeenCalledWith('/v1/trips/trip-id/tasks', {
        scope: TripTaskScope.SHARED,
        title: 'Book the group van',
      });
    });
  });

  it('creates a personal task and appends it to the list', async () => {
    setupDefaultMocks({ participation: participantParticipation, tasks: [] });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByPlaceholderText('tasks.addPlaceholder'));
    fireEvent.change(screen.getByPlaceholderText('tasks.addPlaceholder'), {
      target: { value: 'Pack sunscreen' },
    });
    fireEvent.click(screen.getByTitle('tasks.addButton'));

    await waitFor(() => {
      expect(mocks.mockApiPost).toHaveBeenCalledWith('/v1/trips/trip-id/tasks', {
        scope: TripTaskScope.PERSONAL,
        title: 'Pack sunscreen',
      });
      expect(screen.getByText('Pack sunscreen')).toBeInTheDocument();
    });
  });

  it('toggles a task completion', async () => {
    setupDefaultMocks();
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByTestId(`toggle-${sharedTask.id}`));
    fireEvent.click(screen.getByTestId(`toggle-${sharedTask.id}`));

    await waitFor(() => {
      expect(mocks.mockApiPatch).toHaveBeenCalledWith(
        `/v1/trips/trip-id/tasks/${sharedTask.id}/completion`,
        { completed: true },
      );
    });
  });

  it('shows delete for a shared task only when organizer', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId(`delete-${sharedTask.id}`)).toBeInTheDocument();
    });
  });

  it('hides delete for a shared task when a regular participant', async () => {
    setupDefaultMocks({ participation: participantParticipation });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByText(sharedTask.title));
    expect(screen.queryByTestId(`delete-${sharedTask.id}`)).not.toBeInTheDocument();
  });

  it('always shows delete for a personal task', async () => {
    setupDefaultMocks({ participation: participantParticipation });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId(`delete-${personalTask.id}`)).toBeInTheDocument();
    });
  });

  it('removes a task from the list after successful delete', async () => {
    setupDefaultMocks({ participation: organizerParticipation });
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => screen.getByTestId(`delete-${personalTask.id}`));
    fireEvent.click(screen.getByTestId(`delete-${personalTask.id}`));

    await waitFor(() => {
      expect(mocks.mockApiDelete).toHaveBeenCalledWith(
        `/v1/trips/trip-id/tasks/${personalTask.id}`,
      );
      expect(screen.queryByText(personalTask.title)).not.toBeInTheDocument();
    });
  });

  it('back link points to trip detail page', async () => {
    setupDefaultMocks();
    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Cancún 2026/ });
      expect(link).toHaveAttribute('href', '/trips/trip-id');
    });
  });

  it('shows error message when trip fails to load', async () => {
    mocks.mockUseAuth.mockReturnValue({ isLoading: false });
    mocks.mockApiGet.mockRejectedValue(new Error('Network error'));

    render(<TripTasksPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('tasks.loadError')).toBeInTheDocument();
    });
  });
});
