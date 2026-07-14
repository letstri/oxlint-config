import { defu } from 'defu'
import { defineConfig } from 'oxfmt'

import { ignorePatterns } from './ignores.ts'

type OxfmtOptions = Parameters<typeof defineConfig>[0]

const baseConfig = defineConfig({
  printWidth: 100,
  singleQuote: true,
  semi: false,
  arrowParens: 'avoid',
  sortImports: true,
  quoteProps: 'consistent',
  ignorePatterns,
})

export function config(...configs: OxfmtOptions[]): OxfmtOptions {
  return defu({}, ...configs, baseConfig) as OxfmtOptions
}
