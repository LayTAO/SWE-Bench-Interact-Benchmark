import React from 'react';
import { createRoot } from 'react-dom/client';
import Autocomplete from '/subject/packages/mui-material/src/Autocomplete/Autocomplete.js';
import TextField from '/subject/packages/mui-material/src/TextField/TextField.js';

function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 32, width: 520 }}>
      <span id="oracle-ready" />
      <h1>Autocomplete select-after-reopen scroll</h1>
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={['one', 'two', 'three', 'four', 'five']}
        renderInput={(params) => <TextField {...params} label="Words" />}
        slotProps={{ listbox: { style: { padding: 0, maxHeight: '100px' } } }}
      />
    </main>
  );
}

createRoot(document.getElementById('app')).render(<App />);
