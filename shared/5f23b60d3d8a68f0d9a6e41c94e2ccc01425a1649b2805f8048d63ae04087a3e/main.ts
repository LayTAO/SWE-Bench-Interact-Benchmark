import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { InputNumber } from '/subject/components/lib/inputnumber/InputNumber.js'

function App() {
  const [value, setValue] = useState(null)
  return React.createElement(
    'main',
    { className: 'fixture' },
    React.createElement('h1', null, 'InputNumber step precision'),
    React.createElement(InputNumber, {
      inputId: 'number',
      value,
      onValueChange: (event) => setValue(event.value),
      step: 0.25,
      showButtons: true,
      mode: 'decimal',
    }),
    React.createElement('output', { id: 'value' }, String(value ?? '')),
  )
}

createRoot(document.getElementById('app')).render(React.createElement(App))
