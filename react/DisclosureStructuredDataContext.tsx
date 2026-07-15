import { createContext, useContext } from 'react'

/**
 * Boolean marker provided by `disclosure-ld-layout-group` when it has
 * `generateStructuredData` enabled. It tells descendant `disclosure-ld-layout`
 * blocks that the group has already taken over the responsibility of
 * generating a single aggregated FAQPage script, so they must not render
 * one of their own.
 *
 * This is intentionally *not* a registration channel (no callbacks, no
 * shared state): the group computes the aggregated FAQPage itself, during
 * its own render, by reading `disclosure-ld-layout` descendants straight from
 * `extensions` (see react/utils/structuredData.ts). That keeps the whole
 * computation synchronous and SSR-safe, with no risk of update loops or
 * "ghost" items left behind after a child unmounts.
 */
const DisclosureStructuredDataContext = createContext<boolean>(false)

export const DisclosureStructuredDataProvider =
  DisclosureStructuredDataContext.Provider

export const useInsideStructuredDataGroup = (): boolean =>
  useContext(DisclosureStructuredDataContext)

export default DisclosureStructuredDataContext
