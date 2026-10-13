import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ComposedModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  OverflowMenu,
  OverflowMenuItem,
} from '/subject/packages/react/src/index.ts';
import '/subject/packages/react/index.scss';

function App() {
  return (
    <>
      <span id="oracle-ready" />
      <ComposedModal open onClose={() => {}}>
        <ModalHeader>Modal with Overflow Menu</ModalHeader>
        <ModalBody>
          <OverflowMenu iconDescription="More options">
            <OverflowMenuItem itemText="Download" />
            <OverflowMenuItem itemText="Share" />
          </OverflowMenu>
          <p>Test content</p>
        </ModalBody>
        <ModalFooter
          primaryButtonText="Primary button"
          secondaryButtonText="Secondary button"
        />
      </ComposedModal>
    </>
  );
}

createRoot(document.getElementById('app')).render(<App />);
