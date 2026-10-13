import React, {useState} from 'react';
import ReactDOM from 'react-dom/client';
import {runAfterTransition} from 'react-spectrum-run-after-transition';
import './styles.css';

function App() {
  const [status, setStatus] = useState('not run');
  const reproduce = () => {
    setStatus('waiting');
    const element = document.createElement('div');
    element.id = 'detached-transition';
    document.body.appendChild(element);
    element.dispatchEvent(new TransitionEvent('transitionrun', {
      propertyName: 'width',
      bubbles: true
    }));
    element.remove();
    runAfterTransition(() => setStatus('callback fired'));
  };
  return <div className="stage">
    <button id="run-detached-transition" onClick={reproduce}>Run detached transition</button>
    <output id="callback-status">{status}</output>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
