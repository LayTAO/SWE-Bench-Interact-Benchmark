import React, { createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Menu, MenuButton, MenuItems, MenuItem } from '/subject/packages/@headlessui-react/src/components/menu/menu.tsx'
const buttonRef = createRef()
window.__programmaticClicks = 0
function App () { return <main><span id="oracle-ready" /><h1>Forwarded menu ref</h1>
  <button onClick={() => { window.__programmaticClicks += 1; buttonRef.current?.click() }}>Programmatic click</button>
  <Menu><MenuButton ref={buttonRef}>Trigger</MenuButton><MenuItems>
    <MenuItem as="a" href="#a">Item A</MenuItem><MenuItem as="a" href="#b">Item B</MenuItem><MenuItem as="a" href="#c">Item C</MenuItem>
  </MenuItems></Menu></main> }
createRoot(document.getElementById('app')).render(<App />)
