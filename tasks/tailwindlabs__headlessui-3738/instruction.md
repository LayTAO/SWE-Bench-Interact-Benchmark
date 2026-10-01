<!-- Please provide all of the information requested below. We're a small team and without all of this information it's not possible for us to help and your bug report will be closed. -->

**What package within Headless UI are you using?**

For example: @headlessui/react

**What version of that package are you using?**

For example: v2.2.4

**What browser are you using?**

For example: Chrome

**Reproduction URL**

https://codesandbox.io/p/sandbox/headlessui-comboxbox-input-bug-lmfynl

**Describe your issue**

When using the Combobox component, I have a "Clear selection" button that sets the value to null. Clicking the button with the mouse works as expected: the input clears. However, if I tab to the button and press Enter, the value is set to null (confirmed by state), but the input does not clear visually.


https://github.com/user-attachments/assets/23a45c09-0a58-43e3-9894-de6afd6f874b
