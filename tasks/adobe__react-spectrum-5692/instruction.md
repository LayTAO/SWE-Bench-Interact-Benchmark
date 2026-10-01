### Provide a general summary of the issue here

The [documentation](https://react-spectrum.adobe.com/react-aria/useCalendar.html#unavailable-dates) says that while unavailable dates remain focusable, they cannot be selected. However, when keyboard users attempt to select an unavailable date, the next available previous date is selected. This is completely unexpected. Attempting to select an unavailable date with a keyboard should do nothing, just like it does with a mouse.

### 🤔 Expected Behavior?

No value should be set.

### 😯 Current Behavior

The first available date prior to the selection is selected.

### 💁 Possible Solution

It appears that this is a result #3005 making [changes](https://github.com/adobe/react-spectrum/blob/4ae2831f9487958511c88b9ebe672b5650042d7e/packages/%40react-stately/calendar/src/useCalendarState.ts#L142) to the `setValue` in  useCalendarState.ts

It looks like #3005 attempted to make it changes only when "blurring a RangeCalendar while in the middle of a selection", yet its changes appear to be affecting every time the value is changed.

A possible solution would be to completely undo the changes that #3005 makes to setValue or to modify them to only affect the blurring of a RangeCalendar in the middle of selection.

### 🔦 Context

_No response_

### 🖥️ Steps to Reproduce

Here is a modified example that makes the current date unavailable. Use the keyboard to navigate to today and attempt to select it. You will receive an alert stating yesterday's date and you will see yesterday selected.

https://codesandbox.io/p/sandbox/intelligent-shape-ghv2v2

### Version

latest

### What browsers are you seeing the problem on?

Chrome

### If other, please specify.

_No response_

### What operating system are you using?

Mac OS

### 🧢 Your Company/Team

_No response_

### 🕷 Tracking Issue

_No response_
