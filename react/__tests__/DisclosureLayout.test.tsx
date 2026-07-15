import * as React from 'react'
import { render, waitFor } from '@vtex/test-tools/react'
import { useRuntime, useTreePath } from 'vtex.render-runtime'

import DisclosureLayout from '../DisclosureLayout'
import DisclosureContent from '../DisclosureContent'
import DisclosureTrigger from '../DisclosureTrigger'

const mockUseRuntime = useRuntime as jest.Mock
const mockUseTreePath = useTreePath as jest.Mock

test('should change the CSS Handles', async () => {
  const { getByText } = render(
    <DisclosureLayout>
      <DisclosureTrigger>Trigger</DisclosureTrigger>
      <DisclosureContent>Content</DisclosureContent>
    </DisclosureLayout>
  )

  const content = getByText('Content')

  expect(content).toHaveClass('content--hidden')

  const trigger = getByText('Trigger')

  expect(trigger).toHaveClass('trigger--hidden')

  trigger.click()

  expect(content).toHaveClass('content--visible')
  expect(trigger).toHaveClass('trigger--visible')
})

test('should render hide and show props', async () => {
  const Show = () => <>Show</>
  const Hide = () => <>Hide</>

  const { getByText } = render(
    <DisclosureLayout>
      <DisclosureTrigger Show={Show} Hide={Hide} />
      <DisclosureContent>Content</DisclosureContent>
    </DisclosureLayout>
  )

  const content = getByText('Content')

  expect(content).not.toBeVisible()

  getByText('Show').click()
  expect(content).toBeVisible()

  getByText('Hide').click()
  await waitFor(() => expect(content).not.toBeVisible())
})

test('should show if initialVisibility is visible', async () => {
  const { getByText } = render(
    <DisclosureLayout initialVisibility="visible">
      <DisclosureTrigger>Trigger</DisclosureTrigger>
      <DisclosureContent>Content</DisclosureContent>
    </DisclosureLayout>
  )

  const content = getByText('Content')

  expect(content).toBeVisible()

  getByText('Trigger').click()
  expect(content).not.toBeVisible()
})

describe('structured data (generateStructuredData)', () => {
  afterEach(() => {
    mockUseRuntime.mockReturnValue({ extensions: {} })
    mockUseTreePath.mockReturnValue({ treePath: '' })
  })

  it('does not render any script by default', () => {
    const { container } = render(
      <DisclosureLayout>
        <DisclosureTrigger>Question?</DisclosureTrigger>
        <DisclosureContent>Answer.</DisclosureContent>
      </DisclosureLayout>
    )

    expect(
      container.querySelector('script[type="application/ld+json"]')
    ).toBeNull()
  })

  it('renders its own FAQPage script when isolated and enabled', () => {
    const { container } = render(
      <DisclosureLayout generateStructuredData>
        <DisclosureTrigger>How can I track my order?</DisclosureTrigger>
        <DisclosureContent>Check the Orders page.</DisclosureContent>
      </DisclosureLayout>
    )

    const script = container.querySelector(
      'script[type="application/ld+json"]'
    )

    expect(script).not.toBeNull()

    const data = JSON.parse(script?.textContent ?? '{}')

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How can I track my order?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Check the Orders page.',
          },
        },
      ],
    })
  })

  it('omits the script when question or answer text cannot be resolved, without throwing', () => {
    expect(() =>
      render(
        <DisclosureLayout generateStructuredData>
          <DisclosureTrigger />
          <DisclosureContent>{null}</DisclosureContent>
        </DisclosureLayout>
      )
    ).not.toThrow()

    const { container } = render(
      <DisclosureLayout generateStructuredData>
        <DisclosureTrigger />
        <DisclosureContent>{null}</DisclosureContent>
      </DisclosureLayout>
    )

    expect(
      container.querySelector('script[type="application/ld+json"]')
    ).toBeNull()
  })
})
