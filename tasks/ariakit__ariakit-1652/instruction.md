### Current behavior

I just noticed the following behavior with the cancel button using `autoSelect`:

https://user-images.githubusercontent.com/943036/180314309-c62bf844-cc4f-49e5-a79f-2a47bb09a545.mov

Is it the intended behavior? If so, is there any workaround to always unselect the item after clearing the input?

### Steps to reproduce the bug

1. Open sandbox: https://codesandbox.io/s/polished-worker-5ugu3i
2. Type "a"
3. Press tab
4. Hit enter
5. Notice no item is now selected
6. Type "a" again
7. Now, click on the clear button
8. Notice the first item remains selected


### Expected behavior

Keep no item selected after clearing the input.

### Workaround

https://github.com/ariakit/ariakit/issues/1652#issuecomment-1191996711

### Possible solutions

Maybe set `hasInsertedTextRef.current = false` on the combobox `onBlur` event.

https://github.com/ariakit/ariakit/blob/66f9e3e4d9e3deb7f6bd5274f4a52e4d6c5aaefc/packages/ariakit/src/combobox/combobox.ts#L93
