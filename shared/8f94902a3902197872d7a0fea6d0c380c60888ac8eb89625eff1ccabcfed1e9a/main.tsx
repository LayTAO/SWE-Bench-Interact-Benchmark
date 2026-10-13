import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as DismissableLayer from '@interactrepair/dismissable-layer';

const errors: string[] = [];
window.addEventListener('error', (event) => errors.push(String(event.error ?? event.message)));
window.addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)));

function Reproduction(): React.ReactElement {
  const [parentOpen, setParentOpen] = React.useState(true);
  const [childOpen, setChildOpen] = React.useState(true);

  return (
    <main style={{ display: 'grid', gap: 16, padding: 40, justifyItems: 'start' }}>
      <h1>Deferred parent with a dismissing child layer</h1>
      <p id="status">
        parent: {parentOpen ? 'open' : 'closed'} | child: {childOpen ? 'open' : 'closed'}
      </p>
      <p id="errors">{errors.join('\n')}</p>
      {parentOpen && (
        <DismissableLayer.Root
          disableOutsidePointerEvents
          deferPointerDownOutside
          onDismiss={() => setParentOpen(false)}
        >
          <section
            id="parent-layer"
            style={{ width: 360, padding: 20, background: '#eef5ff', border: '1px solid #456' }}
          >
            Deferred parent layer
          </section>
        </DismissableLayer.Root>
      )}
      {childOpen && (
        <DismissableLayer.Root disableOutsidePointerEvents onDismiss={() => setChildOpen(false)}>
          <section
            id="child-layer"
            style={{ width: 260, padding: 16, background: 'white', border: '1px solid #222' }}
          >
            Child layer
          </section>
        </DismissableLayer.Root>
      )}
      <div id="outside" style={{ pointerEvents: 'auto', padding: 12, border: '1px dashed #777' }}>
        Click outside both layers
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Reproduction />);
