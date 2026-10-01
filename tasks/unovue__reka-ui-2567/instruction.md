### Environment

```bash
Reka UI version: 2.8.0
```

### Link to minimal reproduction

https://stackblitz.com/edit/vitejs-vite-ms9dg4r5?file=src%2FApp.vue

### Steps to reproduce

1. Type the value 0 in any segment of the TimeField, then change focus either manually or automatically
2. Go back to the previous segment and type any number other than 0

### Describe the bug

If previous segment has an already set value of 0, when trying to modify it, inputing any number other than 0 will move the focus to the next segment even if the value is not yet complete.

### Expected behavior

_No response_

### Context & Screenshots (if applicable)

_No response_
