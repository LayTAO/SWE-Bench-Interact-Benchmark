### Environment

```bash
Reka UI version: 2.8.2
```

### Link to minimal reproduction

https://stackblitz.com/edit/pne2jna8?file=package.json

### Steps to reproduce

1. Open the reproduction link
2. Open the dropdown by clicking on the "mixer" button - the popover works as expected
3. Click on the "reload" button - this will swap out the button
4. Open the dropdown again by clicking on the "mixer" button - the popover is not positioned correctly

I know that normally you would swap out the icon only, but the usage in my project is much more complex and this is a valid scenario where the component the popover is attached to can change.

### Describe the bug

When using the `Popover` component and using asChild on the trigger, the popover wouldn't react to the element being swapped and the popover is positioned in the wrong place.

### Expected behavior

The component should pick up the update reference and position the popover correctly.

### Context & Screenshots (if applicable)

_No response_
