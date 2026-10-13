import {CalendarDate} from '@internationalized/date'
type Key = string | number | null
import {Button} from 'react-aria-components/src/Button'
import {Calendar, CalendarCell, CalendarGrid, CalendarStateContext} from 'react-aria-components/src/Calendar'
import {Heading} from 'react-aria-components/src/Heading'
import {Label} from 'react-aria-components/src/Label'
import {ListBox, ListBoxItem} from 'react-aria-components/src/ListBox'
import {Popover} from 'react-aria-components/src/Popover'
import {Select, SelectValue} from 'react-aria-components/src/Select'
import {useContext} from 'react'

const DEFAULT_FOCUSED = new CalendarDate(2024, 6, 15)

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const

function MonthSelect() {
  const state = useContext(CalendarStateContext)!
  const months = MONTH_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    date: state.focusedDate.set({month: index + 1})
  }))

  return (
    <Select
      aria-label="Month"
      data-testid="month-select"
      className="react-aria-Select"
      selectedKey={state.focusedDate.month}
      onSelectionChange={(key: Key | null) => {
        if (typeof key === 'number') {
          state.setFocusedDate(months[key - 1].date)
        }
      }}
    >
      <Label className="react-aria-Label">Month</Label>
      <Button data-testid="month-select-button" className="react-aria-Button">
        <SelectValue />
        <span aria-hidden="true">▼</span>
      </Button>
      <Popover className="react-aria-Popover">
        <ListBox className="react-aria-ListBox" items={months}>
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.name} className="react-aria-ListBoxItem">
              {item.name}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  )
}

function YearSelect() {
  const state = useContext(CalendarStateContext)!
  const years = Array.from({length: 41}, (_, index) => {
    const offset = index - 20
    const date = state.focusedDate.add({years: offset})
    return {
      id: index,
      name: String(date.year),
      date
    }
  })

  return (
    <Select
      aria-label="Year"
      data-testid="year-select"
      className="react-aria-Select"
      selectedKey={20}
      onSelectionChange={(key: Key | null) => {
        if (typeof key === 'number') {
          state.setFocusedDate(years[key].date)
        }
      }}
    >
      <Label className="react-aria-Label">Year</Label>
      <Button data-testid="year-select-button" className="react-aria-Button">
        <SelectValue />
        <span aria-hidden="true">▼</span>
      </Button>
      <Popover className="react-aria-Popover">
        <ListBox className="react-aria-ListBox" items={years}>
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.name} className="react-aria-ListBoxItem">
              {item.name}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  )
}

export function Repro() {
  return (
    <div className="page">
      <Calendar
        aria-label="Appointment date"
        data-testid="repro-calendar"
        className="react-aria-Calendar"
        defaultFocusedValue={DEFAULT_FOCUSED}
      >
        <header className="calendar-header">
          <Button slot="previous" className="react-aria-Button" data-testid="prev-month">
            ◀
          </Button>
          <MonthSelect />
          <YearSelect />
          <Button slot="next" className="react-aria-Button" data-testid="next-month">
            ▶
          </Button>
          <Heading className="react-aria-Heading" />
        </header>
        <CalendarGrid className="react-aria-CalendarGrid">
          {(date) => <CalendarCell date={date} className="react-aria-CalendarCell" />}
        </CalendarGrid>
      </Calendar>
    </div>
  )
}
