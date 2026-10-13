import React from 'react';
import {createRoot} from 'react-dom/client';
import {MultiSelect} from '../packages/react/src/index.js';
import '../packages/styles/css/styles.css';

const items = ['Apple', 'Banana', 'Mango'];

function App() {
  return <>
    <MultiSelect
      id="issue-multiselect"
      titleText="Fruit"
      label="Choose options"
      items={items}
      itemToString={(item) => item ?? ''}
    />
    <button id="after" type="button">Next focus target</button>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
