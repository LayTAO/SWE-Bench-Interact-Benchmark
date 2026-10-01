### Steps to reproduce

Steps:
1. Open this link to live example: https://codesandbox.io/embed/jkw2qf?module=/src/Demo.tsx&fontsize=12
2. Mouse Down and hold down for the menu to open.


### Current behavior

Currently the Select component is failing the [WCAG 2.5.2](https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation.html) success criterion, which requires functionality to be operated using a single pointer.  In this case the combination of "No Down-event" and "Up reversal".

Currently the menu opens up on the mouse down, and it remains open even if moving away and releasing the mouse.

### Expected behavior

A key aspect to meeting the Pointer Cancellation criteria is providing a way to easily undo or abort the functionality.  So I would expect one of two behaviors:
- Do not activate the select menu on mouse down, but only on mouse-up.  This is the solution proposed by W3C in thir Select-Only combobox example: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/

It is also how apps like Github and Microsoft Teams work for their select-like operations.

- Mouse Down continues to open the menu, but navigating away from the menu and releasing the mouse click should cause the menu to dismiss.  This matches the behavior of the native select input (at least on Mac)

### Context

This was identified in as a accessibility concern for users of our software.

### Your environment

<details>
  <summary><code>npx @mui/envinfo</code></summary>
  Currently on MUI5, but in process of upgrading, but issue remains in Mui6.

  System:
    OS: macOS 15.3
  Binaries:
    Node: 22.14.0 - /private/var/folders/jv/xsd25_n518v97x_98dbjbmn40000gp/T/xfs-d414690d/node
    npm: 10.9.2 - ~/.local/state/fnm_multishells/44298_1739490378994/bin/npm
    pnpm: Not Found
  Browsers:
    Chrome: 133.0.6943.98
    Edge: 133.0.3065.59
    Safari: 18.3
  npmPackages:
    @emotion/react:  11.9.0
    @emotion/styled:  11.13.0
    @mui/core-downloads-tracker:  5.16.7
    @mui/material:  5.16.7
    @mui/private-theming:  5.16.6
    @mui/styled-engine:  5.16.6
    @mui/styles:  5.16.7
    @mui/system:  5.16.7
    @mui/types:  7.2.21
    @mui/utils:  5.16.6
    @mui/x-date-pickers:  7.24.1
    @mui/x-internals:  7.24.1
    @types/react: ^17.0.80 => 17.0.80
    react: ^17.0.2 => 17.0.2
    react-dom: ^17.0.2 => 17.0.2
    styled-components:  5.3.0
    typescript: ~5.5.4 => 5.5.4
</details>


**Search keywords**: select wcag pointer cancellation
