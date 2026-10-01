### Environment

```bash
Reka UI version: 2.9.9
Vue version: latest
Browser: Chrome 149
```

### Link to minimal reproduction

https://stackblitz.com/edit/dkrbq9li-ztmjkhkr?file=src%2FApp.vue

### Steps to reproduce

- Add a dropdown menu to a dialog.
- Open dialog -> body receives "pointer-events:none" style
- Open menu inside dialog.
- Close menu -> body is stripped of  "pointer-events:none" style

### Describe the bug

Opening a dropdown menu inside a dialog then closing the menu again conflicts with the pointer-events styles set by the dialog.

### Expected behavior

The `pointer-events:none` style should remain on the body tag as long as the dialog remains open.

### Context & Screenshots (if applicable)

_No response_
