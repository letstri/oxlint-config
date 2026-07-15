#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import process from 'node:process'

import { cancel, confirm, isCancel, isCI, multiselect, text } from '@clack/prompts'
import { createDefu } from 'defu'
import { parse as parseJsonc } from 'jsonc-parser'
import { addDevDependency, detectPackageManager } from 'nypm'

import { vscodeExtensions, vscodeSettings, zedSettings } from '../editors.ts'
import { getInstalledPackages } from '../utils.ts'
import { oxfmtTemplate, oxlintTemplate } from './templates.ts'

const log = (message: string) => process.stdout.write(`${message}\n`)

const merge = createDefu((obj, key, value) => {
  const current = (obj as Record<PropertyKey, unknown>)[key]
  if (Array.isArray(current) && Array.isArray(value)) {
    const union = [...value, ...current].map(item => JSON.stringify(item))
    ;(obj as Record<PropertyKey, unknown>)[key] = [...new Set(union)].map(item => JSON.parse(item))
    return true
  }
  return false
})

function mergeJson(path: string, base: object): string {
  const existed = existsSync(path)
  const current = existed
    ? parseJsonc(readFileSync(path, 'utf-8'), [], { allowTrailingComma: true })
    : {}
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(merge(base, current ?? {}), null, 2)}\n`)
  return existed ? 'updated' : 'created'
}

function writeConfig(path: string, content: string, force: boolean): string {
  const existed = existsSync(path)
  if (existed && !force) {
    return 'skipped'
  }
  writeFileSync(path, content)
  return existed ? 'overwritten' : 'created'
}

type Target = 'oxlint' | 'oxfmt' | 'vscode' | 'zed'

const LABELS: Record<Target, string> = {
  oxlint: 'oxlint.config.ts',
  oxfmt: 'oxfmt.config.ts',
  vscode: 'VS Code settings (.vscode)',
  zed: 'Zed settings (.zed)',
}

const ALL = Object.keys(LABELS) as Target[]

async function pickTargets(flags: Set<string>, interactive: boolean): Promise<Target[] | null> {
  const flagged = ALL.filter(target => flags.has(`--${target}`))
  if (flagged.length > 0) {
    return flagged
  }
  if (!interactive) {
    return ALL
  }
  const selected = await multiselect<Target>({
    message: 'What do you want to set up?',
    options: ALL.map(value => ({ value, label: LABELS[value] })),
    initialValues: ALL,
    required: true,
  })
  if (isCancel(selected)) {
    cancel('Cancelled.')
    return null
  }
  return selected
}

const DEFAULT_ENTRY_POINT = 'src/global.css'

async function pickTailwind(
  flags: Set<string>,
  interactive: boolean,
): Promise<{ entryPoint: string } | false | null> {
  if (!flags.has('--tailwind') && !interactive) {
    return false
  }
  if (!flags.has('--tailwind')) {
    const enable = await confirm({
      message: 'Add Tailwind linting (oxlint-tailwindcss)?',
      initialValue: false,
    })
    if (isCancel(enable)) {
      cancel('Cancelled.')
      return null
    }
    if (!enable) {
      return false
    }
  }
  if (!interactive) {
    return { entryPoint: DEFAULT_ENTRY_POINT }
  }
  const entryPoint = await text({
    message: 'Path to your Tailwind entry CSS',
    placeholder: DEFAULT_ENTRY_POINT,
    defaultValue: DEFAULT_ENTRY_POINT,
  })
  if (isCancel(entryPoint)) {
    cancel('Cancelled.')
    return null
  }
  return { entryPoint: entryPoint || DEFAULT_ENTRY_POINT }
}

async function ensureDeps(deps: string[], interactive: boolean): Promise<void> {
  const cwd = process.cwd()
  const installed = getInstalledPackages(cwd)
  const missing = deps.filter(dep => !installed.has(dep))
  if (missing.length === 0) {
    return
  }
  const pm = await detectPackageManager(cwd).catch(() => undefined)
  const hint = `${pm?.name ?? 'npm'} install -D ${missing.join(' ')}`

  if (!interactive) {
    log(`Missing dependencies: ${missing.join(', ')}. Install with:\n  ${hint}`)
    return
  }
  const install = await confirm({
    message: `Install missing dependencies${pm ? ` with ${pm.name}` : ''}?\n  ${missing.join(', ')}`,
    initialValue: true,
  })
  if (isCancel(install)) {
    cancel('Cancelled.')
    process.exit(0)
  }
  if (!install) {
    log(`Skipped. Install them yourself:\n  ${hint}`)
    return
  }
  try {
    await addDevDependency(missing, { cwd })
  } catch {
    log(`Install failed. Run it yourself:\n  ${hint}`)
  }
}

function version(): string {
  const url = new URL('../package.json', import.meta.url)
  return (JSON.parse(readFileSync(url, 'utf-8')) as { version: string }).version
}

const HELP = `oxlint-config — set up @letstri/oxlint-config in your project

Usage:
  oxlint-config [flags]

Flags (default: prompt for what to set up):
  --oxlint       create oxlint.config.ts
  --oxfmt        create oxfmt.config.ts
  --tailwind     include Tailwind linting in oxlint.config.ts
  --vscode       write .vscode settings
  --zed          write .zed settings
  -f, --force    overwrite existing config files
  -h, --help     show this help
  -v, --version  show version`

const argv = process.argv.slice(2)

if (argv.includes('--help') || argv.includes('-h')) {
  log(HELP)
} else if (argv.includes('--version') || argv.includes('-v')) {
  log(version())
} else {
  const flags = new Set(argv)
  const force = flags.has('--force') || flags.has('-f')
  const interactive = !isCI() && Boolean(process.stdout.isTTY)

  const targets = await pickTargets(flags, interactive)
  if (targets !== null) {
    const wantsOxlint = targets.includes('oxlint') || flags.has('--tailwind')
    const tailwind = wantsOxlint ? await pickTailwind(flags, interactive) : false

    if (tailwind !== null) {
      const entryPoint = tailwind ? tailwind.entryPoint : undefined

      const deps = ['@letstri/oxlint-config', 'oxlint', 'oxfmt']
      if (tailwind) {
        deps.push('oxlint-tailwindcss')
      }
      await ensureDeps(deps, interactive)

      const run: Record<Target, () => string> = {
        oxlint: () =>
          `oxlint: ${writeConfig('oxlint.config.ts', oxlintTemplate(entryPoint), force)}`,
        oxfmt: () => `oxfmt: ${writeConfig('oxfmt.config.ts', oxfmtTemplate, force)}`,
        vscode: () =>
          `vscode: ${mergeJson('.vscode/settings.json', vscodeSettings)} settings, ` +
          `${mergeJson('.vscode/extensions.json', vscodeExtensions)} extensions`,
        zed: () => `zed: ${mergeJson('.zed/settings.json', zedSettings)}`,
      }

      const chosen = tailwind && !targets.includes('oxlint') ? ['oxlint', ...targets] : targets
      for (const target of chosen as Target[]) {
        log(run[target]())
      }
    }
  }
}
