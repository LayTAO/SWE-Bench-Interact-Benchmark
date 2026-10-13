import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Autocomplete from '/subject/packages/mui-material/src/Autocomplete/Autocomplete.js';
import TextField from '/subject/packages/mui-material/src/TextField/TextField.js';

function App() {
  const [options, setOptions] = useState(['1', '2', '3', '4', '5']);
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 32, width: 520 }}>
      <span id="oracle-ready" />
      <h1>Autocomplete append-options scroll</h1>
      <button type="button" onClick={() => setOptions(['1', '2', '3', '4', '5', '6', '7', '8'])}>
        Append options
      </button>
      <div style={{ marginTop: 24 }}>
        <Autocomplete
          open
          options={options}
          renderInput={(params) => <TextField {...params} label="Numbers" />}
          slotProps={{ listbox: { style: { maxHeight: '100px', overflow: 'auto' } } }}
        />
      </div>
    </main>
  );
}

createRoot(document.getElementById('app')).render(<App />);
