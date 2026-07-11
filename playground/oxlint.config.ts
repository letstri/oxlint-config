import { oxlintConfig, tailwind } from '@letstri/oxc-config'

// react, nextjs and typescript plugins auto-enable from this package's deps.
export default oxlintConfig({
  ...tailwind({ entryPoint: 'app/globals.css' }),
})
