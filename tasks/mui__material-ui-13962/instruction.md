Modal manage crashes on this [line](https://github.com/mui-org/material-ui/blob/f7c1a216cf396f0f942e0fe1c2e9a2d6796b716b/packages/material-ui/src/Modal/ModalManager.js#L130) while jumping between popovers.

https://codesandbox.io/s/049kpv0kzv

<!-- Checked checkbox should look like this: [x] -->
- [x] This is not a v0.x issue. <!-- (v0.x is no longer maintained) -->
- [x] I have searched the [issues](https://github.com/mui-org/material-ui/issues) of this repository and believe that this is not a duplicate.

## Expected Behavior 🤔
User be able to switch between popovers without crashes

## Current Behavior 😯
App crashes

## Steps to Reproduce 🕹


Link:
https://codesandbox.io/s/049kpv0kzv
1. go over popover A
2. go over popover B


| Tech         | Version |
|--------------|---------|
| Material-UI  | v3.7.0  |
| React        |         |
| Browser      |         |
| TypeScript   |         |
| etc.         |         |
