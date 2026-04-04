import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'textarea');
  });

  it('applies base styling classes', () => {
    render(<Textarea />);
    const el = screen.getByRole('textbox');
    expect(el).toHaveClass('w-full', 'rounded-lg', 'border', 'border-input');
  });

  it('has minimum height', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-16');
  });

  it('forwards className', () => {
    render(<Textarea className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('forwards placeholder', () => {
    render(<Textarea placeholder="Write something..." />);
    expect(screen.getByPlaceholderText('Write something...')).toBeInTheDocument();
  });

  it('forwards disabled prop', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('forwards rows prop', () => {
    render(<Textarea rows={6} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6');
  });

  it('forwards value and onChange', () => {
    render(<Textarea defaultValue="hello" />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });
});
