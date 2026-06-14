import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripStatus, TripVisibility } from '@chamuco/shared-types';
import type { TripResponse } from '@/services/trips.types';

const mocks = vi.hoisted(() => ({
  transitionTripStatus: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) {
        return Object.entries(opts).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, v), key);
      }
      return key;
    },
  }),
}));

vi.mock('@/services/trips.service', () => ({
  transitionTripStatus: mocks.transitionTripStatus,
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.toastError },
}));

import { TripStatusTransition } from './TripStatusTransition';

const baseTripResponse: TripResponse = {
  id: 'trip-1',
  name: 'Test Trip',
  description: null,
  status: TripStatus.OPEN,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CDMX',
  landingCountry: 'MX',
  landingCity: 'CANCUN',
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

describe('TripStatusTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('button rendering by status', () => {
    it('renders OPEN and CANCELLED buttons for DRAFT', () => {
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.DRAFT}
          onTransitioned={vi.fn()}
        />,
      );
      expect(screen.getByTestId('transition-btn-OPEN')).toBeInTheDocument();
      expect(screen.getByTestId('transition-btn-CANCELLED')).toBeInTheDocument();
    });

    it('renders CONFIRMED and CANCELLED buttons for OPEN', () => {
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={vi.fn()}
        />,
      );
      expect(screen.getByTestId('transition-btn-CONFIRMED')).toBeInTheDocument();
      expect(screen.getByTestId('transition-btn-CANCELLED')).toBeInTheDocument();
    });

    it('renders IN_PROGRESS and CANCELLED buttons for CONFIRMED', () => {
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.CONFIRMED}
          onTransitioned={vi.fn()}
        />,
      );
      expect(screen.getByTestId('transition-btn-IN_PROGRESS')).toBeInTheDocument();
      expect(screen.getByTestId('transition-btn-CANCELLED')).toBeInTheDocument();
    });

    it('renders only COMPLETED button for IN_PROGRESS', () => {
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.IN_PROGRESS}
          onTransitioned={vi.fn()}
        />,
      );
      expect(screen.getByTestId('transition-btn-COMPLETED')).toBeInTheDocument();
      expect(screen.queryByTestId('transition-btn-CANCELLED')).not.toBeInTheDocument();
    });

    it('renders nothing for COMPLETED (terminal)', () => {
      const { container } = render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.COMPLETED}
          onTransitioned={vi.fn()}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing for CANCELLED (terminal)', () => {
      const { container } = render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.CANCELLED}
          onTransitioned={vi.fn()}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('confirmation dialog', () => {
    it('opens dialog when transition button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={vi.fn()}
        />,
      );
      await user.click(screen.getByTestId('transition-btn-CONFIRMED'));
      expect(screen.getByText('transitions.dialogTitle')).toBeInTheDocument();
    });

    it('shows cancel warning for CANCELLED target', async () => {
      const user = userEvent.setup();
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={vi.fn()}
        />,
      );
      await user.click(screen.getByTestId('transition-btn-CANCELLED'));
      expect(screen.getByText('transitions.cancelWarning')).toBeInTheDocument();
    });

    it('does not show cancel warning for non-CANCELLED target', async () => {
      const user = userEvent.setup();
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={vi.fn()}
        />,
      );
      await user.click(screen.getByTestId('transition-btn-CONFIRMED'));
      expect(screen.queryByText('transitions.cancelWarning')).not.toBeInTheDocument();
    });

    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={vi.fn()}
        />,
      );
      await user.click(screen.getByTestId('transition-btn-CONFIRMED'));
      expect(screen.getByText('transitions.dialogTitle')).toBeInTheDocument();
      await user.click(screen.getByText('transitions.cancelButton'));
      expect(screen.queryByText('transitions.dialogTitle')).not.toBeInTheDocument();
    });

    it('does not call API when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={vi.fn()}
        />,
      );
      await user.click(screen.getByTestId('transition-btn-CONFIRMED'));
      await user.click(screen.getByText('transitions.cancelButton'));
      expect(mocks.transitionTripStatus).not.toHaveBeenCalled();
    });
  });

  describe('API interaction', () => {
    it('calls transitionTripStatus with correct args on confirm', async () => {
      const user = userEvent.setup();
      const updatedTrip = { ...baseTripResponse, status: TripStatus.CONFIRMED };
      mocks.transitionTripStatus.mockResolvedValueOnce(updatedTrip);

      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={vi.fn()}
        />,
      );

      await user.click(screen.getByTestId('transition-btn-CONFIRMED'));
      await user.click(screen.getByTestId('transition-confirm-btn'));

      await waitFor(() => {
        expect(mocks.transitionTripStatus).toHaveBeenCalledWith('trip-1', {
          status: TripStatus.CONFIRMED,
        });
      });
    });

    it('calls onTransitioned with updated trip on success', async () => {
      const user = userEvent.setup();
      const updatedTrip = { ...baseTripResponse, status: TripStatus.CONFIRMED };
      mocks.transitionTripStatus.mockResolvedValueOnce(updatedTrip);
      const onTransitioned = vi.fn();

      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={onTransitioned}
        />,
      );

      await user.click(screen.getByTestId('transition-btn-CONFIRMED'));
      await user.click(screen.getByTestId('transition-confirm-btn'));

      await waitFor(() => {
        expect(onTransitioned).toHaveBeenCalledWith(updatedTrip);
      });
    });

    it('shows error toast and does not call onTransitioned on failure', async () => {
      const user = userEvent.setup();
      mocks.transitionTripStatus.mockRejectedValueOnce(new Error('API error'));
      const onTransitioned = vi.fn();

      render(
        <TripStatusTransition
          tripId="trip-1"
          currentStatus={TripStatus.OPEN}
          onTransitioned={onTransitioned}
        />,
      );

      await user.click(screen.getByTestId('transition-btn-CONFIRMED'));
      await user.click(screen.getByTestId('transition-confirm-btn'));

      await waitFor(() => {
        expect(mocks.toastError).toHaveBeenCalledWith('transitions.error');
      });
      expect(onTransitioned).not.toHaveBeenCalled();
    });
  });
});
