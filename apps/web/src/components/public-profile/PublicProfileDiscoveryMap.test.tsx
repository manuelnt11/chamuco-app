import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

import { PublicProfileDiscoveryMap } from './PublicProfileDiscoveryMap';

describe('PublicProfileDiscoveryMap', () => {
  it('renders section heading', () => {
    render(<PublicProfileDiscoveryMap countries={[]} />);
    expect(
      screen.getByRole('region', { name: /publicProfile.discoveryMap.heading/i }),
    ).toBeInTheDocument();
  });

  it('renders placeholder text', () => {
    render(<PublicProfileDiscoveryMap countries={[]} />);
    expect(screen.getByText('publicProfile.discoveryMap.placeholder')).toBeInTheDocument();
  });

  it('renders country code badges when countries provided', () => {
    render(<PublicProfileDiscoveryMap countries={['MX', 'US', 'ES']} />);
    expect(screen.getByText('MX')).toBeInTheDocument();
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();
  });

  it('renders no country badges when countries is empty', () => {
    render(<PublicProfileDiscoveryMap countries={[]} />);
    expect(screen.queryByText('MX')).not.toBeInTheDocument();
  });
});
