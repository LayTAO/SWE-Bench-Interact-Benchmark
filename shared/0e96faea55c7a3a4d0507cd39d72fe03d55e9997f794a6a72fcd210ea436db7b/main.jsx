import React from 'react';
import {createRoot} from 'react-dom/client';
import {Dropdown} from '../packages/react/src/index.js';
import '../packages/styles/css/styles.css';

const items = ['Apple', 'Banana', 'Mango'];

function App() {
  return <>
    <Dropdown
      id="issue-dropdown"
      titleText="Fruit"
      label="Choose an option"
      items={items}
      itemToString={(item) => item ?? ''}
    />
    <button id="outside" type="button" style={{position: 'fixed', top: 20, right: 20}}>Outside the Dropdown</button>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
