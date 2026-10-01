### Provide a general summary of the issue here

Autocomplete input focus is inconsistent. Sometimes clicking the input field adds `data-focused="true"` attribute, sometimes it doesn't.

### 🤔 Expected Behavior?

`data-focused="true"` should be consistently added to input on input click

### 😯 Current Behavior

After hovering any option, clicking the input field doesn't focus it until a key is pressed.
After pressing a key, the input field can again be focused until any option is hovered

### 💁 Possible Solution

_No response_

### 🔦 Context

_No response_

### 🖥️ Steps to Reproduce

visit autocomplete's [storybook](https://react-spectrum.adobe.com/react-aria-starter/index.html?path=/docs/autocomplete--docs)
Path 1:
click the input field without hovering any option - it becomes focused
hover any option - option becomes focused. Input field loses focus and is unable to be focused until any keypress is provided to the input
Path 2:
hover any option - both Input field and option become focused
click out of the autocomplete box - both lose the focus.  Input field is unable to be focused until any keypress is provided to the input

the same behavior occurs in docs

### Version

react-aria-components: "1.8.0"

### What browsers are you seeing the problem on?

Chrome

### If other, please specify.

_No response_

### What operating system are you using?

mac

### 🧢 Your Company/Team

_No response_

### 🕷 Tracking Issue

_No response_
