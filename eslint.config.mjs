import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Ignore patterns (equivalent to old ignorePatterns)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/out/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/eslint.config.mjs',
    ],
  },

  // Base TypeScript configuration (backend/Node.js)
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['apps/web/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        // ES2022 globals
        Promise: 'readonly',
        Symbol: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Import rules - enforce path aliases, block relative upward imports
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', './**/..'],
              message:
                'Relative upward imports are not allowed. Use path aliases: @/* for local imports, @chamuco/* for cross-package imports.',
            },
          ],
        },
      ],

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },

  // Frontend (apps/web) - browser globals
  {
    files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        // Node.js globals (still needed for process.env, etc.)
        console: 'readonly',
        process: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // ES2022 globals
        Promise: 'readonly',
        Symbol: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
      },
    },
  },

  // Packages: shared-types and shared-utils - require explicit return types
  {
    files: ['packages/*/src/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },

  // Test files - Jest globals
  // Note: '**/test/**/*.ts' is required because '**/*.spec.ts' does not reliably
  // match files inside test/ directories when ESLint is invoked from the repo root
  // via lint-staged (e.g. apps/api/test/auth.e2e-spec.ts).
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
    ignores: ['apps/web/**'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  },
];
