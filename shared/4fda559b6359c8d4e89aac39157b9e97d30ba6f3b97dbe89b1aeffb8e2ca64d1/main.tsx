import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {CalendarDate} from '@internationalized/date';
import {DateField, DateInput, DateSegment, I18nProvider, Label} from 'react-aria-components';
import './styles.css';
function App() { return <I18nProvider locale="en-US"><main><h1>DateField Enter behavior</h1><DateField defaultValue={new CalendarDate(2024,12,31)}><Label>Birth date</Label><DateInput>{segment=><DateSegment segment={segment}/>}</DateInput></DateField></main></I18nProvider>; }
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
