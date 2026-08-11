import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppWallpaper } from './AppWallpaper';

describe('AppWallpaper', () => {
  it('renders the pattern layer and the column mask, both hidden until desktop', () => {
    const { container } = render(<AppWallpaper />);
    const layers = container.querySelectorAll('[aria-hidden="true"]');
    expect(layers).toHaveLength(2);
    layers.forEach((layer) => {
      expect(layer).toHaveClass('hidden', 'md:block');
    });
  });

  it('renders the icon pattern behind the shell column mask', () => {
    const { container } = render(<AppWallpaper />);
    const [pattern, mask] = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(pattern).toHaveClass('-z-20');
    expect(mask).toHaveClass('-z-10', 'bg-background');
  });

  it('fills the pattern layer with icon tiles', () => {
    const { container } = render(<AppWallpaper />);
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
