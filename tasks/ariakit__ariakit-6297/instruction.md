### Current behavior

When a combobox runs without virtual focus (the [`virtualFocus`](https://ariakit.com/reference/combobox-provider#virtualfocus) store prop set to `false`, where items receive real DOM focus), pressing a modifier shortcut such as <kbd>Ctrl</kbd>+<kbd>C</kbd> / <kbd>Cmd</kbd>+<kbd>C</kbd> while a [`ComboboxItem`](https://ariakit.com/reference/combobox-item) holds DOM focus moves focus back to the combobox input and overwrites the combobox store value with the input element's current DOM value.

The culprit is `useComboboxItem`'s `onKeyDown`, which classifies a key as printable using only the key string's length, with no modifier check: [combobox-item.tsx#L160-L182](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/combobox/combobox-item.tsx#L160-L182). Modifier shortcuts like <kbd>Ctrl</kbd>+<kbd>C</kbd>, <kbd>Cmd</kbd>+<kbd>L</kbd>, or <kbd>Ctrl</kbd>+<kbd>K</kbd> all report `event.key` as a single character, so `event.key.length === 1` treats them as typing even though they never insert text — contradicting the handler's own comment about handling keys that would "fill the text field".

Every sibling printable-key check excludes Ctrl/Meta: the composite proxy helper ([composite.tsx#L58-L62](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/composite/composite.tsx#L58-L62)), `Tag`'s identical redirect-typing-to-input logic ([tag.tsx#L89-L101](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/tag/tag.tsx#L89-L101)), and `Combobox`'s own `onKeyDown`, which returns early on any modifier ([combobox.tsx#L621-L624](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/combobox/combobox.tsx#L621-L624)). This line is the only printable-key check missing the guard.

The `store?.setValue(baseElement.value)` call makes it worse than a focus jump: with `autoComplete="inline"` (or `"both"`), the input's DOM value temporarily holds the active item's value while browsing ([combobox.tsx#L206-L230](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/combobox/combobox.tsx#L206-L230)), so a stray <kbd>Cmd</kbd>+<kbd>C</kbd> commits the active item's value into the store, silently replacing what the user typed.

Note this isn't limited to apps that opt into `virtualFocus={false}`: on touch Safari the store forces virtual focus off for every combobox to work around missing `aria-activedescendant` support ([combobox-store.ts#L134-L145](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-components/src/combobox/combobox-store.ts#L134-L145)), so any iPad user with a hardware keyboard hits this. Default virtual-focus comboboxes are unaffected (the `hasFocus(baseElement)` guard bails first).

### Steps to reproduce the bug

1. Open https://stackblitz.com/github/ariakit/ariakit/tree/main/templates/react?file=src%2Fapp.tsx
2. Replace `src/app.tsx` with the code below.
3. Click the "Fruit" combobox input and type `b`. The popover opens and the `<output>` below shows the value `b`.
4. Press <kbd>ArrowDown</kbd>. Since virtual focus is off, real DOM focus moves to the "Apple" option, and inline autocomplete temporarily shows "Apple" in the input.
5. Press <kbd>Ctrl</kbd>+<kbd>C</kbd> (<kbd>Cmd</kbd>+<kbd>C</kbd> on macOS).
6. Focus jumps back to the combobox input, and the value is overwritten: the `<output>` now shows `Apple` instead of `b`.

```tsx
import * as Ariakit from "@ariakit/react";
import { useState } from "react";

export default function App() {
  const [value, setValue] = useState("");
  return (
    <>
      <Ariakit.ComboboxProvider
        virtualFocus={false}
        value={value}
        setValue={setValue}
      >
        <label>
          Fruit
          <Ariakit.Combobox autoComplete="inline" />
        </label>
        <Ariakit.ComboboxPopover>
          <Ariakit.ComboboxItem value="Apple" />
          <Ariakit.ComboboxItem value="Banana" />
          <Ariakit.ComboboxItem value="Cherry" />
        </Ariakit.ComboboxPopover>
      </Ariakit.ComboboxProvider>
      <output>{value}</output>
    </>
  );
}
```

Verified with a Playwright test driving only real user interactions (click, type, <kbd>ArrowDown</kbd>, `Control+c`): after the shortcut, the focused element is the input rather than the option, and the store value reads `Apple` instead of `b`.

### Expected behavior

A modifier shortcut is a command, not typing. <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+letter pressed on a DOM-focused item should leave focus on the item and leave the combobox value untouched — the same convention `Composite`, `Tag`, and `Combobox` itself already follow, and the same convention the test suite relies on (holding <kbd>Ctrl</kbd> is the documented way to press a key on a DOM-focused item without typing into the input).

### Workaround

Pass an `onKeyDown` to each `ComboboxItem` that prevents the default action for modifier+single-character keys (the internal handler bails when `event.defaultPrevented` is set). Keep <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>V</kbd> untouched so pasting while an item is focused still redirects to the input:

```tsx
function onItemKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  const modifier = event.ctrlKey || event.metaKey;
  if (!modifier) return;
  if (event.key.length !== 1) return;
  // Let Cmd/Ctrl+V through so the pasted text still lands in the input.
  if (event.key === "v" || event.key === "V") return;
  event.preventDefault();
}

<Ariakit.ComboboxItem value="Apple" onKeyDown={onItemKeyDown} />;
```

Caveat: `preventDefault` on keydown also suppresses the browser's default action for that shortcut while an item is focused (rarely relevant, since no text is selected inside an option).

### Possible solutions

Apply the same Ctrl/Meta guard used by `composite.tsx` and `tag.tsx`, plus `tag.tsx`'s <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>V</kbd> carve-out — the paste case matters because today the keydown microtask focuses the input before the `paste` event dispatches, so the pasted text lands in the input; a bare modifier guard would regress that:

```diff
-      const printable = event.key.length === 1;
-      if (printable || event.key === "Backspace" || event.key === "Delete") {
+      const printable =
+        event.key.length === 1 && !event.ctrlKey && !event.metaKey;
+      // If it's cmd/ctrl+v, focus on the text field so the value is pasted
+      // there.
+      const modifier = isApple() ? event.metaKey : event.ctrlKey;
+      const paste = modifier && (event.key === "v" || event.key === "V");
+      const deleteKey = event.key === "Backspace" || event.key === "Delete";
+      if (printable || paste || deleteKey) {
         queueMicrotask(() => baseElement.focus());
```

(`isApple` comes from `@ariakit/utils`, already used the same way in `tag.tsx`.) Backspace/Delete stay unguarded as today (<kbd>Ctrl</kbd>+<kbd>Backspace</kbd> is delete-word, an editing intent), and `altKey` is deliberately not excluded since Option/AltGr produce printable characters — matching the tradeoff in `composite.tsx` and `tag.tsx`. Returning early on any modifier (like `combobox.tsx`'s own handler) would regress paste and break Option+letter typing on macOS.

*Found by an automated multi-agent audit of the repo at commit [`11bd4458d`](https://github.com/ariakit/ariakit/tree/11bd4458de6447b996dd882ea0c85eb801a6cd03) and verified with a real-browser Playwright reproduction (user-level interactions only).*
