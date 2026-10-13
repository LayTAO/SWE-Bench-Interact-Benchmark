import React from 'react'
import ReactDOM from 'react-dom/client'
import {Button, Tooltip, TooltipTrigger} from 'react-aria-components'

import './styles.css'

function App() {
  return (
    <main className="page" data-testid="repro-root">
      <h1>Pending action</h1>
      <p className="instructions">
        Hover the pending button. Its explanatory tooltip should remain available.
      </p>
      <TooltipTrigger delay={0}>
        <Button isPending aria-label="Pending action" className="pending-button">
          Pending action
        </Button>
        <Tooltip offset={6} className="tooltip">
          The current action is in progress
        </Tooltip>
      </TooltipTrigger>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
