import React from 'react'
import { createRoot } from 'react-dom/client'
import { MultiSelect, Option } from '/subject/src/components/select/index.ts'
import CarbonProvider from '/subject/src/components/carbon-provider/index.ts'
window.__openCount = 0
function App () { return <main><span id="oracle-ready" /><h1>Multi-select textbox hit box</h1>
  <CarbonProvider><div style={{width:360}}><MultiSelect name="colors" id="colors" placeholder="Please select" onOpen={() => { window.__openCount += 1 }}>
    <Option value="red" text="red" /><Option value="green" text="green" /><Option value="blue" text="blue" />
  </MultiSelect></div></CarbonProvider></main> }
createRoot(document.getElementById('app')).render(<App />)
