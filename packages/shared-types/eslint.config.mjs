import rootConfig from '../../eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...rootConfig,

  // Shared types package - strict typing
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // Within this package all relative imports are intra-package by definition;
      // the root no-restricted-imports rule (which targets cross-package upward paths) does not apply here.
      'no-restricted-imports': 'off',
    },
  },
];
