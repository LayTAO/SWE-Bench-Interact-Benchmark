import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as ContextMenu from '/subject/packages/react/context-menu/src/index.ts';

const item = { padding: '6px 16px', background: 'white' };
const content = { padding: 6, border: '1px solid #aaa', background: 'white' };

function App() {
  const [open, setOpen] = React.useState(false);
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 80 }}>
      <span id="oracle-ready" />
      <ContextMenu.Root onOpenChange={setOpen}>
        <ContextMenu.Trigger style={{ padding: 50, border: '1px dashed #888', background: open ? 'lightblue' : 'white' }}>
          Right Click Here
        </ContextMenu.Trigger>
        <ContextMenu.Content style={content} sideOffset={5}>
          <ContextMenu.Item style={item}>New Tab</ContextMenu.Item>
          <ContextMenu.Item style={item}>New Window</ContextMenu.Item>
          <ContextMenu.Root>
            <ContextMenu.TriggerItem style={item}>Bookmarks →</ContextMenu.TriggerItem>
            <ContextMenu.Content style={content} sideOffset={12} alignOffset={-6}>
              <ContextMenu.Item style={item}>Inbox</ContextMenu.Item>
              <ContextMenu.Item style={item}>Calendar</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Root>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </main>
  );
}
createRoot(document.getElementById('app')).render(<App />);
