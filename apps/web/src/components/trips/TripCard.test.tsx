import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { TripRole, TripStatus, TripVisibility } from '@chamuco/shared-types';
import type { MyTripListItemResponse } from '@/services/trips.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { TripCard } from './TripCard';

const baseTrip: MyTripListItemResponse = {
  id: 'trip-1',
  name: 'Cancún 2026',
  description: null,
  status: TripStatus.OPEN,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 12,
  departureCountry: 'MX',
  departureCity: 'CIUDAD DE MEXICO',
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
  coverUrl: 'https://storage.googleapis.com/bucket/trip-covers/trip-1/cover.jpg',
  confirmedParticipantCount: 4,
  userRole: TripRole.ORGANIZER,
};

describe('TripCard', () => {
  describe('rendering', () => {
    it('renders trip name', () => {
      render(<TripCard trip={baseTrip} />);
      expect(screen.getByText('Cancún 2026')).toBeInTheDocument();
    });

    it('renders date range', () => {
      render(<TripCard trip={baseTrip} />);
      expect(screen.getByText('2026-12-01')).toBeInTheDocument();
      expect(screen.getByText('2026-12-08')).toBeInTheDocument();
    });

    it('renders departure city', () => {
      render(<TripCard trip={baseTrip} />);
      expect(screen.getByText('CIUDAD DE MEXICO')).toBeInTheDocument();
    });

    it('renders participant count and capacity', () => {
      render(<TripCard trip={baseTrip} />);
      expect(screen.getByText('4 card.capacityOf 12')).toBeInTheDocument();
    });

    it('renders cover image when coverUrl is set', () => {
      render(<TripCard trip={baseTrip} />);
      const cover = screen.getByTestId('trip-cover');
      const img = cover.querySelector('img');
      expect(img).toHaveAttribute(
        'src',
        'https://storage.googleapis.com/bucket/trip-covers/trip-1/cover.jpg',
      );
    });

    it('renders no img element when coverUrl is null', () => {
      render(<TripCard trip={{ ...baseTrip, coverUrl: null }} />);
      const cover = screen.getByTestId('trip-cover');
      expect(cover.querySelector('img')).not.toBeInTheDocument();
    });

    it('renders status badge with correct i18n key', () => {
      render(<TripCard trip={baseTrip} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent('status.open');
    });

    it('renders DRAFT status badge', () => {
      render(<TripCard trip={{ ...baseTrip, status: TripStatus.DRAFT }} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent('status.draft');
    });

    it('renders IN_PROGRESS status badge', () => {
      render(<TripCard trip={{ ...baseTrip, status: TripStatus.IN_PROGRESS }} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent('status.inProgress');
    });

    it('renders COMPLETED status badge', () => {
      render(<TripCard trip={{ ...baseTrip, status: TripStatus.COMPLETED }} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent('status.completed');
    });

    it('renders CANCELLED status badge', () => {
      render(<TripCard trip={{ ...baseTrip, status: TripStatus.CANCELLED }} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent('status.cancelled');
    });

    it('renders organizer role chip', () => {
      render(<TripCard trip={baseTrip} />);
      expect(screen.getByText('role.organizer')).toBeInTheDocument();
    });

    it('renders participant role chip', () => {
      render(<TripCard trip={{ ...baseTrip, userRole: TripRole.PARTICIPANT }} />);
      expect(screen.getByText('role.participant')).toBeInTheDocument();
    });

    it('renders co-organizer role chip', () => {
      render(<TripCard trip={{ ...baseTrip, userRole: TripRole.CO_ORGANIZER }} />);
      expect(screen.getByText('role.coOrganizer')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('links to the trip detail page', () => {
      render(<TripCard trip={baseTrip} />);
      const links = screen.getAllByRole('link');
      const tripLink = links.find((el) => el.getAttribute('href') === '/trips/trip-1');
      expect(tripLink).toBeDefined();
    });
  });
});
