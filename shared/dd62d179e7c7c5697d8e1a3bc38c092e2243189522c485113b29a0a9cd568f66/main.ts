import React from 'react'
import { createRoot } from 'react-dom/client'
import { Truncate } from '/subject/packages/react-core/src/components/Truncate'
import '@patternfly/patternfly/patternfly.css'

function App() {
  return React.createElement(
    'section',
    { className: 'fixture' },
    React.createElement(
      'div',
      { style: { width: 100 } },
      React.createElement(Truncate, {
        id: 'basic-truncate',
        content: 'basic truncated content',
        maxCharsDisplayed: 10,
      }),
    ),
    React.createElement(
      'div',
      { style: { width: 800 } },
      React.createElement(Truncate, {
        id: 'no-truncate',
        content: 'no truncation in wide container',
        maxCharsDisplayed: 1000,
      }),
    ),
    React.createElement('button', { id: 'outside', type: 'button' }, 'Move focus outside'),
  )
}

createRoot(document.getElementById('app')).render(React.createElement(App))
