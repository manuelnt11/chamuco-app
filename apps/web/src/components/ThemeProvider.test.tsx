import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from './ThemeProvider';

const mockThemeProvider = vi.fn(({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
));

vi.mock('next-themes', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ThemeProvider: (props: any) => mockThemeProvider(props),
}));

describe('ThemeProvider', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="test-theme">
        <div>Test Content</div>
      </ThemeProvider>,
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('passes props to NextThemesProvider', () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        storageKey="custom-key"
      >
        <div>Test</div>
      </ThemeProvider>,
    );

    expect(mockThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        attribute: 'class',
        defaultTheme: 'dark',
        enableSystem: false,
        storageKey: 'custom-key',
      }),
    );
  });

  it('forwards additional props to NextThemesProvider', () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="theme"
        disableTransitionOnChange
        enableColorScheme
      >
        <div>Test</div>
      </ThemeProvider>,
    );

    expect(mockThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        disableTransitionOnChange: true,
        enableColorScheme: true,
      }),
    );
  });

  it('renders with minimal props', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Minimal Test</div>
      </ThemeProvider>,
    );

    expect(getByText('Minimal Test')).toBeInTheDocument();
  });

  it('handles multiple children', () => {
    const { getByText } = render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ThemeProvider>,
    );

    expect(getByText('Child 1')).toBeInTheDocument();
    expect(getByText('Child 2')).toBeInTheDocument();
    expect(getByText('Child 3')).toBeInTheDocument();
  });
});
