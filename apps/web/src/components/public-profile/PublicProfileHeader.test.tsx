import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ alt, fallback }: { alt?: string; fallback?: string }) => (
    <div data-testid="avatar" aria-label={alt}>
      {fallback}
    </div>
  ),
}));

import { PublicProfileHeader } from './PublicProfileHeader';

describe('PublicProfileHeader', () => {
  const baseProps = {
    displayName: 'John Smith',
    username: 'jsmith',
    avatarUrl: null,
    bio: null,
  };

  it('renders display name', () => {
    render(<PublicProfileHeader {...baseProps} />);
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('renders @username', () => {
    render(<PublicProfileHeader {...baseProps} />);
    expect(screen.getByText('@jsmith')).toBeInTheDocument();
  });

  it('renders bio when provided', () => {
    render(<PublicProfileHeader {...baseProps} bio="Avid traveler." />);
    expect(screen.getByText('Avid traveler.')).toBeInTheDocument();
  });

  it('does not render bio element when bio is null', () => {
    render(<PublicProfileHeader {...baseProps} bio={null} />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('passes avatarUrl to Avatar', () => {
    render(<PublicProfileHeader {...baseProps} avatarUrl="https://cdn.example.com/avatar.jpg" />);
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('passes initials as fallback to Avatar', () => {
    render(<PublicProfileHeader {...baseProps} displayName="John Smith" />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('JS');
  });

  it('handles single-word display name for initials', () => {
    render(<PublicProfileHeader {...baseProps} displayName="Madonna" />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('M');
  });
});
