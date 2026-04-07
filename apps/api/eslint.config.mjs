import rootConfig from '../../eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...rootConfig,

  // API-specific configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        // Jest globals
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
    rules: {
      // API-specific overrides
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/interface-name-prefix': 'off',
    },
  },

  // Test files — disable return-type requirement for helper functions and mock callbacks
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
