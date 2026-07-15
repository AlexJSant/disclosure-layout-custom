import React, { FC } from 'react'
import { Helmet } from 'vtex.render-runtime'

import { FAQPage } from './typings/structuredData'

interface Props {
  data: FAQPage
}

/**
 * Renders a single `application/ld+json` script tag with a FAQPage
 * structured data payload, via `Helmet` (re-exported from `react-helmet`
 * by `vtex.render-runtime`). `Helmet` is resolved during SSR through
 * `Helmet.rewind()`, so this script is present in the HTML returned by the
 * server, not only injected client-side after hydration.
 */
const FAQJsonLd: FC<Props> = ({ data }) => {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}

FAQJsonLd.displayName = 'FAQJsonLd'

export default FAQJsonLd
