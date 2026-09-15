import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MultiSelect } from './multi-select';

const OPTIONS = [
  { value: 'GLUTEN', label: 'Gluten' },
  { value: 'PEANUTS', label: 'Peanuts' },
  { value: 'MILK', label: 'Milk' },
];

function renderMultiSelect(props: Partial<Parameters<typeof MultiSelect>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <MultiSelect
      options={OPTIONS}
      selected={[]}
      onChange={onChange}
      placeholder="Select allergies..."
      searchPlaceholder="Search..."
      noResultsText="No results."
      selectedHint="Selected"
      getRemoveAriaLabel={(label) => `Remove ${label}`}
      data-testid="allergies"
      {...props}
    />,
  );
  return { onChange };
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

describe('MultiSelect', () => {
  it('shows the placeholder when nothing is selected', () => {
    renderMultiSelect();
    expect(screen.getByText('Select allergies...')).toBeInTheDocument();
  });

  it('renders a chip for each selected value instead of the placeholder', () => {
    renderMultiSelect({ selected: ['GLUTEN', 'PEANUTS'] });
    expect(screen.getByTestId('allergies-chip-GLUTEN')).toBeInTheDocument();
    expect(screen.getByTestId('allergies-chip-PEANUTS')).toBeInTheDocument();
    expect(screen.queryByText('Select allergies...')).not.toBeInTheDocument();
  });

  it('opens the option list on trigger click and lists every option', async () => {
    const user = userEvent.setup();
    renderMultiSelect();
    await user.click(screen.getByTestId('allergies'));
    expect(screen.getByTestId('allergies-option-GLUTEN')).toBeInTheDocument();
    expect(screen.getByTestId('allergies-option-PEANUTS')).toBeInTheDocument();
    expect(screen.getByTestId('allergies-option-MILK')).toBeInTheDocument();
  });

  it('calls onChange with the value added when an unselected option is chosen', async () => {
    const user = userEvent.setup();
    const { onChange } = renderMultiSelect({ selected: ['GLUTEN'] });
    await user.click(screen.getByTestId('allergies'));
    await user.click(screen.getByTestId('allergies-option-PEANUTS'));
    expect(onChange).toHaveBeenCalledWith(['GLUTEN', 'PEANUTS']);
  });

  it('calls onChange with the value removed when an already-selected option is chosen again', async () => {
    const user = userEvent.setup();
    const { onChange } = renderMultiSelect({ selected: ['GLUTEN', 'PEANUTS'] });
    await user.click(screen.getByTestId('allergies'));
    await user.click(screen.getByTestId('allergies-option-GLUTEN'));
    expect(onChange).toHaveBeenCalledWith(['PEANUTS']);
  });

  it('marks a selected option with a screen-reader-only selected hint', async () => {
    const user = userEvent.setup();
    renderMultiSelect({ selected: ['GLUTEN'] });
    await user.click(screen.getByTestId('allergies'));
    const option = screen.getByTestId('allergies-option-GLUTEN');
    expect(within(option).getByText(', Selected')).toBeInTheDocument();
  });

  it('does not show the selected hint for an unselected option', async () => {
    const user = userEvent.setup();
    renderMultiSelect({ selected: ['GLUTEN'] });
    await user.click(screen.getByTestId('allergies'));
    const option = screen.getByTestId('allergies-option-PEANUTS');
    expect(within(option).queryByText(', Selected')).not.toBeInTheDocument();
  });

  it('calls onChange with the value removed when a chip remove button is clicked', async () => {
    const user = userEvent.setup();
    const { onChange } = renderMultiSelect({ selected: ['GLUTEN', 'PEANUTS'] });
    const chip = screen.getByTestId('allergies-chip-GLUTEN');
    await user.click(within(chip).getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(['PEANUTS']);
  });

  it('does not open the dropdown when a chip remove button is clicked', async () => {
    const user = userEvent.setup();
    renderMultiSelect({ selected: ['GLUTEN'] });
    const chip = screen.getByTestId('allergies-chip-GLUTEN');
    await user.click(within(chip).getByRole('button'));
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('sets title and aria-label on the chip remove button', () => {
    renderMultiSelect({ selected: ['GLUTEN'] });
    const chip = screen.getByTestId('allergies-chip-GLUTEN');
    const removeButton = within(chip).getByRole('button');
    expect(removeButton).toHaveAttribute('title', 'Remove Gluten');
    expect(removeButton).toHaveAttribute('aria-label', 'Remove Gluten');
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    renderMultiSelect({ disabled: true });
    await user.click(screen.getByTestId('allergies'));
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
