import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders the logo icon', () => {
    render(<Logo />);
    const images = document.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAttribute('src', '/logo-icon.svg');
  });

  it('renders logo text', () => {
    render(<Logo />);
    expect(screen.getByText('CHAMUCO')).toBeInTheDocument();
    expect(screen.getByText('TRAVEL')).toBeInTheDocument();
  });

  it('renders as a link to home page', () => {
    render(<Logo />);
    const link = screen.getByRole('link', { name: /chamuco travel home/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('has hover effect styling', () => {
    render(<Logo />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('hover:opacity-80');
  });

  it('has accessible label', () => {
    render(<Logo />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'Chamuco Travel home');
  });
});
