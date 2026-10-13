import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FloatingTree, FloatingNode, FloatingPortal, FloatingFocusManager,
  useFloating, useFloatingNodeId } from '@floating-ui/react';

function Submenu({ open }: { open: boolean }) {
  const id = useFloatingNodeId();
  const { refs, context, floatingStyles } = useFloating({ nodeId: id, open, placement: 'right-start' });
  return <FloatingNode id={id}>
    <div ref={refs.setReference} role="menuitem" id="nested-trigger">More formats</div>
    {open && <FloatingPortal><FloatingFocusManager context={context} initialFocus={-1} returnFocus={false}>
      <div ref={refs.setFloating} role="menu" data-testid="submenu" style={{ ...floatingStyles, background: '#eee', padding: 20 }}>
        <div role="menuitem" tabIndex={-1}>Plain text</div>
        <div role="menuitem" tabIndex={-1}>Rich text</div>
      </div>
    </FloatingFocusManager></FloatingPortal>}
  </FloatingNode>;
}

function Combobox() {
  const [open, setOpen] = useState(false);
  const [nested, setNested] = useState(false);
  const [navigated, setNavigated] = useState(false);
  const id = useFloatingNodeId();
  const { refs, context, floatingStyles } = useFloating({ nodeId: id, open, onOpenChange: setOpen });
  return <FloatingNode id={id}>
    <label>Format <input ref={refs.setReference} role="combobox" aria-expanded={open}
      aria-controls="root-menu" aria-activedescendant={navigated ? 'nested-trigger' : undefined}
      data-testid="combobox" onClick={() => setOpen(true)} onKeyDown={event => {
        if (event.key === 'ArrowDown') { setNavigated(true); event.preventDefault(); }
        if (event.key === 'ArrowRight' && navigated) { setNested(true); event.preventDefault(); }
      }} /></label>
    {open && <FloatingPortal><FloatingFocusManager context={context} initialFocus={-1}>
      <div ref={refs.setFloating} id="root-menu" role="menu" style={{ ...floatingStyles, padding: 20, border: '1px solid' }}>
        <Submenu open={nested} />
      </div>
    </FloatingFocusManager></FloatingPortal>}
  </FloatingNode>;
}

createRoot(document.getElementById('app')!).render(
  <main id="oracle-ready" style={{ margin: 60 }}><FloatingTree><Combobox /></FloatingTree></main>,
);
