import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import ComboBox from '../packages/react/src/components/ComboBox/index.ts';
import './repro.css';

const items = [
  {id: 'apple', text: 'Apple'},
  {id: 'banana', text: 'Banana'},
  {id: 'mango', text: 'Mango'},
];

function App() {
  const [selectedItem, setSelectedItem] = useState(null);
  return <>
    <ComboBox
      id="issue-combobox"
      titleText="Fruit"
      items={items}
      itemToString={(item) => item?.text ?? ''}
      placeholder="Choose a fruit"
      selectedItem={selectedItem}
      onChange={({selectedItem: nextSelectedItem}) => setSelectedItem(nextSelectedItem)}
    />
    <button id="outside" type="button" style={{position: 'fixed', top: 20, right: 20}}>Outside the ComboBox</button>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
