import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockIsValidPhoneNumber: vi.fn(() => true),
}));

vi.mock('libphonenumber-js', () => ({
  isValidPhoneNumber: mocks.mockIsValidPhoneNumber,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('countries-list', () => ({
  getCountryDataList: () => [
    { iso2: 'CO', name: 'Colombia', phone: [57] },
    { iso2: 'US', name: 'United States', phone: [1] },
    { iso2: 'TT', name: 'Trinidad and Tobago', phone: [1868] },
    { iso2: 'MX', name: 'Mexico', phone: [52] },
  ],
}));

vi.mock('@/components/ui/country-combobox', () => ({
  CountryCombobox: ({
    value,
    onChange,
    'data-testid': testId,
    'aria-invalid': ariaInvalid,
    'aria-labelledby': ariaLabelledBy,
  }: {
    value: string;
    onChange: (iso: string) => void;
    'data-testid'?: string;
    'aria-invalid'?: boolean;
    'aria-labelledby'?: string;
  }) => (
    <select
      data-testid={testId ?? 'country-combobox'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={ariaInvalid}
      aria-labelledby={ariaLabelledBy}
    >
      <option value="CO">+57</option>
      <option value="US">+1</option>
    </select>
  ),
}));

import { PhoneInput, cleanPhoneNumber, isPhoneValid, parsePastedPhoneNumber } from './phone-input';

// ---------------------------------------------------------------------------
// cleanPhoneNumber
// ---------------------------------------------------------------------------

describe('cleanPhoneNumber', () => {
  it('removes leading spaces', () => {
    expect(cleanPhoneNumber('  3001234567')).toBe('3001234567');
  });

  it('removes trailing spaces', () => {
    expect(cleanPhoneNumber('3001234567  ')).toBe('3001234567');
  });

  it('removes internal spaces', () => {
    expect(cleanPhoneNumber('300 123 4567')).toBe('3001234567');
  });

  it('removes tabs and multiple consecutive spaces', () => {
    expect(cleanPhoneNumber('300\t123  4567')).toBe('3001234567');
  });

  it('returns the value unchanged when no spaces', () => {
    expect(cleanPhoneNumber('3001234567')).toBe('3001234567');
  });
});

// ---------------------------------------------------------------------------
// isPhoneValid
// ---------------------------------------------------------------------------

describe('isPhoneValid', () => {
  beforeEach(() => {
    mocks.mockIsValidPhoneNumber.mockReturnValue(true);
  });

  it('returns true when isValidPhoneNumber returns true', () => {
    expect(isPhoneValid('3001234567', 'CO')).toBe(true);
  });

  it('returns false when isValidPhoneNumber returns false', () => {
    mocks.mockIsValidPhoneNumber.mockReturnValue(false);
    expect(isPhoneValid('123', 'CO')).toBe(false);
  });

  it('strips spaces before calling isValidPhoneNumber', () => {
    isPhoneValid('300 123 4567', 'CO');
    expect(mocks.mockIsValidPhoneNumber).toHaveBeenCalledWith('3001234567', 'CO');
  });
});

// ---------------------------------------------------------------------------
// PhoneInput component
// ---------------------------------------------------------------------------

function setup(props: Partial<Parameters<typeof PhoneInput>[0]> = {}) {
  const defaults = {
    countryIso: 'CO',
    localNumber: '',
    onCountryChange: vi.fn(),
    onNumberChange: vi.fn(),
  };
  const merged = { ...defaults, ...props };
  const user = userEvent.setup();
  render(<PhoneInput {...merged} />);
  return { user, ...merged };
}

describe('PhoneInput', () => {
  it('renders country combobox and number input', () => {
    setup();
    expect(screen.getByTestId('country-combobox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('number input reflects localNumber prop', () => {
    setup({ localNumber: '3001234567' });
    expect(screen.getByRole('textbox')).toHaveValue('3001234567');
  });

  it('country combobox reflects countryIso prop', () => {
    setup({ countryIso: 'US' });
    expect(screen.getByTestId('country-combobox')).toHaveValue('US');
  });

  it('calls onNumberChange when number input changes', async () => {
    const { user, onNumberChange } = setup();
    await user.type(screen.getByRole('textbox'), '300');
    expect(onNumberChange).toHaveBeenCalled();
  });

  it('calls onCountryChange when country combobox changes', async () => {
    const { user, onCountryChange } = setup();
    await user.selectOptions(screen.getByTestId('country-combobox'), 'US');
    expect(onCountryChange).toHaveBeenCalledWith('US');
  });

  it('sets aria-invalid on both controls when error is provided', () => {
    setup({ error: 'Invalid phone' });
    expect(screen.getByTestId('country-combobox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when no error', () => {
    setup({ error: null });
    expect(screen.getByTestId('country-combobox')).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('renders sr-only label connected to number input when numberLabel provided', () => {
    setup({ numberLabel: 'Phone number' });
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
  });

  it('does not render sr-only label when numberLabel is omitted', () => {
    setup();
    expect(screen.queryByText('Phone number')).not.toBeInTheDocument();
  });

  it('renders FieldMessage with error text', () => {
    setup({ error: 'Invalid phone number' });
    expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
  });

  it('does not render FieldMessage when error is null', () => {
    setup({ error: null });
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('passes countryTestId to country combobox', () => {
    setup({ countryTestId: 'my-country' });
    expect(screen.getByTestId('my-country')).toBeInTheDocument();
  });

  it('passes inputTestId to number input', () => {
    setup({ inputTestId: 'my-phone' });
    expect(screen.getByTestId('my-phone')).toBeInTheDocument();
  });

  it('renders placeholder on number input', () => {
    setup({ placeholder: 'Enter number' });
    expect(screen.getByPlaceholderText('Enter number')).toBeInTheDocument();
  });

  it('disables number input when disabled prop is true', () => {
    setup({ disabled: true });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('splits international number on paste and updates both fields', async () => {
    const { user, onCountryChange, onNumberChange } = setup();
    await user.click(screen.getByRole('textbox'));
    await user.paste('+57 311 5467389');
    expect(onCountryChange).toHaveBeenCalledWith('CO');
    expect(onNumberChange).toHaveBeenCalledWith('3115467389');
  });

  it('does not intercept paste when number has no country prefix', async () => {
    const { user, onCountryChange } = setup();
    await user.click(screen.getByRole('textbox'));
    await user.paste('3115467389');
    expect(onCountryChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// parsePastedPhoneNumber
// ---------------------------------------------------------------------------

describe('parsePastedPhoneNumber', () => {
  it('parses a Colombian WA number with spaces', () => {
    expect(parsePastedPhoneNumber('+57 311 5467389')).toEqual({
      iso2: 'CO',
      nationalNumber: '3115467389',
    });
  });

  it('parses a number without spaces after the prefix', () => {
    expect(parsePastedPhoneNumber('+573115467389')).toEqual({
      iso2: 'CO',
      nationalNumber: '3115467389',
    });
  });

  it('matches longer prefix first (+1868 before +1)', () => {
    expect(parsePastedPhoneNumber('+1868 123 4567')).toEqual({
      iso2: 'TT',
      nationalNumber: '1234567',
    });
  });

  it('strips parentheses, dashes, and spaces from national number', () => {
    expect(parsePastedPhoneNumber('+57 (311) 546-7389')).toEqual({
      iso2: 'CO',
      nationalNumber: '3115467389',
    });
  });

  it('returns null for a number without + prefix', () => {
    expect(parsePastedPhoneNumber('3115467389')).toBeNull();
  });

  it('returns null when only the prefix is present with no national number', () => {
    expect(parsePastedPhoneNumber('+57')).toBeNull();
  });

  it('trims leading/trailing whitespace before parsing', () => {
    expect(parsePastedPhoneNumber('  +52 55 1234 5678  ')).toEqual({
      iso2: 'MX',
      nationalNumber: '5512345678',
    });
  });
});
