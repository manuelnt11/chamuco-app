import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CountryCombobox } from './country-combobox';

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('CountryCombobox', () => {
  it('shows the placeholder when value is empty', () => {
    render(<CountryCombobox value="" onChange={vi.fn()} />);
    expect(screen.getByText('countryCombobox.placeholder')).toBeInTheDocument();
  });

  it('shows the selected country name and flag', () => {
    render(<CountryCombobox value="CO" onChange={vi.fn()} />);
    expect(screen.queryByText('countryCombobox.placeholder')).not.toBeInTheDocument();
  });

  it('shows the dial code instead of the name when displayMode is phone', () => {
    render(<CountryCombobox value="CO" onChange={vi.fn()} displayMode="phone" />);
    expect(screen.getByText('+57')).toBeInTheDocument();
  });

  it('calls onChange when a country option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountryCombobox value="" onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    await user.type(screen.getByRole('combobox'), 'Colombia');
    const option = screen.getAllByRole('option')[0]!;
    await user.click(option);
    expect(onChange).toHaveBeenCalledWith('CO');
  });

  it('disables the trigger when disabled', () => {
    render(<CountryCombobox value="CO" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
