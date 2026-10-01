### Environment

```bash
Developement/Production OS: MacOS Tahoe 26.4 (25E246)
Node version: v20.12.0
Package manager: pnpm v8.15.6
Reka UI version: 2.9.6
Vue version: 3.5.32
Client OS: MacOS Tahoe 26.4
Browser: Chrome 146.0.7680.178 (arm64)
```

### Link to minimal reproduction

[CodeSandbox](https://codesandbox.io/p/devbox/rekaui-issue-pc4rfl)

### Steps to reproduce

1. Set the `DatePickerRoot` prop `granularity="minute"` (or any value that enables time selection)
2. Create a `ref` with a date object from `@internationalized/date` (`CalendarDateTime` or `ZonedDateTime`) with a non-zero time value
3. Bind it to `DatePickerRoot` using `v-model`
4. Clear the date programmatically (set it to `undefined` or `null`)
5. Select any date via the `DatePickerCalendar`
6. Observe that the time is restored to the initial value from step 1, instead of being reset to `00:00:00`

### Describe the bug

`DatePickerRoot` unexpectedly restores the previously selected time value instead of resetting it to 00:00:00

See reproduction link.

### Expected behavior

`DatePickerRoot` emits an `update:modelValue` event with a date object where the time is set to the minimum value (00:00:00)

### Context & Screenshots (if applicable)

_No response_
