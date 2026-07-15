/**
 * Minimal local shape of a render-runtime `Extension`, restricted to the
 * fields this app reads.
 *
 * Upstream (vtex.render-runtime@8.111.1) declares these as ambient globals in
 * `react/typings/global.d.ts` (`BlockInsertion` ~L64–75, `Extension.blocks`
 * ~L82), but that file is **not** shipped in the published `@types` tarball —
 * only module `.d.ts` files are. We mirror the shape locally instead.
 *
 * Maintenance note: `.blocks` / `extensionPointId` are an internal runtime
 * tree structure (used by `ExtensionPoint.getChildExtensions`), not a public
 * documented API. A future bump of `vtex.render-runtime` may change this
 * silently; if FAQ JSON-LD aggregation breaks after an upgrade, compare
 * against that tag's `global.d.ts` and `ExtensionPoint/index.tsx`.
 */
export interface BlockInsertion {
  extensionPointId: string
}

export interface ExtensionLike {
  props?: Record<string, unknown>
  content?: Record<string, unknown>
  blocks?: BlockInsertion[]
}

export type ExtensionsMap = Record<string, ExtensionLike | null | undefined>

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface FAQQuestion {
  '@type': 'Question'
  name: string
  acceptedAnswer: {
    '@type': 'Answer'
    text: string
  }
}

export interface FAQPage {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: FAQQuestion[]
}
