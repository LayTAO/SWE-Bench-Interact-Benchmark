import React, {useLayoutEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom/client'
import {createPortal} from 'react-dom'
import {calculatePosition} from '@subject-calculate-position'

import './styles.css'

function App() {
  const [isOpen, setOpen] = useState(false)
  const [placement, setPlacement] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !popoverRef.current || !menuRef.current) {
      return
    }

    const popover = popoverRef.current
    popover.style.top = '0px'
    popover.style.bottom = ''
    popover.style.left = '0px'
    popover.style.right = ''
    popover.style.maxHeight = `${window.visualViewport?.height ?? window.innerHeight}px`

    const result = calculatePosition({
      placement: 'bottom end',
      targetNode: triggerRef.current,
      overlayNode: popover,
      scrollNode: menuRef.current,
      padding: 12,
      shouldFlip: true,
      boundaryElement: document.body,
      offset: 8,
      crossOffset: 0,
      arrowSize: 0,
    })

    popover.style.top = ''
    popover.style.bottom = ''
    popover.style.left = ''
    popover.style.right = ''
    for (const [property, value] of Object.entries(result.position)) {
      popover.style.setProperty(property, `${value}px`)
    }
    popover.style.maxHeight = `${result.maxHeight}px`
    popover.style.visibility = 'visible'
    setPlacement(result.placement)
  }, [isOpen])

  return (
    <main className="page" data-testid="repro-root">
      <h1>Popover positioning reproduction</h1>
      <p className="instructions">
        Open the menu near the bottom edge. The full Popover should flip above
        the trigger.
      </p>

      <div className="trigger-row" data-testid="trigger-row">
        <button
          ref={triggerRef}
          aria-controls="positioning-popover"
          aria-expanded={isOpen}
          className="trigger-button"
          onClick={() => setOpen(value => !value)}
        >
          Open popover
        </button>
        {isOpen && createPortal(
          <div
            id="positioning-popover"
            ref={popoverRef}
            className="popover"
            data-testid="popover"
            data-placement={placement}
            role="dialog"
            style={{position: 'absolute', visibility: 'hidden'}}
          >
            <div ref={menuRef} aria-label="Actions" className="menu" role="menu">
              <div role="menuitem" tabIndex={0}>Edit item</div>
              <div role="menuitem" tabIndex={-1}>Duplicate item</div>
              <div role="menuitem" tabIndex={-1}>Archive item</div>
            </div>
            <div className="extra-content" data-testid="extra-content">
              Extra information that must remain visible below the menu.
            </div>
          </div>,
          document.body,
        )}
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
