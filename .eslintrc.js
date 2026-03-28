module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.next',
    'out',
    'coverage',
    '.turbo',
    '*.config.js',
    '*.config.ts',
    '.eslintrc.js',
  ],
  rules: {
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
  overrides: [
    // Packages: shared-types and shared-utils
    {
      files: ['packages/*/src/**/*.ts'],
      parserOptions: {
        project: './packages/*/tsconfig.json',
      },
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'warn',
      },
    },
  ],
};
