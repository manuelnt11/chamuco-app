import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockRouterBack: vi.fn(),
  mockUsername: 'jsmith',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.mockRouterBack }),
  useParams: () => ({ username: mocks.mockUsername }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mocks.mockApiGet },
}));

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string) => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) {
        return Object.entries(opts).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, v), key);
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div role="status" aria-label="loading" />,
}));

vi.mock('@/components/public-profile', () => ({
  PublicProfileHeader: ({ displayName, username }: { displayName: string; username: string }) => (
    <div data-testid="public-profile-header">
      {displayName} @{username}
    </div>
  ),
  PublicProfileStats: ({ keyStats }: { keyStats: { tripsCompleted: number } }) => (
    <div data-testid="public-profile-stats">{keyStats.tripsCompleted} trips</div>
  ),
  PublicProfileAchievements: ({ achievements }: { achievements: string[] }) => (
    <div data-testid="public-profile-achievements">{achievements.length} achievements</div>
  ),
  PublicProfileRecognitions: ({ recognitions }: { recognitions: string[] }) => (
    <div data-testid="public-profile-recognitions">{recognitions.length} recognitions</div>
  ),
  PublicProfileDiscoveryMap: ({ countries }: { countries: string[] }) => (
    <div data-testid="public-profile-discovery-map">{countries.length} countries</div>
  ),
}));

import { ProfileVisibility } from '@chamuco/shared-types';

import PublicProfilePage from './page';

// --- fixtures ---

const publicProfileData = {
  username: 'jsmith',
  displayName: 'John Smith',
  avatarUrl: null,
  bio: 'Avid traveler.',
  profileVisibility: ProfileVisibility.PUBLIC,
  travelerScore: null,
  achievements: ['FIRST_TRIP'],
  recognitions: [],
  keyStats: {
    tripsCompleted: 12,
    countriesVisited: 8,
    citiesVisited: 25,
    kmTraveled: 45000,
    tripsAsOrganizer: 3,
  },
  discoveryMap: ['MX', 'US'],
};

const privateProfileData = {
  username: 'jsmith',
  displayName: 'John Smith',
  avatarUrl: null,
  bio: null,
  profileVisibility: ProfileVisibility.PRIVATE,
  travelerScore: null,
  achievements: null,
  recognitions: null,
  keyStats: null,
  discoveryMap: null,
};

function make404Error() {
  return Object.assign(new Error('Not found'), {
    response: { status: 404 },
  });
}

function makeGenericError() {
  return Object.assign(new Error('Server error'), {
    response: { status: 500 },
  });
}

// --- tests ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PublicProfilePage', () => {
  describe('loading state', () => {
    it('shows spinner while fetching', () => {
      mocks.mockApiGet.mockReturnValue(new Promise(() => undefined));
      render(<PublicProfilePage />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('404 state', () => {
    it('shows not-found empty state when API returns 404', async () => {
      mocks.mockApiGet.mockRejectedValue(make404Error());
      render(<PublicProfilePage />);
      await waitFor(() => expect(screen.getByText('publicProfile.notFound')).toBeInTheDocument());
    });

    it('includes the username in the not-found description', async () => {
      mocks.mockApiGet.mockRejectedValue(make404Error());
      render(<PublicProfilePage />);
      await waitFor(() =>
        expect(
          screen.getByText(
            'publicProfile.notFoundDescription'.replace('{{username}}', mocks.mockUsername),
          ),
        ).toBeInTheDocument(),
      );
    });

    it('renders back button on not-found state', async () => {
      mocks.mockApiGet.mockRejectedValue(make404Error());
      render(<PublicProfilePage />);
      await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    });

    it('calls router.back when back button is clicked on not-found', async () => {
      const user = userEvent.setup();
      mocks.mockApiGet.mockRejectedValue(make404Error());
      render(<PublicProfilePage />);
      await waitFor(() => screen.getByRole('button'));
      await user.click(screen.getByRole('button'));
      expect(mocks.mockRouterBack).toHaveBeenCalledOnce();
    });
  });

  describe('error state', () => {
    it('shows load error when API fails with non-404', async () => {
      mocks.mockApiGet.mockRejectedValue(makeGenericError());
      render(<PublicProfilePage />);
      await waitFor(() => expect(screen.getByText('publicProfile.loadError')).toBeInTheDocument());
    });

    it('retries on retry button click', async () => {
      const user = userEvent.setup();
      mocks.mockApiGet
        .mockRejectedValueOnce(makeGenericError())
        .mockResolvedValue({ data: publicProfileData });
      render(<PublicProfilePage />);
      await waitFor(() => screen.getByText('publicProfile.loadError'));
      await user.click(screen.getByText('publicProfile.retry'));
      await waitFor(() => expect(screen.getByTestId('public-profile-header')).toBeInTheDocument());
    });
  });

  describe('public profile', () => {
    beforeEach(() => {
      mocks.mockApiGet.mockResolvedValue({ data: publicProfileData });
    });

    it('renders the profile header', async () => {
      render(<PublicProfilePage />);
      await waitFor(() => expect(screen.getByTestId('public-profile-header')).toBeInTheDocument());
    });

    it('renders stats when keyStats is not null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() => expect(screen.getByTestId('public-profile-stats')).toBeInTheDocument());
    });

    it('renders achievements when achievements is not null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() =>
        expect(screen.getByTestId('public-profile-achievements')).toBeInTheDocument(),
      );
    });

    it('renders recognitions when recognitions is not null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() =>
        expect(screen.getByTestId('public-profile-recognitions')).toBeInTheDocument(),
      );
    });

    it('renders discovery map when discoveryMap is not null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() =>
        expect(screen.getByTestId('public-profile-discovery-map')).toBeInTheDocument(),
      );
    });

    it('does not show private-profile message when gamification is visible', async () => {
      render(<PublicProfilePage />);
      await waitFor(() => screen.getByTestId('public-profile-header'));
      expect(screen.queryByText('publicProfile.privateProfile')).not.toBeInTheDocument();
    });
  });

  describe('private profile', () => {
    beforeEach(() => {
      mocks.mockApiGet.mockResolvedValue({ data: privateProfileData });
    });

    it('renders the profile header', async () => {
      render(<PublicProfilePage />);
      await waitFor(() => expect(screen.getByTestId('public-profile-header')).toBeInTheDocument());
    });

    it('shows private-profile message when all gamification fields are null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() =>
        expect(screen.getByText('publicProfile.privateProfile')).toBeInTheDocument(),
      );
    });

    it('does not render stats when keyStats is null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() => screen.getByTestId('public-profile-header'));
      expect(screen.queryByTestId('public-profile-stats')).not.toBeInTheDocument();
    });

    it('does not render achievements when achievements is null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() => screen.getByTestId('public-profile-header'));
      expect(screen.queryByTestId('public-profile-achievements')).not.toBeInTheDocument();
    });

    it('does not render recognitions when recognitions is null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() => screen.getByTestId('public-profile-header'));
      expect(screen.queryByTestId('public-profile-recognitions')).not.toBeInTheDocument();
    });

    it('does not render discovery map when discoveryMap is null', async () => {
      render(<PublicProfilePage />);
      await waitFor(() => screen.getByTestId('public-profile-header'));
      expect(screen.queryByTestId('public-profile-discovery-map')).not.toBeInTheDocument();
    });
  });
});
