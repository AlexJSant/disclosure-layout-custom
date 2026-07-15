import React, { useMemo } from 'react'
import {
  DisclosureLayoutGroup,
  DisclosureLayoutGroupProps,
} from '@vtex/disclosure'
import { useRuntime, useTreePath } from 'vtex.render-runtime'

import FAQJsonLd from './FAQJsonLd'
import { DisclosureStructuredDataProvider } from './DisclosureStructuredDataContext'
import { BlockComponent } from './typings/block'
import { ExtensionsMap } from './typings/structuredData'
import {
  buildFAQItem,
  buildFAQPage,
  findDescendantLayouts,
} from './utils/structuredData'

interface Props extends DisclosureLayoutGroupProps {
  /**
   * When `true`, aggregates the question/answer of every `disclosure-ld-layout`
   * descendant (even across intermediate wrapper blocks) into a single
   * FAQPage (schema.org) `<script type="application/ld+json">`, rendered
   * once by the group. Defaults to `false` (no script, no extra
   * processing).
   *
   * This prevails over each individual `disclosure-ld-layout`'s own
   * `generateStructuredData` prop: once the group has this enabled, no
   * descendant `disclosure-ld-layout` renders a script of its own, even if
   * its individual prop is `true`.
   */
  generateStructuredData?: boolean
}

const Group: BlockComponent<Props> = ({
  maxVisible,
  generateStructuredData = false,
  children,
}) => {
  const { extensions } = useRuntime()
  const { treePath } = useTreePath()

  const faqPage = useMemo(() => {
    if (!generateStructuredData) {
      return null
    }

    const typedExtensions = extensions as ExtensionsMap
    const layoutTreePaths = findDescendantLayouts(typedExtensions, treePath)

    const items = layoutTreePaths
      .map((layoutTreePath) => buildFAQItem(typedExtensions, layoutTreePath))
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return buildFAQPage(items)
  }, [generateStructuredData, extensions, treePath])

  const content = (
    <DisclosureLayoutGroup maxVisible={maxVisible}>
      {children}
    </DisclosureLayoutGroup>
  )

  if (!generateStructuredData) {
    return content
  }

  return (
    <DisclosureStructuredDataProvider value>
      {content}
      {faqPage && <FAQJsonLd data={faqPage} />}
    </DisclosureStructuredDataProvider>
  )
}

Group.displayName = 'DisclosureLayoutGroup'

Group.schema = {
  title: 'Disclosure Layout Group',
  type: 'object',
  properties: {
    maxVisible: {
      title: 'Max visible',
      description:
        'Defines how many disclosure-ld-layout blocks should be displayed at a time.',
      type: 'string',
      enum: ['one', 'many'],
      default: 'one',
    },
    generateStructuredData: {
      title: 'Generate structured data (FAQPage)',
      description:
        'When enabled, renders a single schema.org FAQPage JSON-LD script aggregating every disclosure-ld-layout descendant. Prevails over each individual disclosure-ld-layout generateStructuredData prop.',
      type: 'boolean',
      default: false,
    },
  },
}

export default Group
