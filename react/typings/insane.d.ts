declare function insane(dirty: string, options?: insane.IOptions): string

declare namespace insane {
  interface IOptions {
    allowedTags?: string[] | boolean
    allowedAttributes?: { [index: string]: string[] } | boolean
    allowedStyles?: { [index: string]: { [index: string]: RegExp[] } }
    allowedClasses?: { [index: string]: string[] } | boolean
    allowedSchemes?: string[]
  }
}

declare module '@vtex/insane' {
  export = insane
}
