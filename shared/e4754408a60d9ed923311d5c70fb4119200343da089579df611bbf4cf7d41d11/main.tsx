import {Button} from 'react-aria-components/Button';
import {DropZone, Text} from 'react-aria-components/DropZone';
import {FileTrigger} from 'react-aria-components/FileTrigger';
import {StrictMode, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

function App() {
  let [selected, setSelected] = useState('No file selected');

  return (
    <main className="page">
      <h1>DropZone upload</h1>
      <p className="instructions">
        The upload button stays visible while the scroll container is positioned
        on the DropZone's hidden accessibility button.
      </p>
      <div className="scroll-shell" data-testid="scroll-shell">
        <div className="scroll-content">
          <div className="top-filler" aria-hidden="true" />
          <DropZone
            aria-label="DropZone"
            className="drop-zone"
            /* This option is ignored by the Buggy package and honored by Gold. */
            dropButtonStyle={{position: 'fixed', top: 0, left: 0}}
          >
            <div className="drop-inner-filler" aria-hidden="true" />
            <Text slot="label" className="drop-label">
              {selected}
            </Text>
            <FileTrigger
              acceptedFileTypes={['image/*']}
              onSelect={files => setSelected(files?.[0]?.name || 'File chooser opened')}
            >
              <Button className="upload-button">Click to upload</Button>
            </FileTrigger>
          </DropZone>
          <div className="bottom-filler" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
