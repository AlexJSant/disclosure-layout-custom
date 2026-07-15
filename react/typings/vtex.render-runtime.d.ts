import { ComponentType, ReactNode } from 'react'

/**
 * The published typings for `vtex.render-runtime@8.111.1` don't export
 * `useTreePath`/`Helmet` from the package root, even though the actual
 * runtime does (see react/core/main.tsx in vtex-apps/render-runtime).
 * This augmentation only adds type information for consumption in this
 * app; it doesn't change or duplicate anything at runtime.
 */
declare module 'vtex.render-runtime' {
  export function useTreePath(): { treePath: string }

  export const Helmet: ComponentType<{ children?: ReactNode }>
}
