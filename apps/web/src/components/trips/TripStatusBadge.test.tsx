import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { TripStatus } from '@chamuco/shared-types';

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

import { TripStatusBadge } from './TripStatusBadge';
import { STATUS_CLASSES, STATUS_I18N_KEYS } from './trip-status';

describe('TripStatusBadge', () => {
  describe('i18n keys', () => {
    it('renders DRAFT i18n key', () => {
      render(<TripStatusBadge status={TripStatus.DRAFT} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent(
        STATUS_I18N_KEYS[TripStatus.DRAFT],
      );
    });

    it('renders OPEN i18n key', () => {
      render(<TripStatusBadge status={TripStatus.OPEN} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent(
        STATUS_I18N_KEYS[TripStatus.OPEN],
      );
    });

    it('renders CONFIRMED i18n key', () => {
      render(<TripStatusBadge status={TripStatus.CONFIRMED} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent(
        STATUS_I18N_KEYS[TripStatus.CONFIRMED],
      );
    });

    it('renders IN_PROGRESS i18n key', () => {
      render(<TripStatusBadge status={TripStatus.IN_PROGRESS} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent(
        STATUS_I18N_KEYS[TripStatus.IN_PROGRESS],
      );
    });

    it('renders COMPLETED i18n key', () => {
      render(<TripStatusBadge status={TripStatus.COMPLETED} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent(
        STATUS_I18N_KEYS[TripStatus.COMPLETED],
      );
    });

    it('renders CANCELLED i18n key', () => {
      render(<TripStatusBadge status={TripStatus.CANCELLED} />);
      expect(screen.getByTestId('status-badge')).toHaveTextContent(
        STATUS_I18N_KEYS[TripStatus.CANCELLED],
      );
    });
  });

  describe('guide link', () => {
    it('renders info link to status guide by default', () => {
      render(<TripStatusBadge status={TripStatus.OPEN} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/trips/status-guide');
    });

    it('link carries aria-label from i18n key', () => {
      render(<TripStatusBadge status={TripStatus.OPEN} />);
      expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'statusGuide.infoButtonLabel');
    });

    it('hides guide link when hideGuideLink is true', () => {
      render(<TripStatusBadge status={TripStatus.OPEN} hideGuideLink />);
      expect(screen.queryByRole('link')).toBeNull();
    });
  });

  describe('CSS classes', () => {
    it('applies DRAFT color class', () => {
      render(<TripStatusBadge status={TripStatus.DRAFT} />);
      expect(screen.getByTestId('status-badge').className).toContain(
        STATUS_CLASSES[TripStatus.DRAFT].split(' ')[0],
      );
    });

    it('applies OPEN color class', () => {
      render(<TripStatusBadge status={TripStatus.OPEN} />);
      expect(screen.getByTestId('status-badge').className).toContain(
        STATUS_CLASSES[TripStatus.OPEN].split(' ')[0],
      );
    });

    it('applies CONFIRMED color class', () => {
      render(<TripStatusBadge status={TripStatus.CONFIRMED} />);
      expect(screen.getByTestId('status-badge').className).toContain(
        STATUS_CLASSES[TripStatus.CONFIRMED].split(' ')[0],
      );
    });

    it('applies IN_PROGRESS color class', () => {
      render(<TripStatusBadge status={TripStatus.IN_PROGRESS} />);
      expect(screen.getByTestId('status-badge').className).toContain(
        STATUS_CLASSES[TripStatus.IN_PROGRESS].split(' ')[0],
      );
    });

    it('applies COMPLETED color class', () => {
      render(<TripStatusBadge status={TripStatus.COMPLETED} />);
      expect(screen.getByTestId('status-badge').className).toContain(
        STATUS_CLASSES[TripStatus.COMPLETED].split(' ')[0],
      );
    });

    it('applies CANCELLED color class', () => {
      render(<TripStatusBadge status={TripStatus.CANCELLED} />);
      expect(screen.getByTestId('status-badge').className).toContain(
        STATUS_CLASSES[TripStatus.CANCELLED].split(' ')[0],
      );
    });
  });
});
