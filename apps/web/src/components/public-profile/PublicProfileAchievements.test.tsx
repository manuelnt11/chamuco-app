import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

import { PublicProfileAchievements } from './PublicProfileAchievements';

describe('PublicProfileAchievements', () => {
  it('renders section heading', () => {
    render(<PublicProfileAchievements achievements={[]} />);
    expect(
      screen.getByRole('region', { name: /publicProfile.achievements.heading/i }),
    ).toBeInTheDocument();
  });

  it('shows empty state when no achievements', () => {
    render(<PublicProfileAchievements achievements={[]} />);
    expect(screen.getByText('publicProfile.achievements.empty')).toBeInTheDocument();
  });

  it('renders a badge for each achievement', () => {
    render(<PublicProfileAchievements achievements={['FIRST_TRIP', 'EXPLORER_5_COUNTRIES']} />);
    expect(screen.getByText('First Trip')).toBeInTheDocument();
    expect(screen.getByText('Explorer 5 Countries')).toBeInTheDocument();
  });

  it('humanizes underscore-separated achievement IDs', () => {
    render(<PublicProfileAchievements achievements={['KM_1000']} />);
    expect(screen.getByText('Km 1000')).toBeInTheDocument();
  });

  it('does not show empty state when there are achievements', () => {
    render(<PublicProfileAchievements achievements={['FIRST_TRIP']} />);
    expect(screen.queryByText('publicProfile.achievements.empty')).not.toBeInTheDocument();
  });
});
