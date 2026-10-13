import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { AppProvider, Popover } from '/subject/polaris-react/build/esm/index.js';
import translations from '/subject/polaris-react/locales/en.json';
import '/subject/polaris-react/build/esm/styles.css';

function Reproduction() {
  const [active, setActive] = useState(false);
  const close = useCallback(() => setActive(false), []);
  const activator = (
    <button id="focus-target" type="button" onClick={() => setActive(true)}>
      Open popover
    </button>
  );
  return (
    <AppProvider i18n={translations}>
      <main style={{ fontFamily: 'sans-serif', padding: 32 }}>
        <span id="oracle-ready" />
        <h1>Popover Escape focus</h1>
        <Popover
          active={active}
          activator={activator}
          autofocusTarget="first-node"
          onClose={close}
        >
          <div style={{ padding: 20 }}>
            <button id="popover-action" type="button">
              Popover action
            </button>
          </div>
        </Popover>
        <button id="focus-target2" type="button">
          Next focus target
        </button>
      </main>
    </AppProvider>
  );
}

ReactDOM.render(<Reproduction />, document.getElementById('app'));
