const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    'prettier/prettier': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: ['node_modules/', '.next/', 'dist/', 'coverage/'],
})