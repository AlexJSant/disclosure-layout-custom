import { createElement } from 'react'

import { ExtensionsMap } from '../../typings/structuredData'
import {
  buildFAQItem,
  buildFAQPage,
  extractTextFromReactNode,
  findDescendantLayouts,
  findDirectChildTreePathByBlockName,
  getBlockName,
} from '../structuredData'

describe('getBlockName', () => {
  it('strips the #alias suffix', () => {
    expect(getBlockName('disclosure-ld-layout#first')).toBe('disclosure-ld-layout')
    expect(getBlockName('disclosure-ld-layout')).toBe('disclosure-ld-layout')
  })
})

describe('findDescendantLayouts', () => {
  it('finds aliased disclosure-ld-layout blocks, preserving render order', () => {
    const extensions: ExtensionsMap = {
      group: {
        blocks: [
          { extensionPointId: 'disclosure-ld-layout#second' },
          { extensionPointId: 'disclosure-ld-layout#first' },
        ],
      },
    }

    expect(findDescendantLayouts(extensions, 'group')).toEqual([
      'group/disclosure-ld-layout#second',
      'group/disclosure-ld-layout#first',
    ])
  })

  it('traverses through an intermediate wrapper block', () => {
    const extensions: ExtensionsMap = {
      group: {
        blocks: [{ extensionPointId: 'flex-layout.row#wrapper' }],
      },
      'group/flex-layout.row#wrapper': {
        blocks: [{ extensionPointId: 'disclosure-ld-layout#only' }],
      },
    }

    expect(findDescendantLayouts(extensions, 'group')).toEqual([
      'group/flex-layout.row#wrapper/disclosure-ld-layout#only',
    ])
  })

  it('does not descend past an already matched disclosure-ld-layout', () => {
    const extensions: ExtensionsMap = {
      group: {
        blocks: [{ extensionPointId: 'disclosure-ld-layout#outer' }],
      },
      'group/disclosure-ld-layout#outer': {
        blocks: [{ extensionPointId: 'disclosure-ld-layout#inner' }],
      },
    }

    expect(findDescendantLayouts(extensions, 'group')).toEqual([
      'group/disclosure-ld-layout#outer',
    ])
  })

  it('returns an empty array when there is no extension for the given treePath', () => {
    expect(findDescendantLayouts({}, 'group')).toEqual([])
  })
})

describe('findDirectChildTreePathByBlockName', () => {
  it('ignores the #alias suffix when comparing the block name', () => {
    const extensions: ExtensionsMap = {
      layout: {
        blocks: [
          { extensionPointId: 'disclosure-ld-trigger#custom' },
          { extensionPointId: 'disclosure-ld-content#custom' },
        ],
      },
    }

    expect(
      findDirectChildTreePathByBlockName(
        extensions,
        'layout',
        'disclosure-ld-trigger'
      )
    ).toBe('layout/disclosure-ld-trigger#custom')
  })

  it('does not cross into nested wrapper blocks', () => {
    const extensions: ExtensionsMap = {
      layout: {
        blocks: [{ extensionPointId: 'flex-layout.row#wrapper' }],
      },
      'layout/flex-layout.row#wrapper': {
        blocks: [{ extensionPointId: 'disclosure-ld-trigger#nested' }],
      },
    }

    expect(
      findDirectChildTreePathByBlockName(
        extensions,
        'layout',
        'disclosure-ld-trigger'
      )
    ).toBeUndefined()
  })
})

describe('buildFAQItem', () => {
  const extensions: ExtensionsMap = {
    'group/disclosure-ld-layout#first': {
      blocks: [
        { extensionPointId: 'disclosure-ld-trigger#first' },
        { extensionPointId: 'disclosure-ld-content#first' },
      ],
    },
    'group/disclosure-ld-layout#first/disclosure-ld-trigger#first': {
      blocks: [{ extensionPointId: 'rich-text#q1' }],
    },
    'group/disclosure-ld-layout#first/disclosure-ld-trigger#first/rich-text#q1': {
      props: { text: 'How can I change my shipping address?' },
    },
    'group/disclosure-ld-layout#first/disclosure-ld-content#first': {
      blocks: [{ extensionPointId: 'rich-text#a1' }],
    },
    'group/disclosure-ld-layout#first/disclosure-ld-content#first/rich-text#a1': {
      props: { text: 'Call us at (212) 123-1234.' },
    },
  }

  it('extracts question and answer text from nested rich-text blocks', () => {
    const item = buildFAQItem(extensions, 'group/disclosure-ld-layout#first')

    expect(item).toEqual({
      id: 'group/disclosure-ld-layout#first',
      question: 'How can I change my shipping address?',
      answer: 'Call us at (212) 123-1234.',
    })
  })

  it('prefers content over props (Site Editor overrides theme props)', () => {
    const withContent: ExtensionsMap = {
      ...extensions,
      'group/disclosure-ld-layout#first/disclosure-ld-trigger#first/rich-text#q1': {
        props: { text: 'Original question?' },
        content: { text: 'Edited question?' },
      },
    }

    const item = buildFAQItem(withContent, 'group/disclosure-ld-layout#first')

    expect(item?.question).toBe('Edited question?')
  })

  it('strips Markdown (bold, italic, link, list) into plain text for JSON-LD', () => {
    const withMarkdown: ExtensionsMap = {
      'group/disclosure-ld-layout#md': {
        blocks: [
          { extensionPointId: 'disclosure-ld-trigger#md' },
          { extensionPointId: 'disclosure-ld-content#md' },
        ],
      },
      'group/disclosure-ld-layout#md/disclosure-ld-trigger#md': {
        blocks: [{ extensionPointId: 'rich-text#q' }],
      },
      'group/disclosure-ld-layout#md/disclosure-ld-trigger#md/rich-text#q': {
        props: { text: 'How do I use **bold** in a question?' },
      },
      'group/disclosure-ld-layout#md/disclosure-ld-content#md': {
        blocks: [{ extensionPointId: 'rich-text#a' }],
      },
      'group/disclosure-ld-layout#md/disclosure-ld-content#md/rich-text#a': {
        props: {
          text:
            'You can use *italic*, a [help link](https://example.com), and a list:\n- First item\n- Second item',
        },
      },
    }

    const item = buildFAQItem(withMarkdown, 'group/disclosure-ld-layout#md')

    expect(item).toEqual({
      id: 'group/disclosure-ld-layout#md',
      question: 'How do I use bold in a question?',
      answer:
        'You can use italic, a help link, and a list: First item Second item',
    })
  })

  it('returns null when a question or answer cannot be resolved', () => {
    expect(buildFAQItem({}, 'group/disclosure-ld-layout#missing')).toBeNull()
  })

  it('falls back to React children when nothing is found in extensions', () => {
    const item = buildFAQItem({}, 'isolated', {
      triggerChildren: 'Fallback question?',
      contentChildren: 'Fallback answer.',
    })

    expect(item).toEqual({
      id: 'isolated',
      question: 'Fallback question?',
      answer: 'Fallback answer.',
    })
  })
})

describe('buildFAQPage', () => {
  it('builds a valid FAQPage payload from multiple items', () => {
    const page = buildFAQPage([
      { id: '1', question: 'Q1?', answer: 'A1.' },
      { id: '2', question: 'Q2?', answer: 'A2.' },
    ])

    expect(page).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Q1?',
          acceptedAnswer: { '@type': 'Answer', text: 'A1.' },
        },
        {
          '@type': 'Question',
          name: 'Q2?',
          acceptedAnswer: { '@type': 'Answer', text: 'A2.' },
        },
      ],
    })
  })

  it('returns null for an empty item list', () => {
    expect(buildFAQPage([])).toBeNull()
  })
})

describe('extractTextFromReactNode', () => {
  it('collects text from nested elements', () => {
    const node = createElement(
      'div',
      null,
      'Hello ',
      createElement('strong', null, 'world'),
      '!'
    )

    expect(extractTextFromReactNode(node)).toBe('Hello world !')
  })

  it('never throws for unusual input', () => {
    expect(extractTextFromReactNode(undefined)).toBe('')
    expect(extractTextFromReactNode(null)).toBe('')
    expect(extractTextFromReactNode(42)).toBe('42')
    expect(extractTextFromReactNode(true)).toBe('')
    expect(() => extractTextFromReactNode({} as never)).not.toThrow()
  })
})
