## Bug report

### Current Behavior

When rendering a `Modal` inside a `DropdownMenu` any `input`, `textarea`, etc will have the `Space` and `Enter` keys intercepted. It is not possible to type `Space` or `Enter` into the `input` fields.

### Expected behavior

`Space` and `Enter` should work when `input` is focused the same way it does, when not rendered inside a Modal inside a DropdownMenu

### Reproducible example

[CodeSandbox](https://codesandbox.io/p/sandbox/lucid-sun-s46ts4)

### Your environment

See sandbox

<!-- Very important for us to help you debug. Please fill this out! -->

| Software         | Name(s) | Version |
| ---------------- | ------- | ------- |
| Radix Package(s) | | `latest`  |
| React            | n/a     |  `17.0.1`  |
| Browser          |  Chrome, FF, Safari  |   n/a  |
| Assistive tech   |         |         |
| Node             | n/a     |         |
| npm/yarn         |         |         |
| Operating System |         |         |
