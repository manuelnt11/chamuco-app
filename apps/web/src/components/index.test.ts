import { describe, it, expect } from 'vitest';
import { Button, ThemeProvider, ThemeToggle } from './index';

describe('Component exports', () => {
  it('exports all components', () => {
    expect(Button).toBeDefined();
    expect(ThemeProvider).toBeDefined();
    expect(ThemeToggle).toBeDefined();
  });

  it('exports are not null', () => {
    expect(Button).not.toBeNull();
    expect(ThemeProvider).not.toBeNull();
    expect(ThemeToggle).not.toBeNull();
  });

  it('exports are valid React components', () => {
    // Button is a forwardRef component (object)
    expect(Button).toBeTruthy();
    // ThemeProvider and ThemeToggle are function components
    expect(typeof ThemeProvider).toBe('function');
    expect(typeof ThemeToggle).toBe('function');
  });
});
