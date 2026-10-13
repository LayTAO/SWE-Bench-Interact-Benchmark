import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Tab, TabList, TabPanel, Tabs} from 'react-aria-components';
import './styles.css';

function App() {
  return <main><h1>Tabs focus state</h1><Tabs defaultSelectedKey="one"><TabList aria-label="Sections"><Tab id="one">One</Tab><Tab id="two">Two</Tab></TabList><TabPanel id="one">One content</TabPanel><TabPanel id="two">Two content</TabPanel></Tabs></main>;
}
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);