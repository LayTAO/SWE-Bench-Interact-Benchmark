### Current behavior

A portaled [Popover](https://ariakit.com/reference/popover) whose content starts with a non-focusable selector match — e.g. the common custom file upload pattern of a `display: none` `<input type="file">` followed by a visible "Choose file" button — handles focus correctly on the first open: the visible button is auto-focused. But after closing the popover and reopening it from the disclosure, the popover opens without receiving focus at all. `document.activeElement` stays on the disclosure button outside, and the visible button inside is left with the `tabindex="-1"` that `preserveTabOrder` set on it, so the popover content isn't even reachable with <kbd>Tab</kbd> from the disclosure. Keyboard and screen reader users are left outside the popover they just opened.

What happens under the hood: with [`portal`](https://ariakit.com/reference/popover#portal) and the default `preserveTabOrder`, the Portal's `focusout` handler calls `disableFocusIn(portalNode, true)` when focus leaves the portal ([portal.tsx#L178-L204](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/portal/portal.tsx#L178-L204)), setting `tabindex="-1"` on every tabbable element inside ([focus.ts#L373-L381](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-utils/src/focus.ts#L373-L381)). Closing via the disclosure triggers exactly this (focus moves to the disclosure on mousedown, the popover only closes on click, and the disable runs on an animation frame in between), and nothing restores the tabindex until focus re-enters the portal.

On reopen, the Dialog autofocus therefore finds zero tabbable elements and relies on the fallback designed for this very flow — its comment says "We have to fallback to the first focusable element otherwise portaled dialogs with preserveTabOrder set to true will not receive focus properly" ([dialog.tsx#L350-L375](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/dialog/dialog.tsx#L350-L375)). But the `fallbackToFocusable` branch of `getAllTabbableIn` returns the raw `querySelectorAll` matches without any `isFocusable` filtering ([focus.ts#L127-L157](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-utils/src/focus.ts#L127-L157), `return elements;` at L153–155). The first raw match here is the `display: none` file input. `isFocusable` would reject it ([focus.ts#L27-L32](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-utils/src/focus.ts#L27-L32)), but the fallback never checks. Since the returned element is truthy, the dialog's own `|| contentElement` last resort is bypassed, and `element.focus()` on a `display: none` element is a silent no-op — so focus simply never moves.

`FormLabel` is exposed to the same fallback with `fallbackToFocusable` hardcoded to `true` ([form-label.tsx#L87-L95](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/form/form-label.tsx#L87-L95)): clicking the label of a custom field can focus/click a hidden element instead of a visible focusable one.

### Steps to reproduce the bug

1. Open https://stackblitz.com/github/ariakit/ariakit/tree/main/templates/react?file=src%2Fapp.tsx
2. Replace `src/app.tsx` with the code below.
3. Click the **Attachments** button. The popover opens and the **Choose file** button receives focus (correct).
4. Click the **Attachments** button again, at ordinary speed, to close the popover.
5. Click the **Attachments** button once more to reopen the popover.

The popover opens, but focus stays on the **Attachments** disclosure instead of moving to **Choose file** like it did on the first open (and <kbd>Tab</kbd> won't reach the button either, since it still has `tabindex="-1"`).

```tsx
import * as Ariakit from "@ariakit/react";
import { useRef, useState } from "react";

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("No file selected");
  return (
    <Ariakit.PopoverProvider>
      <Ariakit.PopoverDisclosure>Attachments</Ariakit.PopoverDisclosure>
      <Ariakit.Popover portal aria-label="Attachments">
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.item(0);
            setFileName(file ? file.name : "No file selected");
          }}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Choose file
        </button>
        <output>{fileName}</output>
      </Ariakit.Popover>
    </Ariakit.PopoverProvider>
  );
}
```

This was verified with a Playwright test driving only user-level interactions (clicks), where the reopen assertion fails with focus on the disclosure and the inner button resolving to `<button type="button" tabindex="-1" data-tabindex="">Choose file</button>`.

### Expected behavior

Reopening the popover should move focus to the first focusable element inside it — the visible **Choose file** button — exactly as the first open does, and as the autofocus comment in `dialog.tsx` promises. If no focusable element existed at all, focus should land on the popover element itself (the `|| contentElement` last resort).

### Workaround

Point [`initialFocus`](https://ariakit.com/reference/popover#initialfocus) at the visible control, which bypasses the broken fallback (the button is still focusable while `preserveTabOrder` has it at `tabindex="-1"`, so focusing it also restores the tab order):

```tsx
const chooseFileRef = useRef<HTMLButtonElement>(null);
// ...
<Ariakit.Popover portal aria-label="Attachments" initialFocus={chooseFileRef}>
  {/* ... */}
  <button ref={chooseFileRef} type="button" onClick={() => fileInputRef.current?.click()}>
    Choose file
  </button>
</Ariakit.Popover>
```

Verified: the same Playwright test passes with this change. Alternatively, rendering the hidden input after the visible button also avoids the bug, but only by accident of DOM order.

### Possible solutions

Make the `fallbackToFocusable` branch of `getAllTabbableIn` return focusable elements, e.g. by delegating to `getAllFocusableIn` (which filters with `isFocusable` and expands iframes like the tabbable path):

```diff
   if (!tabbableElements.length && fallbackToFocusable) {
-    return elements;
+    return getAllFocusableIn(container);
   }
   return tabbableElements;
```

Note that `includeContainer` should not be forwarded here: `getAllFocusableIn` unshifts the container unconditionally before filtering ([focus.ts#L75-L96](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-utils/src/focus.ts#L75-L96)), and the dialog content element is focusable by default (`tabIndex={-1}`, [dialog.tsx#L581](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/dialog/dialog.tsx#L581)), so forwarding it would make the fallback return the container ahead of its focusable children — changing the autofocus target and shadowing the dialog's own `|| contentElement` last resort. The current fallback never includes the container, so omitting it preserves the children-only semantics both in-repo callers (Dialog, FormLabel) were written against. A more minimal alternative is `return elements.filter(isFocusable);`, at the cost of staying inconsistent with the iframe expansion in the rest of the file.

Since `getAllTabbableIn`, `getFirstTabbableIn`, and `getLastTabbableIn` are public `@ariakit/utils` exports, the change should ship with a patch changeset.

*Found by an automated multi-agent audit of the repo at commit [`11bd4458d`](https://github.com/ariakit/ariakit/tree/11bd4458de6447b996dd882ea0c85eb801a6cd03) and verified with a real-browser Playwright reproduction (user-level interactions only).*
