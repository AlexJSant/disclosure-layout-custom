import * as React from 'react'
import { render, waitFor } from '@vtex/test-tools/react'
import { useRuntime, useTreePath } from 'vtex.render-runtime'

import DisclosureLayoutGroup from '../DisclosureLayoutGroup'
import DisclosureTriggerGroup from '../DisclosureTriggerGroup'
import DisclosureLayout from '../DisclosureLayout'
import DisclosureContent from '../DisclosureContent'
import DisclosureTrigger from '../DisclosureTrigger'
import { ExtensionsMap } from '../typings/structuredData'

const mockUseRuntime = useRuntime as jest.Mock
const mockUseTreePath = useTreePath as jest.Mock

test('trigger group', async () => {
  const { getByText } = render(
    <DisclosureLayoutGroup>
      <DisclosureLayout>
        <DisclosureTrigger>Trigger 1</DisclosureTrigger>
        <DisclosureContent>Content 1</DisclosureContent>
      </DisclosureLayout>
      <DisclosureLayout>
        <DisclosureTrigger>Trigger 2</DisclosureTrigger>
        <DisclosureContent>Content 2</DisclosureContent>
      </DisclosureLayout>
      <DisclosureLayout>
        <DisclosureTrigger>Trigger 3</DisclosureTrigger>
        <DisclosureContent>Content 3</DisclosureContent>
      </DisclosureLayout>

      <DisclosureTriggerGroup>Trigger Group</DisclosureTriggerGroup>
    </DisclosureLayoutGroup>
  )

  const content1 = getByText('Content 1')
  const triggerGroup = getByText('Trigger Group')

  expect(content1).toHaveClass('content--hidden')
  expect(triggerGroup).toHaveClass('triggerGroup--hidden')

  triggerGroup.click()
  await waitFor(() =>
    expect(triggerGroup).toHaveAttribute('aria-expanded', 'true')
  )

  expect(content1).toHaveClass('content--visible')
  expect(triggerGroup).toHaveClass('triggerGroup--visible')
})

test('trigger with show and hide', async () => {
  const Show = () => <>SHOW ALL</>
  const Hide = () => <>HIDE ALL</>

  const { getByText } = render(
    <DisclosureLayoutGroup>
      <DisclosureLayout>
        <DisclosureTrigger>Trigger 1</DisclosureTrigger>
        <DisclosureContent>Content 1</DisclosureContent>
      </DisclosureLayout>
      <DisclosureLayout>
        <DisclosureTrigger>Trigger 2</DisclosureTrigger>
        <DisclosureContent>Content 2</DisclosureContent>
      </DisclosureLayout>
      <DisclosureLayout>
        <DisclosureTrigger>Trigger 3</DisclosureTrigger>
        <DisclosureContent>Content 3</DisclosureContent>
      </DisclosureLayout>

      <DisclosureTriggerGroup Show={Show} Hide={Hide} />
    </DisclosureLayoutGroup>
  )

  const content1 = getByText('Content 1')
  const content2 = getByText('Content 2')
  const content3 = getByText('Content 3')

  getByText('SHOW ALL').click()
  await waitFor(() => expect(content1).toBeVisible())
  expect(content2).toBeVisible()
  expect(content3).toBeVisible()

  getByText('HIDE ALL').click()
  expect(content1).not.toBeVisible()
  expect(content2).not.toBeVisible()
  expect(content3).not.toBeVisible()
})

describe('structured data (generateStructuredData)', () => {
  afterEach(() => {
    mockUseRuntime.mockReturnValue({ extensions: {} })
    mockUseTreePath.mockReturnValue({ treePath: '' })
  })

  it('does not render any script when the feature is disabled (default)', () => {
    const { container } = render(
      <DisclosureLayoutGroup>
        <DisclosureLayout>
          <DisclosureTrigger>Question?</DisclosureTrigger>
          <DisclosureContent>Answer.</DisclosureContent>
        </DisclosureLayout>
      </DisclosureLayoutGroup>
    )

    expect(
      container.querySelector('script[type="application/ld+json"]')
    ).toBeNull()
  })

  it('renders a single aggregated FAQPage script for aliased disclosure-ld-layout children, in render order', () => {
    mockUseTreePath.mockReturnValue({ treePath: 'group' })
    mockUseRuntime.mockReturnValue({
      extensions: {
        group: {
          blocks: [
            { extensionPointId: 'disclosure-ld-layout#first' },
            { extensionPointId: 'disclosure-ld-layout#second' },
          ],
        },
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
          props: { text: 'Question 1?' },
        },
        'group/disclosure-ld-layout#first/disclosure-ld-content#first': {
          blocks: [{ extensionPointId: 'rich-text#a1' }],
        },
        'group/disclosure-ld-layout#first/disclosure-ld-content#first/rich-text#a1': {
          props: { text: 'Answer 1.' },
        },
        'group/disclosure-ld-layout#second': {
          blocks: [
            { extensionPointId: 'disclosure-ld-trigger#second' },
            { extensionPointId: 'disclosure-ld-content#second' },
          ],
        },
        'group/disclosure-ld-layout#second/disclosure-ld-trigger#second': {
          blocks: [{ extensionPointId: 'rich-text#q2' }],
        },
        'group/disclosure-ld-layout#second/disclosure-ld-trigger#second/rich-text#q2': {
          props: { text: 'Question 2?' },
        },
        'group/disclosure-ld-layout#second/disclosure-ld-content#second': {
          blocks: [{ extensionPointId: 'rich-text#a2' }],
        },
        'group/disclosure-ld-layout#second/disclosure-ld-content#second/rich-text#a2': {
          props: { text: 'Answer 2.' },
        },
      } as ExtensionsMap,
    })

    const { container } = render(
      <DisclosureLayoutGroup generateStructuredData>
        <DisclosureLayout>
          <DisclosureTrigger>Question 1?</DisclosureTrigger>
          <DisclosureContent>Answer 1.</DisclosureContent>
        </DisclosureLayout>
        <DisclosureLayout>
          <DisclosureTrigger>Question 2?</DisclosureTrigger>
          <DisclosureContent>Answer 2.</DisclosureContent>
        </DisclosureLayout>
      </DisclosureLayoutGroup>
    )

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    )

    expect(scripts).toHaveLength(1)

    const data = JSON.parse(scripts[0].textContent ?? '{}')

    expect(data.mainEntity.map((question: { name: string }) => question.name)).toEqual([
      'Question 1?',
      'Question 2?',
    ])
  })

  it('finds disclosure-ld-layout descendants through an intermediate wrapper block', () => {
    mockUseTreePath.mockReturnValue({ treePath: 'group' })
    mockUseRuntime.mockReturnValue({
      extensions: {
        group: {
          blocks: [{ extensionPointId: 'flex-layout.row#wrapper' }],
        },
        'group/flex-layout.row#wrapper': {
          blocks: [{ extensionPointId: 'disclosure-ld-layout#only' }],
        },
        'group/flex-layout.row#wrapper/disclosure-ld-layout#only': {
          blocks: [
            { extensionPointId: 'disclosure-ld-trigger#only' },
            { extensionPointId: 'disclosure-ld-content#only' },
          ],
        },
        'group/flex-layout.row#wrapper/disclosure-ld-layout#only/disclosure-ld-trigger#only': {
          props: { text: 'Wrapped question?' },
        },
        'group/flex-layout.row#wrapper/disclosure-ld-layout#only/disclosure-ld-content#only': {
          props: { text: 'Wrapped answer.' },
        },
      } as ExtensionsMap,
    })

    const { container } = render(
      <DisclosureLayoutGroup generateStructuredData>
        <DisclosureLayout>
          <DisclosureTrigger>Wrapped question?</DisclosureTrigger>
          <DisclosureContent>Wrapped answer.</DisclosureContent>
        </DisclosureLayout>
      </DisclosureLayoutGroup>
    )

    const script = container.querySelector(
      'script[type="application/ld+json"]'
    )

    expect(script).not.toBeNull()

    const data = JSON.parse(script?.textContent ?? '{}')

    expect(data.mainEntity).toHaveLength(1)
    expect(data.mainEntity[0].name).toBe('Wrapped question?')
  })

  it('suppresses individual disclosure-ld-layout scripts when the group has the feature enabled (group prevails)', () => {
    mockUseTreePath.mockReturnValue({ treePath: 'group' })
    mockUseRuntime.mockReturnValue({ extensions: {} })

    const { container } = render(
      <DisclosureLayoutGroup generateStructuredData>
        <DisclosureLayout generateStructuredData>
          <DisclosureTrigger>Question?</DisclosureTrigger>
          <DisclosureContent>Answer.</DisclosureContent>
        </DisclosureLayout>
      </DisclosureLayoutGroup>
    )

    // The group produced no items here (empty extensions mock), but since
    // it owns structured data generation once enabled, the individual
    // disclosure-ld-layout must not fall back to rendering its own script.
    expect(
      container.querySelector('script[type="application/ld+json"]')
    ).toBeNull()
  })

  it('does not leave "ghost" items in the aggregated script after a disclosure-ld-layout is removed on re-render', () => {
    mockUseTreePath.mockReturnValue({ treePath: 'group' })

    const sharedExtensions = {
      'group/disclosure-ld-layout#first': {
        blocks: [
          { extensionPointId: 'disclosure-ld-trigger#first' },
          { extensionPointId: 'disclosure-ld-content#first' },
        ],
      },
      'group/disclosure-ld-layout#first/disclosure-ld-trigger#first': {
        props: { text: 'Question 1?' },
      },
      'group/disclosure-ld-layout#first/disclosure-ld-content#first': {
        props: { text: 'Answer 1.' },
      },
      'group/disclosure-ld-layout#second': {
        blocks: [
          { extensionPointId: 'disclosure-ld-trigger#second' },
          { extensionPointId: 'disclosure-ld-content#second' },
        ],
      },
      'group/disclosure-ld-layout#second/disclosure-ld-trigger#second': {
        props: { text: 'Question 2?' },
      },
      'group/disclosure-ld-layout#second/disclosure-ld-content#second': {
        props: { text: 'Answer 2.' },
      },
    } as ExtensionsMap

    mockUseRuntime.mockReturnValue({
      extensions: {
        group: {
          blocks: [
            { extensionPointId: 'disclosure-ld-layout#first' },
            { extensionPointId: 'disclosure-ld-layout#second' },
          ],
        },
        ...sharedExtensions,
      },
    })

    const { container, rerender } = render(
      <DisclosureLayoutGroup generateStructuredData>
        <DisclosureLayout>
          <DisclosureTrigger>Question 1?</DisclosureTrigger>
          <DisclosureContent>Answer 1.</DisclosureContent>
        </DisclosureLayout>
        <DisclosureLayout>
          <DisclosureTrigger>Question 2?</DisclosureTrigger>
          <DisclosureContent>Answer 2.</DisclosureContent>
        </DisclosureLayout>
      </DisclosureLayoutGroup>
    )

    const firstRenderData = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')
        ?.textContent ?? '{}'
    )

    expect(firstRenderData.mainEntity).toHaveLength(2)

    // Simulate the second disclosure-ld-layout being conditionally removed.
    mockUseRuntime.mockReturnValue({
      extensions: {
        group: {
          blocks: [{ extensionPointId: 'disclosure-ld-layout#first' }],
        },
        ...sharedExtensions,
      },
    })

    rerender(
      <DisclosureLayoutGroup generateStructuredData>
        <DisclosureLayout>
          <DisclosureTrigger>Question 1?</DisclosureTrigger>
          <DisclosureContent>Answer 1.</DisclosureContent>
        </DisclosureLayout>
      </DisclosureLayoutGroup>
    )

    const secondRenderData = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')
        ?.textContent ?? '{}'
    )

    expect(secondRenderData.mainEntity).toHaveLength(1)
    expect(secondRenderData.mainEntity[0].name).toBe('Question 1?')
  })
})
