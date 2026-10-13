import React from 'react'
import ReactDOM from 'react-dom/client'
import {ColorEditor, ColorPicker} from '@react-spectrum/color'
import {Provider} from '@react-spectrum/provider'
import {theme} from '@react-spectrum/theme-default'

import './styles.css'

function App() {
  return (
    <Provider theme={theme} colorScheme="light" scale="medium">
      <main className="page" data-testid="repro-root">
        <h1>ColorPicker outside-click commit</h1>
        <p className="instructions">
          Open the picker, type a complete hexadecimal color, then dismiss the popover by clicking outside.
        </p>
        <ColorPicker label="Fill" defaultValue="#f00">
          <ColorEditor />
        </ColorPicker>
        <div className="outside-target" data-testid="outside-target">Outside the popover</div>
      </main>
    </Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
