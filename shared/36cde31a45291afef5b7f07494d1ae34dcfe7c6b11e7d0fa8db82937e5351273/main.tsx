import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Button, Calendar, CalendarCell, CalendarGrid, Heading, I18nProvider} from 'react-aria-components';
import {CalendarDate} from '@internationalized/date';
import './styles.css';
function App() { return <I18nProvider locale="en-US"><main className="page"><h1>Unavailable date selection</h1><Calendar aria-label="Appointment date" defaultValue={new CalendarDate(2019, 6, 16)} isDateUnavailable={date => date.day === 15}><header><Button slot="previous">Previous month</Button><Heading /><Button slot="next">Next month</Button></header><CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid></Calendar></main></I18nProvider>; }
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
