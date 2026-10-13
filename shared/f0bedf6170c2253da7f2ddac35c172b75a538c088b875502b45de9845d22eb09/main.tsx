import React, { useId } from 'react';
import { createRoot } from 'react-dom/client';
import * as datePicker from '@zag-js/date-picker';
import { normalizeProps, useMachine } from '@zag-js/react';

function App() {
  const service = useMachine(datePicker.machine, {
    id: useId(),
    name: 'range',
    locale: 'en-US',
    selectionMode: 'range',
  });
  const api = datePicker.connect(service, normalizeProps);
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 32 }}>
      <h1>Date range blur normalization</h1>
      <p>Enter a later start date and an earlier end date, then leave each field.</p>
      <div {...api.getControlProps()} style={{ display: 'flex', gap: 12 }}>
        <label>Start <input aria-label="Start date" {...api.getInputProps({ index: 0 })} /></label>
        <label>End <input aria-label="End date" {...api.getInputProps({ index: 1 })} /></label>
      </div>
      <output className="date-output">Selected: {api.valueAsString.join(', ') || '-'}</output>
      <button type="button">Outside element</button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
