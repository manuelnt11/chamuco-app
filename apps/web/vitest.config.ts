import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // @ts-expect-error - @vitejs/plugin-react@6 declares peer dep vite ^8.0.0 but project uses vite 6.x; functionally compatible
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
        'src/components/ui/**', // shadcn/ui components (third-party, battle-tested)
        'src/components/ServiceWorkerRegistration.tsx', // Service Worker registration (browser API, no unit tests)
        'public/**', // Service Worker and static assets (not unit-testable)
        'scripts/**', // Build scripts (not unit-testable)
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
      '@chamuco/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@chamuco/shared-utils': path.resolve(__dirname, '../../packages/shared-utils/src'),
    },
  },
});
