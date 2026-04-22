import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

import { PublicProfileStats } from './PublicProfileStats';

const baseStats = {
  tripsCompleted: 12,
  countriesVisited: 8,
  citiesVisited: 25,
  kmTraveled: 45000,
  tripsAsOrganizer: 3,
};

describe('PublicProfileStats', () => {
  it('renders section heading', () => {
    render(<PublicProfileStats keyStats={baseStats} />);
    expect(
      screen.getByRole('region', { name: /publicProfile.stats.heading/i }),
    ).toBeInTheDocument();
  });

  it('renders tripsCompleted value', () => {
    render(<PublicProfileStats keyStats={baseStats} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders countriesVisited value', () => {
    render(<PublicProfileStats keyStats={baseStats} />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders kmTraveled with locale formatting', () => {
    render(<PublicProfileStats keyStats={baseStats} />);
    expect(screen.getByText('45,000')).toBeInTheDocument();
  });

  it('renders tripsAsOrganizer value', () => {
    render(<PublicProfileStats keyStats={baseStats} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders all four stat labels', () => {
    render(<PublicProfileStats keyStats={baseStats} />);
    expect(screen.getByText('publicProfile.stats.tripsCompleted')).toBeInTheDocument();
    expect(screen.getByText('publicProfile.stats.countriesVisited')).toBeInTheDocument();
    expect(screen.getByText('publicProfile.stats.kmTraveled')).toBeInTheDocument();
    expect(screen.getByText('publicProfile.stats.tripsAsOrganizer')).toBeInTheDocument();
  });

  it('renders zero values correctly', () => {
    render(<PublicProfileStats keyStats={{ ...baseStats, tripsCompleted: 0 }} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
