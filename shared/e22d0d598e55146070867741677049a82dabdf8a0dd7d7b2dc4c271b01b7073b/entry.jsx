import React, {useState} from 'react'
import ReactDOM from 'react-dom'
import {AppProvider, Popover} from '/subject/polaris-react/build/esm/index.js'
import translations from '/subject/polaris-react/locales/en.json'
import '/subject/polaris-react/build/esm/styles.css'

function App () {
  const [parentOpen, setParentOpen] = useState(true)
  const [closeCount, setCloseCount] = useState(0)
  window.__parentCloseCount = closeCount
  return <AppProvider i18n={translations}><main><span id="oracle-ready" />
    <h1>Parent Popover and child overlay</h1>
    <Popover active={parentOpen} preventCloseOnChildOverlayClick activator={<button id="parent-trigger">Parent trigger</button>}
      onClose={() => { setCloseCount(value => value + 1); setParentOpen(false) }} autofocusTarget="none">
      <div id="parent-panel" style={{padding:24}}>Parent overlay remains open</div>
    </Popover>
    <Popover active activator={<button id="child-trigger">Child trigger</button>} onClose={() => {}} autofocusTarget="none">
      <button id="child-action">Click inside child overlay</button>
    </Popover>
    <output id="close-count">{closeCount}</output>
  </main></AppProvider>
}
ReactDOM.render(<App />, document.getElementById('app'))
