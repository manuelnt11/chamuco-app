import rootConfig from '../../eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...rootConfig,

  // Shared utils package - strict typing
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
