import { Children, isValidElement, ReactNode } from 'react'

import { ExtensionsMap, FAQItem, FAQPage } from '../typings/structuredData'

export const getBlockName = (extensionPointId: string): string =>
  extensionPointId.split('#')[0]

const getMergedExtensionProps = (
  extensions: ExtensionsMap,
  treePath: string
): Record<string, unknown> => {
  const extension = extensions[treePath]

  if (!extension) {
    return {}
  }

  return { ...extension.props, ...extension.content }
}

/**
 * Turns rich-text content into plain text suitable for FAQ JSON-LD.
 * VTEX `rich-text` stores Markdown in `props.text` (rendered later as HTML),
 * so both HTML tags and common Markdown must be stripped — otherwise markers
 * like `**bold**` leak into schema.org `name` / `text` fields.
 */
const stripMarkup = (text: string): string =>
  text
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[ \t]*[-*+]\s+/gm, '')
    .replace(/^[ \t]*\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Recursively walks `extensions[treePath].blocks`, the ordered list of
 * declared child block ids that `ExtensionPoint` itself uses to render
 * children (`getChildExtensions` in render-runtime). Using this list
 * (instead of scanning every key of `extensions`) guarantees:
 * - results follow real render order;
 * - only the relevant subtree is visited, not the whole page's extensions map.
 *
 * This depends on an internal runtime shape (see `BlockInsertion` /
 * `ExtensionLike` in `typings/structuredData.ts`). If a render-runtime
 * bump changes `.blocks`, revisit that note and the upstream types.
 *
 * Descendants whose block name (ignoring the `#alias` suffix) matches
 * `targetBlockName` are collected; matched nodes aren't traversed further,
 * since disclosure blocks aren't expected to nest another one of the same
 * kind inside themselves.
 */
export const findDescendantTreePathsByBlockName = (
  extensions: ExtensionsMap,
  parentTreePath: string,
  targetBlockName: string
): string[] => {
  const parentExtension = extensions[parentTreePath]
  const childBlocks = parentExtension?.blocks ?? []

  return childBlocks.reduce<string[]>((matches, { extensionPointId }) => {
    const childTreePath = `${parentTreePath}/${extensionPointId}`

    if (getBlockName(extensionPointId) === targetBlockName) {
      matches.push(childTreePath)
      return matches
    }

    matches.push(
      ...findDescendantTreePathsByBlockName(
        extensions,
        childTreePath,
        targetBlockName
      )
    )

    return matches
  }, [])
}

/**
 * Same lookup, but restricted to direct children only (does not cross
 * intermediate wrapper blocks). Used to find the `disclosure-ld-trigger`/
 * `disclosure-ld-content` that belong to a specific `disclosure-ld-layout`.
 */
export const findDirectChildTreePathByBlockName = (
  extensions: ExtensionsMap,
  parentTreePath: string,
  targetBlockName: string
): string | undefined => {
  const parentExtension = extensions[parentTreePath]
  const childBlocks = parentExtension?.blocks ?? []

  const match = childBlocks.find(
    ({ extensionPointId }) => getBlockName(extensionPointId) === targetBlockName
  )

  return match && `${parentTreePath}/${match.extensionPointId}`
}

export const findDescendantLayouts = (
  extensions: ExtensionsMap,
  groupTreePath: string
): string[] =>
  findDescendantTreePathsByBlockName(
    extensions,
    groupTreePath,
    'disclosure-ld-layout'
  )

/**
 * Collects plain text from a block subtree using data already resolved by
 * the render-runtime (`props`/`content`), never touching the DOM, so it
 * works during SSR. Handles `rich-text` (the main use case) and degrades
 * silently to an empty string for blocks that don't expose a `text` prop.
 * Markdown/HTML in `text` is stripped via `stripMarkup`.
 */
export const collectTextFromSubtree = (
  extensions: ExtensionsMap,
  rootTreePath: string
): string => {
  const extension = extensions[rootTreePath]

  if (!extension) {
    return ''
  }

  const ownProps = getMergedExtensionProps(extensions, rootTreePath)
  const parts: string[] = []

  if (typeof ownProps.text === 'string') {
    parts.push(stripMarkup(ownProps.text))
  }

  const childBlocks = extension.blocks ?? []

  childBlocks.forEach(({ extensionPointId }) => {
    const childText = collectTextFromSubtree(
      extensions,
      `${rootTreePath}/${extensionPointId}`
    )

    if (childText) {
      parts.push(childText)
    }
  })

  return parts.join(' ').trim()
}

/**
 * Fallback text extraction that walks a React node tree (never the DOM),
 * collecting string/number leaves. Used only when nothing could be
 * resolved via `extensions` (e.g. blocks rendered outside of the
 * render-runtime tree, such as directly in unit tests, or literal string
 * children). Never throws, regardless of what it's given.
 */
export const extractTextFromReactNode = (node: ReactNode): string => {
  try {
    if (node === null || node === undefined || typeof node === 'boolean') {
      return ''
    }

    if (typeof node === 'string') {
      return node.trim()
    }

    if (typeof node === 'number') {
      return String(node)
    }

    if (Array.isArray(node)) {
      return node
        .map(extractTextFromReactNode)
        .filter(Boolean)
        .join(' ')
        .trim()
    }

    if (isValidElement(node)) {
      const { children } = node.props as { children?: ReactNode }

      return extractTextFromReactNode(Children.toArray(children))
    }

    return ''
  } catch {
    return ''
  }
}

interface FallbackChildren {
  triggerChildren?: ReactNode
  contentChildren?: ReactNode
}

/**
 * Builds a single FAQ item (question/answer) for a `disclosure-ld-layout`,
 * given its treePath. Reads text from the render-runtime `extensions` map
 * (SSR-safe); if that yields nothing (e.g. no render-runtime context, as
 * in unit tests), falls back to extracting text straight from the React
 * children passed in `fallback`. Returns `null` when a question or an
 * answer can't be determined, so the item is silently omitted from the
 * JSON-LD instead of breaking anything.
 */
export const buildFAQItem = (
  extensions: ExtensionsMap,
  layoutTreePath: string,
  fallback?: FallbackChildren
): FAQItem | null => {
  const triggerTreePath = findDirectChildTreePathByBlockName(
    extensions,
    layoutTreePath,
    'disclosure-ld-trigger'
  )

  const contentTreePath = findDirectChildTreePathByBlockName(
    extensions,
    layoutTreePath,
    'disclosure-ld-content'
  )

  let question = triggerTreePath
    ? collectTextFromSubtree(extensions, triggerTreePath)
    : ''

  let answer = contentTreePath
    ? collectTextFromSubtree(extensions, contentTreePath)
    : ''

  if (!question && fallback?.triggerChildren !== undefined) {
    question = extractTextFromReactNode(fallback.triggerChildren)
  }

  if (!answer && fallback?.contentChildren !== undefined) {
    answer = extractTextFromReactNode(fallback.contentChildren)
  }

  if (!question || !answer) {
    return null
  }

  return { id: layoutTreePath, question, answer }
}

export const buildFAQPage = (items: FAQItem[]): FAQPage | null => {
  if (items.length === 0) {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }
}
