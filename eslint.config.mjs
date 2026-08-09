import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import vitest from '@vitest/eslint-plugin'
import playwright from 'eslint-plugin-playwright'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ...vitest.configs.recommended,
    files: ['tests/**/*.{unit,component,integration}.test.{ts,tsx}'],
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/e2e/**/*.e2e.test.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/no-wait-for-timeout': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: [
      '.next/',
      'artifacts/',
      'public/mockServiceWorker.js',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
    ],
  },
]

export default eslintConfig
