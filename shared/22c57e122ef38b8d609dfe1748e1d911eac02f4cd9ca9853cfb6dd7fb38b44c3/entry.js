import React from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import * as DropdownMenu from '/subject/packages/react/dropdown-menu/src/dropdown-menu.tsx'
window.__keyEvents = []
function PortaledInput () {
  return createPortal(<input data-testid="portaled-input" defaultValue="" onKeyDown={event => {
    setTimeout(() => window.__keyEvents.push({ key: event.key, defaultPrevented: event.defaultPrevented }), 0)
  }} />, document.body)
}
function App () { return <main><span id="oracle-ready" /><h1>Portaled input keyboard handling</h1>
  <DropdownMenu.Root defaultOpen><DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content><DropdownMenu.Item onSelect={event => event.preventDefault()}>
      Item<PortaledInput />
    </DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root></main> }
createRoot(document.getElementById('app')).render(<App />)
