import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

import { PublicProfileRecognitions } from './PublicProfileRecognitions';

describe('PublicProfileRecognitions', () => {
  it('renders section heading', () => {
    render(<PublicProfileRecognitions recognitions={[]} />);
    expect(
      screen.getByRole('region', { name: /publicProfile.recognitions.heading/i }),
    ).toBeInTheDocument();
  });

  it('shows empty state when no recognitions', () => {
    render(<PublicProfileRecognitions recognitions={[]} />);
    expect(screen.getByText('publicProfile.recognitions.empty')).toBeInTheDocument();
  });

  it('renders a badge for each recognition', () => {
    render(<PublicProfileRecognitions recognitions={['TRIP_COMPLETION', 'GROUP_ANNUAL']} />);
    expect(screen.getByText('Trip Completion')).toBeInTheDocument();
    expect(screen.getByText('Group Annual')).toBeInTheDocument();
  });

  it('does not show empty state when there are recognitions', () => {
    render(<PublicProfileRecognitions recognitions={['TRIP_COMPLETION']} />);
    expect(screen.queryByText('publicProfile.recognitions.empty')).not.toBeInTheDocument();
  });

  it('handles duplicate recognition IDs with index key', () => {
    render(<PublicProfileRecognitions recognitions={['TRIP_COMPLETION', 'TRIP_COMPLETION']} />);
    expect(screen.getAllByText('Trip Completion')).toHaveLength(2);
  });
});
