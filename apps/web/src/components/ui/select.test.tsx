import { type ComponentProps, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/ui/button', () => ({
  Button: (props: ComponentProps<'button'>) => <button type="button" {...props} />,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({
    render: renderProp,
    children,
    disabled,
  }: {
    render: ReactNode;
    children: ReactNode;
    disabled?: boolean;
  }) => {
    const trigger = renderProp as { props: { 'data-testid'?: string; className?: string } };
    return (
      <div
        role="button"
        tabIndex={0}
        data-testid={trigger.props['data-testid']}
        aria-disabled={disabled}
        className={trigger.props.className}
      >
        {children}
      </div>
    );
  },
  PopoverContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandSearch: ({
    visuallyHidden,
    ...props
  }: ComponentProps<'input'> & { visuallyHidden?: boolean }) => (
    <input role="searchbox" data-visually-hidden={visuallyHidden ? 'true' : 'false'} {...props} />
  ),
  CommandItems: ({ children }: { children: ReactNode }) => <div role="listbox">{children}</div>,
  CommandNoResults: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroupSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandOption: ({
    children,
    onSelect,
    value: _value,
    ...props
  }: {
    children: ReactNode;
    onSelect: () => void;
    value: string;
    [key: string]: unknown;
  }) => (
    <div role="option" onClick={onSelect} {...props}>
      {children}
    </div>
  ),
  buildFilterValue: (...parts: string[]) => parts.join(' '),
}));

import { Select } from './select';

const OPTIONS = [
  { value: 'A', label: 'Alpha' },
  { value: 'B', label: 'Beta' },
];

describe('Select', () => {
  it('shows the placeholder when value is empty', () => {
    render(<Select value="" onChange={vi.fn()} options={OPTIONS} placeholder="Choose one" />);
    expect(within(screen.getByRole('button')).getByText('Choose one')).toBeInTheDocument();
  });

  it('shows the selected option label in the trigger', () => {
    render(<Select value="A" onChange={vi.fn()} options={OPTIONS} placeholder="Choose one" />);
    const trigger = screen.getByRole('button');
    expect(within(trigger).getByText('Alpha')).toBeInTheDocument();
    expect(within(trigger).queryByText('Choose one')).not.toBeInTheDocument();
  });

  it('calls onChange with the option value when an option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        value=""
        onChange={onChange}
        options={OPTIONS}
        placeholder="Choose one"
        data-testid="my-select"
      />,
    );
    await user.click(screen.getByTestId('my-select'));
    await user.click(screen.getByTestId('my-select-option-B'));
    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('calls onChange with empty string when the placeholder row is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        value="A"
        onChange={onChange}
        options={OPTIONS}
        placeholder="Choose one"
        data-testid="my-select"
      />,
    );
    await user.click(screen.getByTestId('my-select'));
    await user.click(screen.getByTestId('my-select-placeholder'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('does not render a placeholder row when placeholder is not passed', async () => {
    const user = userEvent.setup();
    render(<Select value="A" onChange={vi.fn()} options={OPTIONS} data-testid="my-select" />);
    await user.click(screen.getByTestId('my-select'));
    expect(screen.queryByTestId('my-select-placeholder')).not.toBeInTheDocument();
  });

  it('forwards disabled to the trigger', () => {
    render(
      <Select value="" onChange={vi.fn()} options={OPTIONS} disabled data-testid="my-select" />,
    );
    expect(screen.getByTestId('my-select')).toHaveAttribute('aria-disabled', 'true');
  });

  it('forwards data-testid to the trigger', () => {
    render(<Select value="" onChange={vi.fn()} options={OPTIONS} data-testid="my-select" />);
    expect(screen.getByTestId('my-select')).toBeInTheDocument();
  });

  it('renders an option icon when the option provides one', async () => {
    const user = userEvent.setup();
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={[{ value: 'CO', label: 'Colombia', icon: '🇨🇴' }]}
        data-testid="my-select"
      />,
    );
    await user.click(screen.getByTestId('my-select'));
    expect(screen.getByText('🇨🇴')).toBeInTheDocument();
  });

  it('keeps the search box visually hidden by default (still focusable for keyboard nav)', async () => {
    const user = userEvent.setup();
    render(<Select value="" onChange={vi.fn()} options={OPTIONS} data-testid="my-select" />);
    await user.click(screen.getByTestId('my-select'));
    expect(screen.getByRole('searchbox')).toHaveAttribute('data-visually-hidden', 'true');
  });

  it('shows the search box when searchable is true', async () => {
    const user = userEvent.setup();
    render(
      <Select value="" onChange={vi.fn()} options={OPTIONS} searchable data-testid="my-select" />,
    );
    await user.click(screen.getByTestId('my-select'));
    expect(screen.getByRole('searchbox')).toHaveAttribute('data-visually-hidden', 'false');
  });

  it('does not render a placeholder clear row when clearable is false', async () => {
    const user = userEvent.setup();
    render(
      <Select
        value="A"
        onChange={vi.fn()}
        options={OPTIONS}
        placeholder="Choose one"
        clearable={false}
        data-testid="my-select"
      />,
    );
    await user.click(screen.getByTestId('my-select'));
    expect(screen.queryByTestId('my-select-placeholder')).not.toBeInTheDocument();
  });
});
