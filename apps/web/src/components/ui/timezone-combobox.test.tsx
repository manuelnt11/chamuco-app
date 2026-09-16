import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TimezoneCombobox } from './timezone-combobox';

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

describe('TimezoneCombobox', () => {
  it('shows the placeholder when value is empty', () => {
    render(<TimezoneCombobox value="" onChange={vi.fn()} placeholder="Select a timezone" />);
    expect(screen.getByText('Select a timezone')).toBeInTheDocument();
  });

  it('shows the formatted label for the selected timezone', () => {
    render(<TimezoneCombobox value="America/Bogota" onChange={vi.fn()} />);
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('calls onChange when a timezone option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimezoneCombobox value="America/Bogota" onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    await user.type(screen.getByRole('combobox'), 'London');
    const option = screen.getAllByRole('option')[0]!;
    await user.click(option);
    expect(onChange).toHaveBeenCalled();
  });

  it('does not render a clear row in the option list when clearable is false', async () => {
    const user = userEvent.setup();
    render(
      <TimezoneCombobox
        value="America/Bogota"
        onChange={vi.fn()}
        placeholder="Select"
        clearable={false}
      />,
    );
    await user.click(screen.getByRole('button'));
    expect(within(screen.getByRole('listbox')).queryByText('Select')).not.toBeInTheDocument();
  });

  it('renders a clear row in the option list by default when a placeholder is set', async () => {
    const user = userEvent.setup();
    render(<TimezoneCombobox value="America/Bogota" onChange={vi.fn()} placeholder="Select" />);
    await user.click(screen.getByRole('button'));
    expect(within(screen.getByRole('listbox')).getByText('Select')).toBeInTheDocument();
  });

  it('disables the trigger when disabled', () => {
    render(<TimezoneCombobox value="America/Bogota" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
