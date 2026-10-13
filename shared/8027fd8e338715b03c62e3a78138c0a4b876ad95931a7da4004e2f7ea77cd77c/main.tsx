import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ActionButton} from '@react-spectrum/button';
import {ContextualHelpTrigger, Item, Menu, MenuTrigger} from '@react-spectrum/menu';
import {Content} from '@react-spectrum/view';
import {Dialog} from '@react-spectrum/dialog';
import {Heading, Text} from '@react-spectrum/text';
import {Provider} from '@react-spectrum/provider';
import {theme} from '@react-spectrum/theme-default';
import './styles.css';
function App() { return <main><h1>Available contextual help item</h1><Provider theme={theme}><MenuTrigger defaultOpen><ActionButton>Menu</ActionButton><Menu selectionMode="single"><Item key="1">One</Item><ContextualHelpTrigger><Item key="foo" textValue="Hello"><Text>Hello</Text><Text slot="description">Is it me you're looking for?</Text></Item><Dialog><Heading>Lionel Richie says:</Heading><Content>I can see it in your eyes</Content></Dialog></ContextualHelpTrigger></Menu></MenuTrigger></Provider></main>; }
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);