import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserAvatar } from './UserAvatar';

describe('UserAvatar', () => {
  it('renders as a button', () => {
    render(<UserAvatar />);
    const button = screen.getByRole('button', { name: /user menu/i });
    expect(button).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<UserAvatar />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'User menu');
    expect(button).toHaveAttribute('title', 'User menu');
  });

  it('has hover styling', () => {
    render(<UserAvatar />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-gray-100', 'dark:hover:bg-gray-800');
  });

  it('contains UserCircleIcon', () => {
    const { container } = render(<UserAvatar />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-8', 'w-8');
  });
});
