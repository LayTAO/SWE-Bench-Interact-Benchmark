### Environment

```bash
Reka UI version: 2.9.2
Vue version: 3.5.26
CSS framework: tailwindcss@4.1.18
Client OS: macos 26.3.1
Browser: Chrome 版本 146.0.7680.80（正式版本） (arm64)
```

### Link to minimal reproduction

https://reka-ui.com/docs/components/autocomplete

### Steps to reproduce

	1.	Focus on the Combobox input field.
	2.	Use an IME (e.g., Chinese Pinyin, Japanese Kana input).
	3.	Start typing and composing text.
	4.	Observe the behavior during composition.


### Describe the bug

When typing into the Autocomplete using an IME (Input Method Editor), the component triggers API requests during the composition phase. This results in invalid or premature requests being sent with incomplete input values.

After investigation, the root cause is that IME composition events are not properly handled. The component processes input events before the composition is finalized, leading to incorrect query parameters and unnecessary API calls.


### Expected behavior

_No response_

### Context & Screenshots (if applicable)

_No response_
