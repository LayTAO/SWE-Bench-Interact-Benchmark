import React from 'react';
import ReactDOM from 'react-dom/client';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'react-aria-components';
import './styles.css';

function App() {
  return <div className="stage">
    <Tabs>
      <TabList aria-label="Sections">
        <Tab id="short">Short</Tab>
        <Tab id="tall">Tall</Tab>
      </TabList>
      <TabPanels data-testid="logical-panels" className="logical-panels">
        <TabPanel id="short"><div style={{height: 60}}>Short panel</div></TabPanel>
        <TabPanel id="tall"><div style={{height: 220}}>Tall panel</div></TabPanel>
      </TabPanels>
    </Tabs>
    <style>{`
      .logical-panels { overflow: hidden; block-size: var(--tab-panel-height); inline-size: var(--tab-panel-width); transition: block-size 400ms ease, inline-size 400ms ease; }
    `}</style>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
