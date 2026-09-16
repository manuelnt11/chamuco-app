import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComboboxTriggerContent, SelectItem } from './select-item';

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

describe('ComboboxTriggerContent', () => {
  it('renders children when selected', () => {
    render(
      <ComboboxTriggerContent selected placeholder="Pick one">
        <span>Chosen value</span>
      </ComboboxTriggerContent>,
    );
    expect(screen.getByText('Chosen value')).toBeInTheDocument();
    expect(screen.queryByText('Pick one')).not.toBeInTheDocument();
  });

  it('renders the placeholder when not selected', () => {
    render(
      <ComboboxTriggerContent selected={false} placeholder="Pick one">
        <span>Chosen value</span>
      </ComboboxTriggerContent>,
    );
    expect(screen.getByText('Pick one')).toBeInTheDocument();
    expect(screen.queryByText('Chosen value')).not.toBeInTheDocument();
  });

  it('always renders the caret icon, hidden from assistive tech', () => {
    const { container } = render(
      <ComboboxTriggerContent selected={false} placeholder="Pick one">
        <span>Chosen value</span>
      </ComboboxTriggerContent>,
    );
    const caret = container.querySelector('svg');
    expect(caret).toBeInTheDocument();
    expect(caret).toHaveAttribute('aria-hidden', 'true');
  });
});
