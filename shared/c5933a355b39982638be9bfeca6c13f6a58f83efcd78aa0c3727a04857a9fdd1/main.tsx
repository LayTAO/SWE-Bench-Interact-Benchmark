import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Button, Tooltip, TooltipTrigger} from 'react-aria-components';
import './styles.css';
function App() { return <main><h1>Tooltip child properties</h1><TooltipTrigger><Button excludeFromTabOrder>Check my tabindex</Button><Tooltip>hello world</Tooltip></TooltipTrigger><TooltipTrigger><Button>Check my tabindex normally</Button><Tooltip>hello world</Tooltip></TooltipTrigger></main>; }
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);