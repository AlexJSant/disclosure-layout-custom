export class Renderer {
  html: (html: string) => string
  [key: string]: unknown
}

export function parse(
  src: string,
  options?: {
    gfm?: boolean
    breaks?: boolean
    renderer?: Renderer
  }
): string
