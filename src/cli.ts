#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

import { boolean, command, run } from '@drizzle-team/brocli'
import { createDefu } from 'defu'
import { parse as parseJsonc } from 'jsonc-parser'

import { vscodeExtensions, vscodeSettings, zedSettings } from './editors.ts'

/**
 * Like defu, but arrays are merged as a de-duplicated union instead of being
 * concatenated — keeps updates idempotent and preserves user-added entries.
 */
const mergeConfig = createDefu((obj, key, value) => {
  const current = (obj as Record<PropertyKey, unknown>)[key]
  if (Array.isArray(current) && Array.isArray(value)) {
    const seen = new Set<string>()
    ;(obj as Record<PropertyKey, unknown>)[key] = [...value, ...current].filter(item => {
      const id = JSON.stringify(item)
      if (seen.has(id)) {
        return false
      }
      seen.add(id)
      return true
    })
    return true
  }
  return false
})

function readJsonc(path: string): Record<string, unknown> {
  if (!existsSync(path)) {
    return {}
  }
  const parsed = parseJsonc(readFileSync(path, 'utf-8'), [], { allowTrailingComma: true })
  return (parsed ?? {}) as Record<string, unknown>
}

/** Deep-merge `base` into the JSON(C) file at `path`, creating it if absent. */
function mergeJsonFile(path: string, base: object): 'created' | 'updated' {
  const existed = existsSync(path)
  const merged = mergeConfig(base, readJsonc(path))
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(merged, null, 2)}\n`)
  return existed ? 'updated' : 'created'
}

/** Write `content` to `path`, skipping an existing file unless `force`. */
function writeFile(
  path: string,
  content: string,
  force: boolean,
): 'created' | 'overwritten' | 'skipped' {
  const existed = existsSync(path)
  if (existed && !force) {
    return 'skipped'
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
  return existed ? 'overwritten' : 'created'
}

const OXLINT_CONFIG = `import { oxlintConfig } from '@letstri/oxc-config'

export default oxlintConfig()
`

const OXFMT_CONFIG = `import { oxfmtConfig } from '@letstri/oxc-config'

export default oxfmtConfig()
`

function version(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as {
      version?: string
    }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const config = command({
  name: 'config',
  desc: 'Create oxlint.config.ts and oxfmt.config.ts',
  options: {
    force: boolean().alias('f').desc('Overwrite existing files').default(false),
  },
  handler: ({ force }) => {
    const cwd = process.cwd()
    const lint = writeFile(resolve(cwd, 'oxlint.config.ts'), OXLINT_CONFIG, force)
    const fmt = writeFile(resolve(cwd, 'oxfmt.config.ts'), OXFMT_CONFIG, force)
    process.stdout.write(`config: ${lint} oxlint.config.ts, ${fmt} oxfmt.config.ts\n`)
  },
})

const editors = command({
  name: 'editors',
  desc: 'Write/update VS Code and Zed editor configs (deep-merged into existing files)',
  options: {
    vscode: boolean().desc('Only VS Code').default(false),
    zed: boolean().desc('Only Zed').default(false),
  },
  handler: ({ vscode, zed }) => {
    const both = !vscode && !zed
    const cwd = process.cwd()

    if (both || vscode) {
      const s = mergeJsonFile(resolve(cwd, '.vscode/settings.json'), vscodeSettings)
      const e = mergeJsonFile(resolve(cwd, '.vscode/extensions.json'), vscodeExtensions)
      process.stdout.write(`vscode: ${s} .vscode/settings.json, ${e} .vscode/extensions.json\n`)
    }

    if (both || zed) {
      const s = mergeJsonFile(resolve(cwd, '.zed/settings.json'), zedSettings)
      process.stdout.write(`zed: ${s} .zed/settings.json\n`)
    }
  },
})

run([config, editors], {
  name: 'oxc-config',
  description: 'Set up @letstri/oxc-config in your project',
  version: version(),
})
