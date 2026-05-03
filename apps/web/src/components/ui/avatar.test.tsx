import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Base UI's AvatarImage never mounts in JSDOM (image onLoad never fires).
// Stub the primitives so the <img> is always rendered for prop assertions.
vi.mock('@base-ui/react/avatar', () => ({
  Avatar: {
    Root: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    Image: ({ src, alt, className, referrerPolicy }: React.ComponentProps<'img'>) => (
      <img src={src} alt={alt} className={className} referrerPolicy={referrerPolicy} />
    ),
    Fallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  },
}));

import { Avatar } from './avatar';

describe('Avatar', () => {
  it('renders with fallback text', () => {
    render(<Avatar fallback="MN" />);
    expect(screen.getByText('MN')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    const { container } = render(<Avatar fallback="MN" />);
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument();
  });

  it('applies rounded-full shape', () => {
    const { container } = render(<Avatar fallback="MN" />);
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('rounded-full');
  });

  it('applies md size by default', () => {
    const { container } = render(<Avatar fallback="MN" />);
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('size-10');
  });

  it('applies sm size', () => {
    const { container } = render(<Avatar size="sm" fallback="MN" />);
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('size-8');
  });

  it('applies lg size', () => {
    const { container } = render(<Avatar size="lg" fallback="MN" />);
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('size-12');
  });

  it('renders the avatar root when src is provided', () => {
    // Note: in JSDOM images never fire onLoad, so AvatarImage stays unmounted.
    // The fallback uses a 300ms delay to avoid flash-of-fallback while image loads.
    const { container } = render(<Avatar src="/avatar.jpg" alt="User" fallback="U" />);
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument();
  });

  it('sets referrerPolicy="no-referrer" on the image to share the browser cache with other instances', () => {
    const { container } = render(<Avatar src="/avatar.jpg" alt="User" fallback="U" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('renders fallback when no src is provided', () => {
    render(<Avatar fallback="AB" />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('forwards className', () => {
    const { container } = render(<Avatar className="ring-2" fallback="MN" />);
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('ring-2');
  });
});
