import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({ appUser: null, isLoading: false, refresh: mocks.mockRefresh }),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: mocks.mockToastSuccess,
    error: mocks.mockToastError,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ fallback }: { fallback: string }) => <div data-testid="avatar">{fallback}</div>,
}));

vi.mock('@/lib/timezones', () => ({
  TIMEZONES: ['UTC', 'America/Bogota', 'America/New_York', 'Europe/Madrid'],
  COUNTRY_TIMEZONE: { CO: 'America/Bogota', US: 'America/New_York', ES: 'Europe/Madrid' },
  formatTimezoneLabel: (tz: string) => tz,
}));

vi.mock('@/components/ui/timezone-combobox', () => ({
  TimezoneCombobox: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (tz: string) => void;
    disabled?: boolean;
  }) => (
    <select
      aria-label="basicInfo.timezone"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {['UTC', 'America/Bogota', 'America/New_York', 'Europe/Madrid'].map((tz) => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </select>
  ),
}));

import { ProfileVisibility } from '@chamuco/shared-types';

import type { AppUser } from '@/store/user';
import { BasicInfoSection } from './BasicInfoSection';
import type { BasicInfoProfile } from './BasicInfoSection';

const baseUser: AppUser = {
  username: 'janedoe',
  displayName: 'Jane Doe',
  avatarUrl: null,
  timezone: 'America/Bogota',
  profileVisibility: ProfileVisibility.PRIVATE,
};

const baseProfile: BasicInfoProfile = { bio: 'Hello world', homeCountry: 'CO' };

function setup(userOverride?: Partial<AppUser>, profileOverride?: Partial<BasicInfoProfile>) {
  const onRefresh = vi.fn();
  const user = userEvent.setup();
  render(
    <BasicInfoSection
      user={{ ...baseUser, ...userOverride }}
      userProfile={{ ...baseProfile, ...profileOverride }}
      onRefresh={onRefresh}
    />,
  );
  return { user, onRefresh };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPatch.mockResolvedValue({});
});

describe('BasicInfoSection', () => {
  describe('rendering', () => {
    it('renders the section heading', () => {
      setup();
      expect(screen.getByText('basicInfo.heading')).toBeInTheDocument();
    });

    it('renders the avatar with initials fallback', () => {
      setup();
      expect(screen.getByTestId('avatar')).toHaveTextContent('JD');
    });

    it('renders the display name field with current value', () => {
      setup();
      expect(screen.getByLabelText('basicInfo.displayName')).toHaveValue('Jane Doe');
    });

    it('renders the username field as read-only with @ prefix', () => {
      setup();
      const usernameField = screen.getByLabelText('basicInfo.username');
      expect(usernameField).toHaveValue('@janedoe');
      expect(usernameField).toBeDisabled();
    });

    it('renders the bio field with current value', () => {
      setup();
      expect(screen.getByLabelText('basicInfo.bio')).toHaveValue('Hello world');
    });

    it('renders empty bio when bio is null', () => {
      setup(undefined, { bio: null });
      expect(screen.getByLabelText('basicInfo.bio')).toHaveValue('');
    });

    it('renders the timezone combobox with current timezone value', () => {
      setup();
      expect(screen.getByRole('combobox', { name: 'basicInfo.timezone' })).toHaveValue(
        'America/Bogota',
      );
    });

    it('renders the save button', () => {
      setup();
      expect(screen.getByRole('button', { name: 'basicInfo.save' })).toBeInTheDocument();
    });
  });

  describe('timezone auto-default from homeCountry', () => {
    it('auto-fills timezone from homeCountry when timezone is UTC', () => {
      setup({ timezone: 'UTC' }, { homeCountry: 'CO' });
      expect(screen.getByRole('combobox', { name: 'basicInfo.timezone' })).toHaveValue(
        'America/Bogota',
      );
    });

    it('does not override timezone when it is already set to a non-UTC value', () => {
      setup({ timezone: 'Europe/Madrid' }, { homeCountry: 'CO' });
      expect(screen.getByRole('combobox', { name: 'basicInfo.timezone' })).toHaveValue(
        'Europe/Madrid',
      );
    });

    it('keeps UTC when homeCountry has no mapping', () => {
      setup({ timezone: 'UTC' }, { homeCountry: null });
      expect(screen.getByRole('combobox', { name: 'basicInfo.timezone' })).toHaveValue('UTC');
    });
  });

  describe('timezone combobox', () => {
    it('sets the timezone when an option is selected', async () => {
      const { user } = setup({ timezone: 'UTC' }, { homeCountry: null });
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'basicInfo.timezone' }),
        'America/New_York',
      );
      expect(screen.getByRole('combobox', { name: 'basicInfo.timezone' })).toHaveValue(
        'America/New_York',
      );
    });

    it('sends the selected timezone when saving', async () => {
      const { user } = setup({ timezone: 'UTC' }, { homeCountry: null });
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'basicInfo.timezone' }),
        'America/Bogota',
      );
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me',
          expect.objectContaining({ timezone: 'America/Bogota' }),
        ),
      );
    });
  });

  describe('saving', () => {
    it('calls PATCH /users/me and /users/me/profile on submit', async () => {
      // timezone: 'UTC' + homeCountry: 'CO' auto-suggests 'America/Bogota' → form is dirty
      const { user } = setup({ timezone: 'UTC' });
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me',
          expect.objectContaining({ displayName: 'Jane Doe' }),
        );
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/profile',
          expect.objectContaining({ bio: 'Hello world' }),
        );
      });
    });

    it('calls onRefresh after successful save', async () => {
      const { user, onRefresh } = setup({ timezone: 'UTC' });
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('calls store refresh after successful save', async () => {
      const { user } = setup({ timezone: 'UTC' });
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() => expect(mocks.mockRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast on save', async () => {
      const { user } = setup({ timezone: 'UTC' });
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('basicInfo.saveSuccess'),
      );
    });

    it('shows error toast when save fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network error'));
      const { user } = setup({ timezone: 'UTC' });
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() => expect(mocks.mockToastError).toHaveBeenCalledWith('basicInfo.saveError'));
    });

    it('sends null bio when bio is empty', async () => {
      const { user } = setup({ timezone: 'UTC' }, { bio: null });
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/profile', { bio: null }),
      );
    });

    it('includes profileVisibility in the PATCH /v1/users/me payload', async () => {
      const { user } = setup({ profileVisibility: ProfileVisibility.PRIVATE });
      await user.selectOptions(
        screen.getByLabelText('basicInfo.profileVisibility'),
        'basicInfo.profileVisibilityOptions.PUBLIC',
      );
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me',
          expect.objectContaining({ profileVisibility: 'PUBLIC' }),
        ),
      );
    });

    it('sends the auto-suggested timezone when saving with UTC default', async () => {
      const { user } = setup({ timezone: 'UTC' }, { homeCountry: 'CO' });
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me',
          expect.objectContaining({ timezone: 'America/Bogota' }),
        ),
      );
    });
  });

  describe('validation', () => {
    it('shows an error and does not save when display name is empty', async () => {
      const { user } = setup();
      const displayNameInput = screen.getByLabelText('basicInfo.displayName');
      await user.clear(displayNameInput);
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      expect(screen.getByText('basicInfo.validDisplayName')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows an error when display name exceeds 100 characters', async () => {
      const { user } = setup();
      const displayNameInput = screen.getByLabelText('basicInfo.displayName');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'a'.repeat(101));
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      expect(screen.getByText('basicInfo.validDisplayName')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('clears validation error after fixing display name', async () => {
      const { user } = setup();
      const displayNameInput = screen.getByLabelText('basicInfo.displayName');
      await user.clear(displayNameInput);
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      expect(screen.getByText('basicInfo.validDisplayName')).toBeInTheDocument();

      await user.type(displayNameInput, 'Jane Doe Updated');
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      await waitFor(() => expect(mocks.mockToastSuccess).toHaveBeenCalled());
      expect(screen.queryByText('basicInfo.validDisplayName')).not.toBeInTheDocument();
    });
  });

  describe('dirty indicator', () => {
    it('hides indicator when form is untouched', () => {
      setup();
      expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
    });

    it('shows indicator after editing displayName', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('basicInfo.displayName'), ' Jr.');
      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
    });

    it('shows indicator after editing bio', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('basicInfo.bio'), ' extra');
      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
    });

    it('shows indicator after changing timezone', async () => {
      const { user } = setup({ timezone: 'UTC' }, { homeCountry: null });
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'basicInfo.timezone' }),
        'America/New_York',
      );
      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
    });

    it('shows indicator when auto-suggested timezone differs from server value', () => {
      setup({ timezone: 'UTC' }, { homeCountry: 'CO' });
      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
    });

    it('hides indicator when displayName is reverted to original', async () => {
      const { user } = setup();
      const displayNameInput = screen.getByLabelText('basicInfo.displayName');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Doe');
      expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
    });

    it('hides indicator when profileVisibility matches initial value', () => {
      setup({ profileVisibility: ProfileVisibility.PRIVATE });
      expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
    });

    it('shows indicator after changing profileVisibility', async () => {
      const { user } = setup({ profileVisibility: ProfileVisibility.PRIVATE });
      await user.selectOptions(
        screen.getByLabelText('basicInfo.profileVisibility'),
        'basicInfo.profileVisibilityOptions.PUBLIC',
      );
      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
    });

    it('hides indicator while saving', async () => {
      mocks.mockPatch.mockImplementation(() => new Promise(() => {}));
      const { user } = setup();
      await user.type(screen.getByLabelText('basicInfo.displayName'), ' Jr.');
      await user.click(screen.getByRole('button', { name: 'basicInfo.save' }));
      expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
    });
  });

  describe('edit isolation', () => {
    it('preserves unsaved edits when props change (no sync on refresh)', async () => {
      const u = userEvent.setup();
      const { rerender } = render(
        <BasicInfoSection user={baseUser} userProfile={baseProfile} onRefresh={vi.fn()} />,
      );
      const displayNameInput = screen.getByLabelText('basicInfo.displayName');

      await u.clear(displayNameInput);
      await u.type(displayNameInput, 'New Unsaved Name');

      // Simulate a refresh: server still returns the original value.
      rerender(
        <BasicInfoSection
          user={{ ...baseUser, displayName: 'Jane Doe' }}
          userProfile={baseProfile}
          onRefresh={vi.fn()}
        />,
      );

      // Unsaved edit must not be overwritten by the server value.
      expect(displayNameInput).toHaveValue('New Unsaved Name');
    });
  });
});
