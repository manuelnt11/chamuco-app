import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InlineCombobox } from './inline-combobox';
import { CommandOption } from '@/components/ui/command';

const OPTIONS = ['Apple', 'Banana', 'Cherry'];

function renderCombobox(props: Partial<Parameters<typeof InlineCombobox>[0]> = {}) {
  return render(
    <InlineCombobox
      value=""
      onValueChange={vi.fn()}
      open={false}
      onFocus={vi.fn()}
      onClose={vi.fn()}
      placeholder="Search fruits..."
      noResultsText="No fruits found."
      {...props}
    >
      {props.children ??
        ((close) =>
          OPTIONS.map((option) => (
            <CommandOption key={option} value={option} onSelect={close}>
              {option}
            </CommandOption>
          )))}
    </InlineCombobox>,
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

describe('InlineCombobox', () => {
  it('renders the input with its placeholder', () => {
    renderCombobox();
    expect(screen.getByPlaceholderText('Search fruits...')).toBeInTheDocument();
  });

  it('does not show the panel when open is false', () => {
    renderCombobox({ open: false });
    expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
  });

  it('shows the option list when open is true', () => {
    renderCombobox({ open: true });
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cherry' })).toBeInTheDocument();
  });

  it('calls onValueChange when typing', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCombobox({ onValueChange });
    await user.type(screen.getByPlaceholderText('Search fruits...'), 'a');
    expect(onValueChange).toHaveBeenCalledWith('a');
  });

  it('calls onFocus when the input is focused', async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    renderCombobox({ onFocus });
    await user.click(screen.getByPlaceholderText('Search fruits...'));
    expect(onFocus).toHaveBeenCalled();
  });

  it('shows a loading spinner in place of the option list when isLoading', () => {
    renderCombobox({ open: true, isLoading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
  });

  it('shows noResultsText when there are no option children', () => {
    renderCombobox({ open: true, children: () => [] });
    expect(screen.getByText('No fruits found.')).toBeInTheDocument();
  });

  it('calls onClose on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCombobox({ open: true, onClose });
    await user.click(screen.getByPlaceholderText('Search fruits...'));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose after a blur delay', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCombobox({ open: true, onClose });
    await user.click(screen.getByPlaceholderText('Search fruits...'));
    await user.click(document.body);
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 1000 });
  });

  it('hides the panel and disables the input when disabled is true, even if open', () => {
    renderCombobox({ open: true, disabled: true });
    expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search fruits...')).toBeDisabled();
  });

  it("calls the option's onSelect with the close callback, closing the panel", async () => {
    const user = userEvent.setup();
    function ControlledCombobox() {
      const [open, setOpen] = useState(true);
      return (
        <InlineCombobox
          value=""
          onValueChange={vi.fn()}
          open={open}
          onFocus={vi.fn()}
          onClose={() => setOpen(false)}
          noResultsText="No fruits found."
        >
          {(close) =>
            OPTIONS.map((option) => (
              <CommandOption key={option} value={option} onSelect={close}>
                {option}
              </CommandOption>
            ))
          }
        </InlineCombobox>
      );
    }
    render(<ControlledCombobox />);
    await user.click(screen.getByText('Banana'));
    expect(screen.queryByRole('option', { name: 'Banana' })).not.toBeInTheDocument();
  });

  it('does not preventDefault on Enter while closed, so a surrounding form can still submit', () => {
    renderCombobox({ open: false });
    const notPrevented = fireEvent.keyDown(screen.getByPlaceholderText('Search fruits...'), {
      key: 'Enter',
    });
    expect(notPrevented).toBe(true);
  });

  it('still lets cmdk handle Enter to select an option while open', () => {
    const onSelect = vi.fn();
    renderCombobox({
      open: true,
      children: (close) => (
        <CommandOption
          value="Apple"
          onSelect={() => {
            onSelect();
            close();
          }}
        >
          Apple
        </CommandOption>
      ),
    });
    const notPrevented = fireEvent.keyDown(screen.getByPlaceholderText('Search fruits...'), {
      key: 'Enter',
    });
    expect(notPrevented).toBe(false);
    expect(onSelect).toHaveBeenCalled();
  });

  it('keeps the input focused after clicking an option, instead of blurring it', async () => {
    const user = userEvent.setup();
    renderCombobox({ open: true });
    const input = screen.getByPlaceholderText('Search fruits...');
    await user.click(input);
    await user.click(screen.getByText('Banana'));
    expect(input).toHaveFocus();
  });
});
