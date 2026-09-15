import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FreeTextCombobox, type FreeTextComboboxOption } from './free-text-combobox';

const OPTIONS: FreeTextComboboxOption[] = [
  { value: 'A', label: 'Alpha', subtitle: 'First letter' },
  { value: 'B', label: 'Beta' },
  { value: 'C', label: 'Gamma' },
];

function ControlledFreeTextCombobox({
  initialValue = '',
  onChangeSpy,
  ...props
}: {
  initialValue?: string;
  onChangeSpy: (value: string) => void;
} & Partial<Parameters<typeof FreeTextCombobox>[0]>) {
  const [value, setValue] = useState(initialValue);
  return (
    <FreeTextCombobox
      options={OPTIONS}
      placeholder="Pick one"
      noResultsText="No matches."
      data-testid="combobox"
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChangeSpy(v);
      }}
    />
  );
}

function setup(props: Partial<Parameters<typeof FreeTextCombobox>[0]> = {}) {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ControlledFreeTextCombobox onChangeSpy={onChange} {...props} />);
  return { user, onChange };
}

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

describe('FreeTextCombobox', () => {
  it('shows the placeholder when value is empty', () => {
    setup();
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('shows the current value in the trigger', () => {
    setup({ initialValue: 'Something typed' } as never);
    expect(screen.getByText('Something typed')).toBeInTheDocument();
  });

  it('shows all options when the value is empty', async () => {
    const { user } = setup();
    await user.click(screen.getByTestId('combobox'));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders a subtitle when the option provides one', async () => {
    const { user } = setup();
    await user.click(screen.getByTestId('combobox'));
    expect(screen.getByText('First letter')).toBeInTheDocument();
  });

  it('calls onChange on every keystroke', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByTestId('combobox'));
    await user.type(screen.getByPlaceholderText('Pick one'), 'be');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('be');
  });

  it('applies transformInput to typed text', async () => {
    const { user, onChange } = setup({ transformInput: (raw) => raw.toUpperCase() });
    await user.click(screen.getByTestId('combobox'));
    await user.type(screen.getByPlaceholderText('Pick one'), 'be');
    expect(onChange).toHaveBeenLastCalledWith('BE');
  });

  it('filters options by the typed query', async () => {
    const { user } = setup();
    await user.click(screen.getByTestId('combobox'));
    await user.type(screen.getByPlaceholderText('Pick one'), 'bet');
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('shows noResultsText when nothing matches', async () => {
    const { user } = setup();
    await user.click(screen.getByTestId('combobox'));
    await user.type(screen.getByPlaceholderText('Pick one'), 'zzz');
    expect(screen.getByText('No matches.')).toBeInTheDocument();
  });

  it('caps results to maxSuggestions', async () => {
    const { user } = setup({ maxSuggestions: 1 });
    await user.click(screen.getByTestId('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('calls onChange with the transformed label when a suggestion is selected, and closes', async () => {
    const { user, onChange } = setup({ transformInput: (raw) => raw.toUpperCase() });
    await user.click(screen.getByTestId('combobox'));
    await user.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith('BETA');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('forwards maxLength to the search input', async () => {
    const { user } = setup({ maxLength: 10 });
    await user.click(screen.getByTestId('combobox'));
    expect(screen.getByPlaceholderText('Pick one')).toHaveAttribute('maxLength', '10');
  });

  it('forwards disabled to the trigger', () => {
    setup({ disabled: true });
    expect(screen.getByTestId('combobox')).toBeDisabled();
  });
});
