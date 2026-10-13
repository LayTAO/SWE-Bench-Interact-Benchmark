import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as DismissableLayer from '@interactrepair/dismissable-layer';

const errors: string[] = [];
window.addEventListener('error', event => errors.push(String(event.error ?? event.message)));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));

function Reproduction(): React.ReactElement {
  const [open, setOpen] = React.useState(true);
  const [blocked, setBlocked] = React.useState(false);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 32 }}>
      <h1>DismissableLayer Escape handler</h1>
      {open ? (
        <DismissableLayer.Root
          onEscapeKeyDown={event => {
            if (blocked) event.preventDefault();
          }}
          onDismiss={() => setOpen(false)}
          style={{ border: '2px solid #456', padding: 24, width: 420 }}
        >
          <p id="status">{blocked ? 'open-blocked' : 'open-unblocked'}</p>
          <button id="block" type="button" onClick={() => setBlocked(true)}>
            Block Escape
          </button>
          <p>After blocking, press Escape. The layer should remain open.</p>
        </DismissableLayer.Root>
      ) : (
        <p id="status">closed</p>
      )}
      <p id="errors">{errors.join('\n')}</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Reproduction />);
