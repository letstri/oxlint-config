import { defineConfig } from 'tsdown'

export default defineConfig({
  name: 'oxc-config',
  entry: ['./src/index.ts'],
  dts: {
    build: true,
  },
})
