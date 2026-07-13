# oxc-config

Monorepo for shared [oxlint](https://oxc.rs/docs/guide/usage/linter.html) +
[oxfmt](https://oxc.rs) configs, in the spirit of
[@antfu/eslint-config](https://github.com/antfu/eslint-config).

## Packages

| Package                                      | Description                                                         |
| -------------------------------------------- | ------------------------------------------------------------------- |
| [`@letstri/oxc-config`](packages/oxc-config) | Opinionated oxlint + oxfmt config with plugin auto-detection + CLI. |

## Development

pnpm workspace. `packages/*` are published; `playground/` is a Next.js app that
dogfoods the config.

```bash
pnpm install
pnpm build          # build every package (topological order)
pnpm check          # lint + check-types + format:check, in parallel
```

See [AGENTS.md](AGENTS.md) for repo conventions.
