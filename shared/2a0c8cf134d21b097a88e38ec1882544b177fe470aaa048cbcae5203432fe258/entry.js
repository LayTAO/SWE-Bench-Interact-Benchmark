import React from 'react'
import { createRoot } from 'react-dom/client'
import Select from '/subject/packages/mui-material/src/Select/Select.js'
import MenuItem from '/subject/packages/mui-material/src/MenuItem/MenuItem.js'
function App () { return <main><span id="oracle-ready" /><h1>Select pointer cancellation</h1>
  <div style={{width:260,marginTop:60}}><Select defaultValue={10} fullWidth>
    <MenuItem value={10}>Ten</MenuItem><MenuItem value={20}>Twenty</MenuItem>
  </Select></div></main> }
createRoot(document.getElementById('app')).render(<App />)
