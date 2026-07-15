import { defineConfig } from 'tsdown'

export default defineConfig({
  name: 'oxlint-config',
  entry: {
    index: './src/index.ts',
    cli: './src/cli/index.ts',
    oxfmt: './src/oxfmt.ts',
    tailwind: './src/plugins/tailwind.ts',
  },
  dts: {
    build: true,
  },
})
