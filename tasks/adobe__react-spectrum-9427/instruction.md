### Provide a general summary of the issue here

The [Month & Year picker example in the Calendar docs](https://react-aria.adobe.com/Calendar#month-and-year-pickers) has problematic focus behaviour. When you select a month or year, it auto-focuses a date in the calendar grid.

This breaks keyboard input:

- Aria Select allows selection of an entry by typing its label, but that does not work here. The first keypress that finds a valid month/year selects that month/year and takes focus away. E.g. you want to type JUL for July, but the J keystroke selects January and then changes focus.

- You cannot use keyboard input to easily select both Month and Year, as after selecting Month focus shifts to the grid, and  you then have to shift-tab twice to get back from the grid to Year.

I don't know if this is simply a limitation of the docs example that can be resolved by improving the example, or if it's currently beyond the capability of Calendar.

### 🤔 Expected Behavior?

Selecting a value in the month/year dropdowns should not focus the grid - focus should remain with the dropdown:

- Tabbing to the Month dropdown and typing "Jul" should select January on press of J, then June on press of U, then July on press of L. Focus remains with the Month dropdown.

- Tabbing to the Year dropdown and typing "2024" should select "2005" on press of 2 (as 2005 is first available year in the example as of today), no change on press of 0, 2020 on press of 2, and 2024 on press of 4. Focus remains with the year dropdown.

- After selecting a value in the Month dropdown by any method, you should be able to press tab to focus the Year dropdown, allowing easy keyboard input of both month and year

### 😯 Current Behavior

- Tabbing to the Month dropdown and typing "Jul" selects January on press of J, then immediately shifts focus to the date grid. Selecting month with keyboard by typing is impossible if first keypress matches a different month, only arrow/enter will work.

- Tabbing to the Year dropdown and typing "2025" selects "2005" on press of 2, then immediately shifts focus to the date grid. Selecting year with keyboard by typing is impossible if first keypress matches a different month, only arrow/enter will work.

- After selecting a value in the Month dropdown by any method, focus shifts to the date grid. The user must then press shift-tab twice to get to the Year dropdown.

### 💁 Possible Solution

The example uses state.setFocusedDate() to update what month the calendar grid is displaying, without saving those changes. It appears that changing the displayed month in this way also auto-focuses the grid?

If it is possible to update the focusedDate without auto-focusing the grid, update the example to use that method.

If it is not possible, maybe update setFocusedDate() with a new arg that allows the caller to specify if the grid should be auto-focused or not? And update the example accordingly.

### 🔦 Context

Full and easy keyboard input capability for the Month and Year picker dropdowns, as with any other use of Aria Select.

### 🖥️ Steps to Reproduce

- Go to the [Month & Year picker example in the Calendar docs](https://react-aria.adobe.com/Calendar#month-and-year-pickers)
- Attempt to use pure keyboard input to select both Month and Year
  - (try value selection by typing, and by arrow/enter)

### Version

Latest I assume? Whichever drives the docs

### What browsers are you seeing the problem on?

Microsoft Edge, Firefox

### If other, please specify.

_No response_

### What operating system are you using?

Windows 11

### 🧢 Your Company/Team

_No response_

### 🕷 Tracking Issue

_No response_
