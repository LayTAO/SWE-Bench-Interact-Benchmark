### Environment

```bash
Reka UI version: 2.9.4
```

### Link to minimal reproduction

https://reka-ui.com/docs/components/time-field

### Steps to reproduce

1. Press 0 in the hour segment repeatedly

### Describe the bug

When pressing the 0 key repeatedly in the hour segment, the focus never changes to the next segment (only happens with 12 hour locales). This is inconsistent with the behaviour of the minute and second segments, where once a value has been set, pressing another digit automatically changes focus to the next segment.

### Expected behavior

_No response_

### Context & Screenshots (if applicable)

_No response_
