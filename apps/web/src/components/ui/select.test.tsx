import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Select } from './select';

describe('Select', () => {
  it('renders a select element', () => {
    render(
      <Select aria-label="test">
        <option value="A">Option A</option>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    render(<Select aria-label="test" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('data-slot', 'select');
  });

  it('renders children options', () => {
    render(
      <Select aria-label="test">
        <option value="A">Alpha</option>
        <option value="B">Beta</option>
      </Select>,
    );
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument();
  });

  it('forwards className', () => {
    render(<Select aria-label="test" className="custom-class" />);
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });

  it('is disabled when disabled prop is set', () => {
    render(<Select aria-label="test" disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('forwards value and onChange', () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="test" value="A" onChange={onChange}>
        <option value="A">Alpha</option>
        <option value="B">Beta</option>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveValue('A');
  });
});
