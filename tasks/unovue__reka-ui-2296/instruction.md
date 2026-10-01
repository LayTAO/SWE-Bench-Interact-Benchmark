### Environment

Not applicable. See description.

```bash
Development/Production OS: macOS 15.7
Node version: N/A
Package manager: N/A
Reka UI version: 2.6.0
Vue version: 3.5.24
Nuxt version: N/A
Nuxt mode: N/A
Nuxt target: N/A
CSS framework: N/A
Client OS: Any
Browser: Any
```

### Link to minimal reproduction

https://stackblitz.com/edit/afauw766?file=src%2FApp.vue

### Steps to reproduce

Given a page that has a DropdownMenu (with `:modal="false"`), a button/trigger, and at least one other focusable element:

1. Tab to focus the menu trigger
2. Press `Enter` to activate the menu
3. Press `Tab` to attempt to move focus out of the menu and on to the next item on the page, per the [keyboard interaction pattern for menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboardinteraction). Note that the `Tab`/focus behavior is completely disabled.

### Describe the bug

When the user's focus is within an open, non-modal DropdownMenu and they press the `Tab` key, nothing happens.

### Expected behavior

I expect focus to move from the DropdownMenu to the next focus-able element on the page, per the [keyboard interaction pattern for menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboardinteraction).


### Context

[This section of code](https://github.com/unovue/reka-ui/blob/1e0670da1d9cf9652cb4cf89aa2015265dbd60d0/packages/core/src/Menu/MenuContentImpl.vue#L197-L199) seems to be what kills the `Tab` keypress event:

```ts
if (isKeyDownInside) {
    // menus should not be navigated using tab key so we prevent it
    if (event.key === 'Tab')
      event.preventDefault()
```

It seems the intent was to prevent the `Tab` key from navigating focus between menu items. That _intent_ is correct, as navigation should only happen with Arrow keys. However, that should not be implemented by completely disabling the `Tab` key.

### Non-Solutions

These "solutions" were considered and are not acceptable:

1. Implementing another `Tab` keypress handler on my component that uses DropdownMenu, calling `preventDefault`, and either:
   a. Manually finding the next "focusable" DOM element on the page and calling .focus() on it. (Or a previous DOM element in the case of Shift+Tab)
   b. Re-emitting a `Tab` keypress event outside of DropdownMenu in hopes that it will trigger the browser's default `Tab`/focus handling behavior

### Possible Fixes

In all cases, remove the `preventDefault` call on the `Tab` keypress event, then one or more of:

1. Correctly implement roving tabindex by setting `tabindex="-1"` on all items except for the currently-selected one
2. Provide a configuration option that allows us to turn off the section of code that kills the `Tab` key to allow library consumers to (optionally) handle it ourselves.
