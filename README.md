# Oxlint and Oxfmt configs

Opinionated, shared [oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [oxfmt](https://oxc.rs) config, in the spirit of [@antfu/eslint-config](https://github.com/antfu/eslint-config).

## Install

```bash
npm i -D @letstri/oxlint-config oxlint oxfmt
```

Scaffold the configs and editor settings:

```bash
npx oxlint-config init
```

`init` prompts for what to set up. Flags skip the prompt (`--oxlint`, `--oxfmt`,
`--tailwind`, `--vscode`, `--zed`); with no flags in a non-interactive shell it
sets up everything. Existing config files are kept unless you pass `--force`;
editor settings are deep-merged into your current ones.

If `oxlint`, `oxfmt` (or `oxlint-tailwindcss`, when you add Tailwind) are missing
from the project, `init` offers to install them with your package manager
(detected from the lockfile). `--tailwind` scaffolds the oxlint config with
`tailwindConfig()` and asks for your Tailwind entry CSS path.

### Editor extensions

The CLI writes the settings, but the extension providing the language servers
must be installed in the editor.

- **VS Code** — [`oxc.oxc-vscode`](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode).
  The CLI adds it to `.vscode/extensions.json`, so VS Code prompts you.
- **Zed** — the [Oxc](https://github.com/oxc-project/oxc-zed) extension, from
  `zed: extensions`. Zed has no `extensions.json`, so this is manual: the
  `.zed/settings.json` the CLI writes points at language servers that don't exist
  until it's installed. Needs Zed >= `v0.205.0`, oxlint >= `v1.35.0`.

## Usage

`oxlint.config.ts`:

```ts
import { config } from '@letstri/oxlint-config'

export default config()
```

`oxfmt.config.ts` — from the `/oxfmt` subpath:

```ts
import { config } from '@letstri/oxlint-config/oxfmt'

export default config()
```

### Plugins

Plugins are enabled by detecting dependencies in the nearest `package.json`:

| Dependency   | Plugins enabled     |
| ------------ | ------------------- |
| `typescript` | `typescript`        |
| `react`      | `react`, `jsx-a11y` |
| `vue`        | `vue`               |
| `next`       | `nextjs`            |
| `vitest`     | `vitest`            |
| `jest`       | `jest`              |

Only the **nearest** `package.json` is read. If a dependency lives elsewhere —
say a nested workspace like `apps/web/package.json` — enable its plugin manually:

```ts
export default config({ plugins: ['vue'] })
```

### Overrides

Both `config` functions take any number of config objects, deep-merged over the
base via [defu](https://github.com/unjs/defu). Arrays are concatenated, so
plugins from different pieces combine instead of overwriting:

```ts
export default config({ rules: { 'no-console': 'off' } }, { plugins: ['vue'] })
```

### Tailwind

`tailwindConfig()` returns a config chunk for
[`oxlint-tailwindcss`](https://github.com/sergioazoc/oxlint-tailwindcss) (Tailwind v4).
It ships from the `/tailwind` subpath — pass it to `config`:

```ts
import { config } from '@letstri/oxlint-config'
import { tailwindConfig } from '@letstri/oxlint-config/tailwind'

export default config(tailwindConfig({ entryPoint: 'app/globals.css' }))
```

`oxlint-tailwindcss` is an **optional peer dependency** — install it yourself
(`pnpm add -D oxlint-tailwindcss`); `tailwindConfig()` throws if it's missing.

Options:

- `entryPoint` (required) — your Tailwind entry CSS, so the plugin can resolve
  class names. In a monorepo, pass glob → CSS mappings; the last match wins, so
  end with a `'**'` catch-all:

  ```ts
  tailwindConfig({
    entryPoint: [
      { files: 'packages/ui/**', use: 'packages/ui/src/styles.css' },
      { files: '**', use: 'src/global.css' },
    ],
  })
  ```

- `ignoreClasses` — class names to exempt from `no-unknown-classes`, e.g. ones a
  component library generates:

  ```ts
  tailwindConfig({ entryPoint: 'app/globals.css', ignoreClasses: ['toaster'] })
  ```
