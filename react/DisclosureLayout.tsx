import React, {
  Children,
  ComponentType,
  isValidElement,
  ReactElement,
  ReactNode,
  useMemo,
} from 'react'
import { DisclosureLayout, DisclosureLayoutProps } from '@vtex/disclosure'
import { useRuntime, useTreePath } from 'vtex.render-runtime'

import DisclosureContent from './DisclosureContent'
import DisclosureTrigger from './DisclosureTrigger'
import FAQJsonLd from './FAQJsonLd'
import { useInsideStructuredDataGroup } from './DisclosureStructuredDataContext'
import { BlockComponent } from './typings/block'
import { ExtensionsMap } from './typings/structuredData'
import { buildFAQItem, buildFAQPage } from './utils/structuredData'

interface Props extends DisclosureLayoutProps {
  /**
   * When `true`, this `disclosure-ld-layout` renders its own FAQPage
   * (schema.org) `<script type="application/ld+json">` with a single
   * question/answer entry, taken from its `disclosure-ld-trigger`/
   * `disclosure-ld-content` children. Defaults to `false` (no script, no
   * extra processing).
   *
   * Ignored when this block is inside a `disclosure-ld-layout-group` that
   * has `generateStructuredData` enabled: in that case the group already
   * generates a single aggregated script for all its `disclosure-ld-layout`
   * children, so this block never renders one of its own.
   */
  generateStructuredData?: boolean
}

const findChildByComponent = (
  children: ReactNode,
  Component: ComponentType<any>
): ReactElement | undefined =>
  Children.toArray(children).find(
    (child): child is ReactElement =>
      isValidElement(child) && child.type === Component
  )

const Layout: BlockComponent<Props> = ({
  initialVisibility,
  animated,
  generateStructuredData = false,
  children,
}) => {
  const insideStructuredDataGroup = useInsideStructuredDataGroup()
  const shouldGenerateOwnScript =
    generateStructuredData && !insideStructuredDataGroup

  const { extensions } = useRuntime()
  const { treePath } = useTreePath()

  const faqPage = useMemo(() => {
    if (!shouldGenerateOwnScript) {
      return null
    }

    const triggerElement = findChildByComponent(children, DisclosureTrigger)
    const contentElement = findChildByComponent(children, DisclosureContent)

    const item = buildFAQItem(extensions as ExtensionsMap, treePath, {
      triggerChildren: triggerElement?.props.children,
      contentChildren: contentElement?.props.children,
    })

    return item && buildFAQPage([item])
  }, [shouldGenerateOwnScript, extensions, treePath, children])

  return (
    <DisclosureLayout initialVisibility={initialVisibility} animated={animated}>
      {children}
      {faqPage && <FAQJsonLd data={faqPage} />}
    </DisclosureLayout>
  )
}

Layout.displayName = 'DisclosureLayout'

Layout.schema = {
  title: 'Disclosure Layout',
  type: 'object',
  properties: {
    initialVisibility: {
      title: 'Initial visibility',
      description:
        'Defines the initial visibility of the layout content.',
      type: 'string',
      enum: ['visible', 'hidden'],
      default: 'hidden',
    },
    animated: {
      title: 'Animated',
      description: 'Defines if the layout content should have animations.',
      type: 'boolean',
      default: false,
    },
    generateStructuredData: {
      title: 'Generate structured data (FAQPage)',
      description:
        'When enabled, renders a schema.org FAQPage JSON-LD script for this disclosure. Ignored when placed inside a disclosure-ld-layout-group that already has this option enabled.',
      type: 'boolean',
      default: false,
    },
  },
}

export default Layout
