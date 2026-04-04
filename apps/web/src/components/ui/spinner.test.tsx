import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('renders an svg element', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has role="status"', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has default aria-label "Loading..."', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...');
  });

  it('accepts custom aria-label', () => {
    render(<Spinner label="Saving changes..." />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Saving changes...');
  });

  it('has data-slot attribute', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('data-slot', 'spinner');
  });

  it('applies animate-spin class', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });

  it('applies md size by default', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveClass('size-6');
  });

  it('applies sm size', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('size-4');
  });

  it('applies lg size', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('size-8');
  });

  it('forwards className', () => {
    render(<Spinner className="text-primary" />);
    expect(screen.getByRole('status')).toHaveClass('text-primary');
  });
});
