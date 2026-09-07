// @ts-check
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/'],
  },
];
