import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockIsValidPhoneNumber: vi.fn(() => true),
  mockGetCallingCode: vi.fn((iso2: string) => (iso2 === 'CO' ? '+57' : '+1')),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
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

vi.mock('libphonenumber-js', () => ({
  isValidPhoneNumber: mocks.mockIsValidPhoneNumber,
}));

vi.mock('countries-list', () => ({
  getCountryDataList: () => [
    { iso2: 'CO', phone: ['57'] },
    { iso2: 'US', phone: ['1'] },
  ],
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />,
}));

vi.mock('@/components/ui/country-combobox', () => ({
  CountryCombobox: ({
    value,
    onChange,
    'data-testid': testId,
    'aria-invalid': ariaInvalid,
  }: {
    value: string;
    onChange: (iso2: string) => void;
    'data-testid'?: string;
    'aria-invalid'?: boolean;
  }) => (
    <select
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={ariaInvalid}
    >
      <option value="CO">Colombia (+57)</option>
      <option value="US">United States (+1)</option>
      <option value="">None</option>
    </select>
  ),
  getCallingCode: mocks.mockGetCallingCode,
}));

vi.mock('@/components/ui/city-combobox', () => ({
  CityCombobox: ({
    value,
    onChange,
    'data-testid': testId,
  }: {
    value: string;
    onChange: (city: string) => void;
    country: string;
    placeholder?: string;
    'data-testid'?: string;
  }) => <input data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} />,
}));

import { PersonalDetailsSection } from './PersonalDetailsSection';
import type { PersonalDetailsProfile } from './PersonalDetailsSection';

const baseProfile: PersonalDetailsProfile = {
  firstName: 'Juan',
  lastName: 'García',
  dateOfBirth: { day: 15, month: 6, year: 1990, yearVisible: false },
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  birthCountry: 'CO',
  birthCity: 'Bogotá',
  homeCountry: 'CO',
  homeCity: 'Medellín',
  email: 'test@example.com',
  emailVerified: false,
  phoneVerified: false,
};

function setup(profileOverride?: Partial<PersonalDetailsProfile>) {
  const onRefresh = vi.fn();
  const user = userEvent.setup();
  render(
    <PersonalDetailsSection
      profile={{ ...baseProfile, ...profileOverride }}
      onRefresh={onRefresh}
    />,
  );
  return { user, onRefresh };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockIsValidPhoneNumber.mockReturnValue(true);
  mocks.mockGetCallingCode.mockImplementation((iso2: string) => (iso2 === 'CO' ? '+57' : '+1'));
});

describe('PersonalDetailsSection', () => {
  describe('rendering', () => {
    it('renders the section heading', () => {
      setup();
      expect(screen.getByText('personalDetails.heading')).toBeInTheDocument();
    });

    it('renders firstName field with initial value', () => {
      setup();
      expect(screen.getByLabelText('personalDetails.firstName')).toHaveValue('JUAN');
    });

    it('renders lastName field with initial value', () => {
      setup();
      expect(screen.getByLabelText('personalDetails.lastName')).toHaveValue('GARCÍA');
    });

    it('renders DOB day field with initial value', () => {
      setup();
      expect(screen.getByLabelText('personalDetails.day')).toHaveValue(15);
    });

    it('renders DOB month field with initial value', () => {
      setup();
      expect(screen.getByLabelText('personalDetails.month')).toHaveValue(6);
    });

    it('renders DOB year field with initial value', () => {
      setup();
      expect(screen.getByLabelText('personalDetails.year')).toHaveValue(1990);
    });

    it('renders yearVisible checkbox unchecked when yearVisible is false', () => {
      setup();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('renders yearVisible checkbox checked when yearVisible is true', () => {
      setup({ dateOfBirth: { day: 15, month: 6, year: 1990, yearVisible: true } });
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('renders phone local number field with initial value', () => {
      setup();
      expect(screen.getByLabelText('personalDetails.phoneNumber')).toHaveValue('3001234567');
    });

    it('renders phone country combobox with derived ISO2', () => {
      setup();
      expect(screen.getByTestId('phone-country')).toHaveValue('CO');
    });

    it('renders birth country combobox with initial value', () => {
      setup();
      expect(screen.getByTestId('birth-country')).toHaveValue('CO');
    });

    it('renders birth city with initial value', () => {
      setup();
      expect(screen.getByTestId('birth-city')).toHaveValue('Bogotá');
    });

    it('renders home country combobox with initial value', () => {
      setup();
      expect(screen.getByTestId('home-country')).toHaveValue('CO');
    });

    it('renders home city with initial value', () => {
      setup();
      expect(screen.getByTestId('home-city')).toHaveValue('Medellín');
    });

    it('renders email field empty when profile email is empty string', () => {
      setup({ email: '' });
      expect(screen.getByLabelText('personalDetails.email')).toHaveValue('');
    });

    it('renders email field with initial value', () => {
      setup();
      expect(screen.getByLabelText('personalDetails.email')).toHaveValue('test@example.com');
    });

    it('renders with empty birth fields when birthCountry and birthCity are null', () => {
      setup({ birthCountry: null, birthCity: null });
      expect(screen.getByTestId('birth-country')).toHaveValue('');
      expect(screen.getByTestId('birth-city')).toHaveValue('');
    });
  });

  describe('save button state', () => {
    it('disables save button when form is pristine', () => {
      setup();
      expect(screen.getByRole('button', { name: 'personalDetails.save' })).toBeDisabled();
    });

    it('enables save button after editing firstName', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      expect(screen.getByRole('button', { name: 'personalDetails.save' })).toBeEnabled();
    });

    it('shows unsaved indicator after editing a field', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
    });

    it('hides unsaved indicator on pristine form', () => {
      setup();
      expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
    });
  });

  describe('saving', () => {
    it('calls PATCH /v1/users/me/profile on submit', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/profile',
          expect.objectContaining({ firstName: 'JUAN CARLOS' }),
        ),
      );
    });

    it('sends correct payload with all fields', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/profile', {
          firstName: 'JUAN CARLOS',
          lastName: 'GARCÍA',
          dateOfBirth: { day: 15, month: 6, year: 1990, yearVisible: false },
          phoneCountryCode: '+57',
          phoneLocalNumber: '3001234567',
          birthCountry: 'CO',
          birthCity: 'Bogotá',
          homeCountry: 'CO',
          homeCity: 'Medellín',
          email: 'test@example.com',
        }),
      );
    });

    it('sends null for empty birth fields', async () => {
      const { user } = setup({ birthCountry: null, birthCity: null });
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/profile',
          expect.objectContaining({ birthCountry: null, birthCity: null }),
        ),
      );
    });

    it('calls onRefresh after successful save', async () => {
      const { user, onRefresh } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast on save', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('personalDetails.saveSuccess'),
      );
    });

    it('shows error toast when save fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network error'));
      const { user } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('personalDetails.saveError'),
      );
    });

    it('disables button while saving', async () => {
      mocks.mockPatch.mockImplementation(() => new Promise(() => {}));
      const { user } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('converts yearVisible toggle in payload', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('checkbox'));
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/profile',
          expect.objectContaining({
            dateOfBirth: expect.objectContaining({ yearVisible: true }),
          }),
        ),
      );
    });
  });

  describe('validation', () => {
    it('shows firstName error and blocks save when firstName is empty', async () => {
      const { user } = setup();
      const input = screen.getByLabelText('personalDetails.firstName');
      await user.clear(input);
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByText('personalDetails.errors.firstNameRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows firstName error when firstName is one character', async () => {
      const { user } = setup();
      const input = screen.getByLabelText('personalDetails.firstName');
      await user.clear(input);
      await user.type(input, 'A');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByText('personalDetails.errors.firstNameRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows lastName error and blocks save when lastName is empty', async () => {
      const { user } = setup();
      const input = screen.getByLabelText('personalDetails.lastName');
      await user.clear(input);
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByText('personalDetails.errors.lastNameRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows DOB error when year is too recent (min age 15)', async () => {
      const recentYear = new Date().getFullYear() - 5;
      setup({
        dateOfBirth: { day: 15, month: 6, year: recentYear, yearVisible: false },
      });
      fireEvent.submit(document.querySelector('form')!);
      await waitFor(() =>
        expect(screen.getByText('personalDetails.errors.invalidDob')).toBeInTheDocument(),
      );
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows DOB error for invalid calendar date (e.g. Feb 30)', async () => {
      const { user } = setup();
      const dayInput = screen.getByLabelText('personalDetails.day');
      const monthInput = screen.getByLabelText('personalDetails.month');
      await user.clear(dayInput);
      await user.type(dayInput, '30');
      await user.clear(monthInput);
      await user.type(monthInput, '2');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByText('personalDetails.errors.invalidDob')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows phone error when isValidPhoneNumber returns false', async () => {
      mocks.mockIsValidPhoneNumber.mockReturnValue(false);
      const { user } = setup();
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByText('personalDetails.errors.invalidPhone')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows homeCountry error when homeCountry is empty', async () => {
      const { user } = setup({ homeCountry: '' });
      await user.type(screen.getByLabelText('personalDetails.firstName'), ' Carlos');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByText('personalDetails.errors.homeCountryRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows invalidEmail error and blocks save when email is malformed', async () => {
      const { user } = setup({ email: '' });
      await user.type(screen.getByLabelText('personalDetails.email'), 'not-an-email');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByText('personalDetails.errors.invalidEmail')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('accepts a valid email without error', async () => {
      const { user } = setup({ email: '' });
      await user.type(screen.getByLabelText('personalDetails.email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() => expect(mocks.mockPatch).toHaveBeenCalled());
      expect(screen.queryByText('personalDetails.errors.invalidEmail')).not.toBeInTheDocument();
    });

    it('allows empty email (clears the field)', async () => {
      const { user } = setup({ email: 'old@example.com' });
      const input = screen.getByLabelText('personalDetails.email');
      await user.clear(input);
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/profile',
          expect.objectContaining({ email: '' }),
        ),
      );
    });

    it('clears firstName error after fixing and successfully saving', async () => {
      const { user } = setup();
      const input = screen.getByLabelText('personalDetails.firstName');
      await user.clear(input);
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      expect(screen.getByText('personalDetails.errors.firstNameRequired')).toBeInTheDocument();

      await user.type(input, 'Pedro');
      await user.click(screen.getByRole('button', { name: 'personalDetails.save' }));
      await waitFor(() => expect(mocks.mockToastSuccess).toHaveBeenCalled());
      expect(
        screen.queryByText('personalDetails.errors.firstNameRequired'),
      ).not.toBeInTheDocument();
    });
  });
});
