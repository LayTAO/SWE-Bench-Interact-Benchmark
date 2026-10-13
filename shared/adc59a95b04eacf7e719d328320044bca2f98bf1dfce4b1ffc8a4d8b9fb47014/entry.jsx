import React from 'react'
import {createRoot} from 'react-dom/client'
import {Provider} from '@react-spectrum/provider'
import {theme} from '@react-spectrum/theme-default'
import {ComboBox, Item} from '@react-spectrum/combobox'

const options = [
  {id: '1', name: 'Aerospace'},
  {id: '2', name: 'Mechanical'},
  {id: '3', name: 'Civil'},
  {id: '4', name: 'Biomedical'},
  {id: '5', name: 'Nuclear'},
  {id: '6', name: 'Industrial'},
  {id: '7', name: 'Chemical'},
  {id: '8', name: 'Agricultural'},
  {id: '9', name: 'Electrical'},
]

window.__interactRepairSelections = []

function App() {
  return (
    <Provider theme={theme} colorScheme="light">
      <main className="repro-shell">
        <span id="oracle-ready" />
        <h1>ComboBox outside-click reproduction</h1>
        <ComboBox
          label="Pick an engineering major"
          defaultItems={options}
          loadingState="idle"
          onSelectionChange={key => window.__interactRepairSelections.push(key)}>
          {item => <Item key={item.id}>{item.name}</Item>}
        </ComboBox>
        <p id="outside-zone">Outside target below the filtered menu</p>
      </main>
    </Provider>
  )
}

createRoot(document.getElementById('app')).render(<App />)
