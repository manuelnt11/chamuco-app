import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SelectItem } from './select-item';

describe('SelectItem', () => {
  it('renders children', () => {
    render(<SelectItem>Label text</SelectItem>);
    expect(screen.getByText('Label text')).toBeInTheDocument();
  });

  it('renders icon when passed, hidden from assistive tech', () => {
    render(
      <SelectItem icon={<span data-testid="flag">🇨🇴</span>}>
        <span>Colombia</span>
      </SelectItem>,
    );
    const flag = screen.getByTestId('flag');
    expect(flag).toBeInTheDocument();
    expect(flag.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render an icon wrapper when icon is not passed', () => {
    const { container } = render(<SelectItem>Label</SelectItem>);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('renders checkmark when selected', () => {
    const { container } = render(<SelectItem selected>Label</SelectItem>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render checkmark when not selected', () => {
    const { container } = render(<SelectItem>Label</SelectItem>);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders sr-only selectedHint when selected and hint is provided', () => {
    render(
      <SelectItem selected selectedHint="Selected">
        Label
      </SelectItem>,
    );
    expect(screen.getByText(', Selected')).toHaveClass('sr-only');
  });

  it('omits selectedHint text when not provided even if selected', () => {
    render(<SelectItem selected>Label</SelectItem>);
    expect(screen.queryByText(/, /)).not.toBeInTheDocument();
  });

  it('does not render selectedHint when not selected even if provided', () => {
    render(<SelectItem selectedHint="Selected">Label</SelectItem>);
    expect(screen.queryByText(', Selected')).not.toBeInTheDocument();
  });
});
