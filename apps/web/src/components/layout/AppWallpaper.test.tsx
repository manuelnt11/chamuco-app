import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { AppWallpaper } from './AppWallpaper';

function setViewport(width: number, height: number) {
  window.innerWidth = width;
  window.innerHeight = height;
}

describe('AppWallpaper', () => {
  afterEach(() => {
    setViewport(1024, 768);
  });

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

  it('fills the pattern layer with enough tiles to cover the viewport', async () => {
    setViewport(1440, 900);
    const { container } = render(<AppWallpaper />);
    await waitFor(() => {
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    });
  });

  it('renders no tiles below the desktop breakpoint', async () => {
    setViewport(500, 900);
    const { container } = render(<AppWallpaper />);
    await waitFor(() => {
      expect(container.querySelectorAll('svg').length).toBe(0);
    });
  });

  it('recomputes tile count on resize', async () => {
    setViewport(1024, 768);
    const { container } = render(<AppWallpaper />);
    await waitFor(() => expect(container.querySelectorAll('svg').length).toBeGreaterThan(0));
    const initialCount = container.querySelectorAll('svg').length;

    setViewport(3840, 2160);
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(initialCount);
    });
  });

  it('cleans up the resize listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<AppWallpaper />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeSpy.mockRestore();
  });
});
