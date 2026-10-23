import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      semi: ['error', 'never'],
      quotes: ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'next-env.d.ts', 'src/lib/types/database.ts']),
])

export default eslintConfig
