import { defu } from 'defu'
import { defineConfig as defineOxfmtConfig } from 'oxfmt'

type OxfmtOptions = Parameters<typeof defineOxfmtConfig>[0]

const baseOxfmtConfig = defineOxfmtConfig({
  singleQuote: true,
  semi: false,
  arrowParens: 'avoid',
  sortImports: true,
  quoteProps: 'consistent',
})

/**
 * Build an oxfmt config. Pass any number of config objects; they are deep-merged
 * over the base config via defu.
 */
export function oxfmtConfig(...overrides: OxfmtOptions[]): OxfmtOptions {
  return defu({}, ...overrides, baseOxfmtConfig) as OxfmtOptions
}
