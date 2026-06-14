import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { type ReactNode } from 'react';
import { TripRole, TripStatus, TripVisibility } from '@chamuco/shared-types';
import type { TripResponse } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPatch: vi.fn(),
  mockUseAuth: vi.fn(),
  mockRouterReplace: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: 'trip-id' }),
  };
});

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.mockRouterReplace,
  }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mocks.mockApiGet,
    patch: mocks.mockApiPatch,
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

vi.mock('@/components/trips/TripCoverEditor', () => ({
  TripCoverEditor: ({ trip }: { trip: { id: string; coverUrl: string | null } }) => (
    <div data-testid="trip-cover-editor" data-trip-id={trip.id} />
  ),
}));

vi.mock('@/components/trips/TripForm', () => ({
  TripForm: ({
    initialValues,
    onSuccess,
  }: {
    mode: string;
    tripId: string;
    initialValues: { name: string };
    onSuccess: (trip: TripResponse) => void;
  }) => (
    <div>
      <span data-testid="form-name">{initialValues.name}</span>
      <button type="button" onClick={() => onSuccess({ id: 'trip-id' } as TripResponse)}>
        save-form
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: mocks.mockToastSuccess,
    error: mocks.mockToastError,
  },
}));

vi.mock('@phosphor-icons/react', () => ({
  ArrowLeftIcon: () => null,
  XIcon: () => null,
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

import TripSettingsPage from './page';

const mockTrip: TripResponse = {
  id: 'trip-id',
  name: 'Cancún 2026',
  description: 'Beach trip.',
  status: TripStatus.OPEN,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-07-01',
  endDate: '2026-07-10',
  participantCapacity: 12,
  departureCountry: 'MX',
  departureCity: 'Mexico City',
  landingCountry: 'MX',
  landingCity: 'Mexico City',
  defaultTimezone: null,
  defaultCurrency: null,
  itineraryNotes: null,
  agencyId: null,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  requiresConfirmation: false,
  feedbackOpenUntil: null,
  coverUrl: null,
};

function setupMocks({
  role = TripRole.ORGANIZER,
  tripStatus = TripStatus.OPEN,
}: {
  role?: TripRole | null;
  tripStatus?: TripStatus;
} = {}) {
  mocks.mockUseAuth.mockReturnValue({ isLoading: false });

  mocks.mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/participants/me')) {
      if (role === null) return Promise.reject(new Error('Not a participant'));
      return Promise.resolve({
        data: {
          userId: 'user-1',
          username: 'user1',
          displayName: 'User 1',
          avatarUrl: null,
          role,
          isTraveler: true,
          confirmedAt: null,
        },
      });
    }
    return Promise.resolve({ data: { ...mockTrip, status: tripStatus } });
  });
}

describe('TripSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edit form pre-filled with trip data after load', async () => {
    setupMocks();
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('form-name')).toHaveTextContent('Cancún 2026');
    });
  });

  it('renders settings page heading', async () => {
    setupMocks();
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByText('settings.title')).toBeInTheDocument();
    });
  });

  it('shows success toast and stays on page after successful edit', async () => {
    setupMocks();
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('form-name')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('save-form'));

    await waitFor(() => {
      expect(mocks.mockToastSuccess).toHaveBeenCalledWith('settings.editSuccess');
      expect(mocks.mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  it('redirects PARTICIPANT to trip detail', async () => {
    setupMocks({ role: TripRole.PARTICIPANT });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/trips/trip-id');
    });
  });

  it('redirects non-participant to trip detail', async () => {
    setupMocks({ role: null });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/trips/trip-id');
    });
  });

  it('allows CO_ORGANIZER to access', async () => {
    setupMocks({ role: TripRole.CO_ORGANIZER });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('form-name')).toBeInTheDocument();
      expect(mocks.mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  it('shows danger zone for OPEN trip', async () => {
    setupMocks({ tripStatus: TripStatus.OPEN });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-btn')).toBeInTheDocument();
    });
  });

  it('shows danger zone for DRAFT trip', async () => {
    setupMocks({ tripStatus: TripStatus.DRAFT });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-btn')).toBeInTheDocument();
    });
  });

  it('shows danger zone for CONFIRMED trip', async () => {
    setupMocks({ tripStatus: TripStatus.CONFIRMED });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-btn')).toBeInTheDocument();
    });
  });

  it('hides danger zone for IN_PROGRESS trip', async () => {
    setupMocks({ tripStatus: TripStatus.IN_PROGRESS });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.queryByTestId('cancel-trip-btn')).not.toBeInTheDocument();
    });
  });

  it('hides danger zone for CANCELLED trip', async () => {
    setupMocks({ tripStatus: TripStatus.CANCELLED });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.queryByTestId('cancel-trip-btn')).not.toBeInTheDocument();
    });
  });

  it('hides danger zone for COMPLETED trip', async () => {
    setupMocks({ tripStatus: TripStatus.COMPLETED });
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.queryByTestId('cancel-trip-btn')).not.toBeInTheDocument();
    });
  });

  it('opens cancel dialog when cancel button clicked', async () => {
    setupMocks();
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-trip-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-confirm-btn')).toBeInTheDocument();
    });
  });

  it('calls transitionTripStatus with CANCELLED on confirm', async () => {
    mocks.mockApiPatch.mockResolvedValue({ data: { ...mockTrip, status: TripStatus.CANCELLED } });
    setupMocks();
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-trip-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-confirm-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-trip-confirm-btn'));

    await waitFor(() => {
      expect(mocks.mockApiPatch).toHaveBeenCalledWith('/v1/trips/trip-id/status', {
        status: TripStatus.CANCELLED,
      });
      expect(mocks.mockToastSuccess).toHaveBeenCalledWith('settings.cancelSuccess');
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/trips/trip-id');
    });
  });

  it('shows error toast when cancel fails', async () => {
    mocks.mockApiPatch.mockRejectedValue(new Error('Server error'));
    setupMocks();
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-trip-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-confirm-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-trip-confirm-btn'));

    await waitFor(() => {
      expect(mocks.mockToastError).toHaveBeenCalledWith('settings.cancelFailed');
    });
  });

  it('cancel dialog closes when go-back button clicked', async () => {
    setupMocks();
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-trip-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cancel-trip-confirm-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('transitions.cancelButton'));

    await waitFor(() => {
      expect(screen.queryByTestId('cancel-trip-confirm-btn')).not.toBeInTheDocument();
    });
  });

  it('redirects to trip detail when fetch fails', async () => {
    mocks.mockUseAuth.mockReturnValue({ isLoading: false });
    mocks.mockApiGet.mockRejectedValue(new Error('Network error'));
    render(<TripSettingsPage params={Promise.resolve({ id: 'trip-id' })} />);

    await waitFor(() => {
      expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/trips/trip-id');
    });
  });
});
