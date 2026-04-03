import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';

// Mock the Logo component
vi.mock('./Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

// Mock the UserAvatar component
vi.mock('./UserAvatar', () => ({
  UserAvatar: () => <button data-testid="user-avatar">User Avatar</button>,
}));

// Mock the ThemeToggle component
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

// Mock the LanguageToggle component
vi.mock('@/components/LanguageToggle', () => ({
  LanguageToggle: () => <button data-testid="language-toggle">Language Toggle</button>,
}));

describe('Header', () => {
  it('renders as a header element', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('has fixed positioning and correct z-index', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
  });

  it('has correct height', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('h-16');
  });

  it('has border styling', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('border-b', 'border-border');
  });

  it('renders Logo component', () => {
    render(<Header />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('renders UserAvatar component', () => {
    render(<Header />);
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('renders LanguageToggle component', () => {
    render(<Header />);
    expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
  });

  it('renders ThemeToggle component', () => {
    render(<Header />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('has correct layout structure', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    const layoutDiv = header?.firstChild;
    expect(layoutDiv).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('groups right-side controls together', () => {
    const { container } = render(<Header />);
    const rightControls = container.querySelector('.gap-2');
    expect(rightControls).toBeInTheDocument();
    expect(rightControls).toHaveClass('flex', 'items-center');
  });
});
