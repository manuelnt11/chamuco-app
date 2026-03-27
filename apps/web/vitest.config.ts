import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // TODO: Remove the @ts-expect-error once the Vite version mismatch between vitest and @vitejs/plugin-react is resolved. See
  // @ts-expect-error - Vite version mismatch between vitest and @vitejs/plugin-react
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'coverage', 'test/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/app/**', // Next.js App Router files are integration-tested
        'src/types/**', // Type definitions don't need coverage
        'src/lib/i18n.ts', // i18n config is integration-tested
        'src/locales/**', // Translation files don't need coverage
        '.next/',
        'dist/',
        'coverage/',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
