import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toHaveAttribute('data-slot', 'badge');
  });

  it('renders as a span', () => {
    const { container } = render(<Badge>Active</Badge>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('applies secondary variant classes', () => {
    render(<Badge variant="secondary">Beta</Badge>);
    expect(screen.getByText('Beta')).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('applies destructive variant classes', () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('text-destructive');
  });

  it('applies outline variant classes', () => {
    render(<Badge variant="outline">Draft</Badge>);
    const el = screen.getByText('Draft');
    expect(el).toHaveClass('border-border', 'text-foreground');
    expect(el).not.toHaveClass('bg-primary');
  });

  it('forwards className', () => {
    render(<Badge className="custom-badge">Tag</Badge>);
    expect(screen.getByText('Tag')).toHaveClass('custom-badge');
  });

  it('has rounded-full shape', () => {
    render(<Badge>Pill</Badge>);
    expect(screen.getByText('Pill')).toHaveClass('rounded-full');
  });
});
