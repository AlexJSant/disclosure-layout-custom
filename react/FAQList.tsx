/**
 * Build-validation stub only — replaced by the real FAQList after plan approval.
 *
 * Imports a Babel-ES5 vendored copy of marked@4.0.10 (see vendor/marked.es5.js)
 * because the VTEX react@3.x webpack does not transpile node_modules and fails on
 * class-field syntax present in marked's published UMD/CJS since 4.x.
 */
import React, { FC } from 'react'
import insane from '@vtex/insane'
import escapeHtml from 'escape-html'
import {
  parse as markedParse,
  Renderer,
} from './vendor/marked.es5.js'

const sanitizerConfig = {
  allowedTags: [
    'a',
    'br',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'iframe',
    'img',
    'li',
    'ol',
    'p',
    'span',
    'strong',
    'em',
    'sup',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'ul',
  ],
  allowedAttributes: {
    '*': ['class', 'title'],
    a: ['href', 'target'],
    img: ['src', 'alt'],
    iframe: ['frameborder', 'height', 'src', 'width', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
}

const renderMarkdown = (text: string): string => {
  const renderer = new Renderer()
  renderer.html = (html: string) => escapeHtml(html)

  const raw = markedParse(text, {
    gfm: true,
    breaks: true,
    renderer,
  }) as string

  return insane(raw, sanitizerConfig)
}

const FAQList: FC = () => {
  const html = renderMarkdown('**build probe**')

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

FAQList.displayName = 'FAQList'

export default FAQList
