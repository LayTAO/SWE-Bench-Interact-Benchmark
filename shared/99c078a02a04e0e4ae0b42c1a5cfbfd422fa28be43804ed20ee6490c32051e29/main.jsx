import React from 'react';
import ReactDOM from 'react-dom/client';
import {Button, Tooltip, TooltipTrigger} from 'react-aria-components';
import './styles.css';

function App() {
  return <div className="stage" style={{paddingTop: 220, paddingLeft: 280}}>
    <TooltipTrigger delay={0} closeDelay={1000}>
      <Button id="tooltip-trigger">Show help</Button>
      <Tooltip placement="top" className="scaled-tooltip">Scaled tooltip</Tooltip>
    </TooltipTrigger>
    <style>{`
      .scaled-tooltip { padding: 12px 18px; color: white; background: #172033; border-radius: 6px; transition: scale 8s linear; transform-origin: var(--trigger-origin); }
      .scaled-tooltip[data-entering] { scale: 0.15; }
    `}</style>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
