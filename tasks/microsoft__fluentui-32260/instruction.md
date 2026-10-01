### Library

React Components / v9 (@fluentui/react-components)

### System Info

```shell
https://stackblitz.com/edit/vw2kbn?file=src%2Fexample.tsx
```


### Are you reporting an Accessibility issue?

None

### Reproduction

https://stackblitz.com/edit/vw2kbn?file=src%2Fexample.tsx

### Bug Description

I need to send a request for every change in the input. Therefore, I need a controlled input.

## Actual Behavior
1. I select several tags
2. I type "qwerty" there
3. I select "qwerty,"
4. I try to delete it by pressing the backspace key.

5. The text is not deleted; instead, the last tag is selected.

## Expected Behavior
5. The text is deleted; the last tag is not selected.

[screen-capture.webm](https://github.com/user-attachments/assets/b77287d9-c0a5-4b67-8e42-1a8500e4965a)

Probably problem [here](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-tag-picker/library/src/components/TagPickerInput/useTagPickerInput.tsx#L87)


### Logs

_No response_

### Requested priority

High

### Products/sites affected

_No response_

### Are you willing to submit a PR to fix?

no

### Validations

- [X] Check that there isn't already an issue that reports the same bug to avoid creating a duplicate.
- [X] The provided reproduction is a minimal reproducible example of the bug.
