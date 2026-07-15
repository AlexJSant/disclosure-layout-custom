import { FC } from 'react'

/**
 * A VTEX IO block component may expose a static `schema` describing its
 * editable props to the Site Editor. `FC` doesn't type this by default.
 */
export type BlockComponent<P = {}> = FC<P> & {
  schema?: Record<string, unknown>
}
