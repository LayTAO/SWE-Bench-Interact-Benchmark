declare module '@subject-calculate-position' {
  export function calculatePosition(options: {
    placement: string
    targetNode: Element
    overlayNode: Element
    scrollNode: Element
    padding: number
    shouldFlip: boolean
    boundaryElement: Element
    offset: number
    crossOffset: number
    arrowSize: number
  }): {
    position: Record<string, number>
    maxHeight: number
    placement: string
  }
}
