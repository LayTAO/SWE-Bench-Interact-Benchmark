import React from 'react';
import { createRoot } from 'react-dom/client';
import { Select, SelectItem } from '/subject/packages/components/select/src/index.ts';

function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 80 }}>
      <span id="oracle-ready" />
      <Select aria-label="Favorite Animal" data-testid="select" label="Favorite Animal">
        <SelectItem key="penguin" value="penguin">Penguin</SelectItem>
        <SelectItem key="zebra" value="zebra">Zebra</SelectItem>
        <SelectItem key="shark" value="shark">Shark</SelectItem>
      </Select>
    </main>
  );
}

createRoot(document.getElementById('app')).render(<App />);
