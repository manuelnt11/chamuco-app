import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ComboboxPopover } from './combobox-popover';
import { Button } from '@/components/ui/button';
import { CommandOption } from '@/components/ui/command';

const OPTIONS = ['Apple', 'Banana', 'Cherry'];

function renderCombobox(props: Partial<Parameters<typeof ComboboxPopover>[0]> = {}) {
  return render(
    <ComboboxPopover
      trigger={<Button variant="outline" data-testid="trigger" />}
      triggerChildren={<span>Pick a fruit</span>}
      searchPlaceholder="Search fruits..."
      noResultsText="No fruits found."
      {...props}
    >
      {props.children ??
        (() =>
          OPTIONS.map((option) => (
            <CommandOption key={option} value={option} onSelect={() => {}}>
              {option}
            </CommandOption>
          )))}
    </ComboboxPopover>,
  );
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

describe('ComboboxPopover', () => {
  it('renders the trigger with its children', () => {
    renderCombobox();
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
    expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
  });

  it('does not show the option list before the trigger is clicked', () => {
    renderCombobox();
    expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
  });

  it('opens the option list on trigger click and shows all options', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cherry' })).toBeInTheDocument();
  });

  it('renders the search input with the given placeholder and an accessible name', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByTestId('trigger'));
    const search = screen.getByPlaceholderText('Search fruits...');
    expect(search).toBeInTheDocument();
    expect(search).toHaveAccessibleName('Search fruits...');
  });

  it('shows the no-results text when the search matches nothing', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByTestId('trigger'));
    await user.type(screen.getByPlaceholderText('Search fruits...'), 'zzz');
    expect(screen.getByText('No fruits found.')).toBeInTheDocument();
  });

  it('calls onSelect and close() when an option is chosen', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderCombobox({
      children: (close) =>
        OPTIONS.map((option) => (
          <CommandOption
            key={option}
            value={option}
            onSelect={() => {
              onSelect(option);
              close();
            }}
          >
            {option}
          </CommandOption>
        )),
    });
    await user.click(screen.getByTestId('trigger'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onSelect).toHaveBeenCalledWith('Banana');
    expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    renderCombobox({ disabled: true });
    await user.click(screen.getByTestId('trigger'));
    expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
  });

  it('closes the option list when disabled flips to true while open', async () => {
    const user = userEvent.setup();
    const { rerender } = renderCombobox();
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();

    rerender(
      <ComboboxPopover
        trigger={<Button variant="outline" data-testid="trigger" />}
        triggerChildren={<span>Pick a fruit</span>}
        searchPlaceholder="Search fruits..."
        noResultsText="No fruits found."
        disabled
      >
        {() =>
          OPTIONS.map((option) => (
            <CommandOption key={option} value={option} onSelect={() => {}}>
              {option}
            </CommandOption>
          ))
        }
      </ComboboxPopover>,
    );
    expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
  });

  it('renders within the given contentClassName width', async () => {
    const user = userEvent.setup();
    renderCombobox({ contentClassName: 'w-72' });
    await user.click(screen.getByTestId('trigger'));
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: 'Apple' })).toBeInTheDocument();
  });
});
