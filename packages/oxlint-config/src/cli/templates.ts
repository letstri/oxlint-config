export function oxlintTemplate(entryPoint?: string): string {
  if (entryPoint === undefined) {
    return `import { config } from '@letstri/oxlint-config'\n\nexport default config()\n`
  }
  return (
    `import { config } from '@letstri/oxlint-config'\n` +
    `import { tailwindConfig } from '@letstri/oxlint-config/tailwind'\n\n` +
    `export default config(\n  tailwindConfig({ entryPoint: '${entryPoint}' }),\n)\n`
  )
}

export const oxfmtTemplate = `import { config } from '@letstri/oxlint-config/oxfmt'\n\nexport default config()\n`
