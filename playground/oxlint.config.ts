import { oxlintConfig, tailwindPlugin } from '@letstri/oxc-config'

// react, nextjs and typescript plugins auto-enable from this package's deps.
export default oxlintConfig(tailwindPlugin({ entryPoint: 'app/globals.css' }))
