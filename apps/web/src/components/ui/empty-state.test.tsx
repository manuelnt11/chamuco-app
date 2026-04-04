import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No trips yet" />);
    expect(screen.getByText('No trips yet')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('[data-slot="empty-state"]')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No trips" description="Create your first trip to get started." />);
    expect(screen.getByText('Create your first trip to get started.')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    const { container } = render(<EmptyState title="No trips" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="No items" icon={<span data-testid="icon">icon</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon is omitted', () => {
    const { container } = render(<EmptyState title="No items" />);
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<EmptyState title="No trips" action={<button>Create trip</button>} />);
    expect(screen.getByRole('button', { name: 'Create trip' })).toBeInTheDocument();
  });

  it('has dashed border styling', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const el = container.querySelector('[data-slot="empty-state"]');
    expect(el).toHaveClass('border-dashed');
  });

  it('is centered', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('[data-slot="empty-state"]')).toHaveClass(
      'items-center',
      'justify-center',
      'text-center',
    );
  });

  it('forwards className', () => {
    const { container } = render(<EmptyState title="Empty" className="min-h-64" />);
    expect(container.querySelector('[data-slot="empty-state"]')).toHaveClass('min-h-64');
  });
});
