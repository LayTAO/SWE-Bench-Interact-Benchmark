### Current behavior

The [`getPersistentElements`](https://ariakit.com/reference/dialog#getpersistentelements) prop documents that the returned elements "will be considered as part of the dialog", excluding them from the close-on-outside-interaction behavior (this is the documented [Dialog with React-Toastify](https://ariakit.com/examples/dialog-react-toastify) pattern).

However, when the dialog hasn't been focused yet — which is the entire lifetime of a dialog rendered with [`autoFocusOnShow`](https://ariakit.com/reference/dialog#autofocusonshow)`={false}`, a common choice for non-modal panels that shouldn't steal focus — focusing or clicking an input inside a persistent element closes the dialog. Right-click (`contextmenu`) on a persistent element follows the same code path. After the user focuses something inside the dialog once, the identical interaction correctly keeps it open, so the failure is focus-history dependent and easy to miss in testing.

The root cause is that the persistent-element protection is purely negative: persistent elements are merely excluded from the "outside" marking applied by [`markTreeOutside`](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/dialog/dialog.tsx#L300-L318), so the only thing that saves them in the outside listeners is the `isElementMarked` check. But in `useEventOutside`, that check is gated on `focusedRef.current`, which only becomes true after something inside the dialog has been focused ([use-hide-on-interact-outside.ts#L98-L102](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/dialog/utils/use-hide-on-interact-outside.ts#L98-L102)):

```ts
// We need to check if the content element has been focused at least once
// before checking if it's marked. This is so hovercards and tooltips
// don't stay open when new nodes are added to the DOM and focused.
const focused = focusedRef.current;
if (focused && !isElementMarked(target, contentElement.id)) return;
// Finally, if the target has been marked as "outside" or is an ancestor
// of the content element, we call the listener.
callListener(event);
```

While `focused` is `false`, every other guard passes for a persistent element (it's not contained in `contentElement`, not the disclosure, etc.), so the [`focusin` listener](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/dialog/utils/use-hide-on-interact-outside.ts#L159-L170) calls `store.hide()`. The [`contextmenu` listener](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/dialog/utils/use-hide-on-interact-outside.ts#L172-L182) has the same shape. Only `click` is safe, because it [independently re-checks the mark](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/dialog/utils/use-hide-on-interact-outside.ts#L150) on the previously mousedown'd element.

The `focused` gate was added for hovercards/tooltips (so they close when brand-new DOM nodes appear and get focused — see #6198), but persistent elements are the opposite case: the dialog explicitly knows about them at open time, yet the gate treats them like unknown outsiders.

### Steps to reproduce the bug

1. Open https://stackblitz.com/github/ariakit/ariakit/tree/main/templates/react?file=src%2Fapp.tsx
2. Replace `src/app.tsx` with the code below.
3. Click **Open dialog**. The non-modal dialog appears without taking focus (`autoFocusOnShow={false}`).
4. Without clicking inside the dialog, click the **Notification field** input inside the persistent "Notifications" region (or focus it with <kbd>Tab</kbd>, or right-click it).
5. The dialog closes.

For contrast: reopen the dialog, click **Inside field** first, then click **Notification field** — the dialog stays open, as documented.

```tsx
import * as Ariakit from "@ariakit/react";
import { useRef, useState } from "react";

export default function App() {
  const [open, setOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "start" }}>
      <Ariakit.Button onClick={() => setOpen(true)}>Open dialog</Ariakit.Button>

      <Ariakit.Dialog
        open={open}
        onClose={() => setOpen(false)}
        modal={false}
        autoFocusOnShow={false}
        getPersistentElements={() => {
          const notifications = notificationsRef.current;
          return notifications ? [notifications] : [];
        }}
        style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "start", border: "1px solid gray", padding: 16 }}
      >
        <Ariakit.DialogHeading>Dialog</Ariakit.DialogHeading>
        <input aria-label="Inside field" placeholder="Inside field" />
        <Ariakit.DialogDismiss>Close dialog</Ariakit.DialogDismiss>
      </Ariakit.Dialog>

      <div
        ref={notificationsRef}
        role="region"
        aria-label="Notifications"
        style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "start", border: "1px solid gray", padding: 16 }}
      >
        <input aria-label="Notification field" placeholder="Notification field" />
        <button type="button">Dismiss notification</button>
      </div>
    </div>
  );
}
```

Verified with a Playwright test driving real user interactions in Chrome: clicking the persistent field before focusing the dialog hides it, while the same click after focusing inside the dialog keeps it open.

### Expected behavior

Elements returned by `getPersistentElements` should be treated as part of the dialog regardless of whether the dialog has been focused yet. Focusing, clicking, or right-clicking inside a persistent element should never close the dialog — exactly as already happens once the dialog has been focused once.

### Workaround

Re-assert the persistent elements through [`hideOnInteractOutside`](https://ariakit.com/reference/dialog#hideoninteractoutside), which is consulted before hiding on every code path:

```tsx
<Ariakit.Dialog
  // ...
  getPersistentElements={() => {
    const notifications = notificationsRef.current;
    return notifications ? [notifications] : [];
  }}
  hideOnInteractOutside={(event) => {
    const notifications = notificationsRef.current;
    if (!notifications) return true;
    if (!(event.target instanceof Node)) return true;
    return !notifications.contains(event.target);
  }}
>
```

Keeping `getPersistentElements` is still useful (it also controls the accessibility tree/inert handling for modal dialogs). Verified: with this callback the dialog stays open in the failing scenario.

### Possible solutions

Make the protection for the dialog's own elements positive instead of relying on the absence of an "outside" mark filtered through `focusedRef`. [`markTreeOutside`](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/dialog/utils/mark-tree-outside.ts#L40-L67) already receives the exact list of "inside" elements (dialog, persistent elements, nested dialog contents, and the disclosure for non-modal dialogs), and `setProperty` from `orchestrate.ts` already provides stacked, restorable expando marking. Concretely:

- In `mark-tree-outside.ts`, add an id-scoped `__ariakit-dialog-inside` expando: a `markElementInside(element, id)` helper (built on `setProperty`/`chain` like `markElement`), apply it to every non-null element passed to `markTreeOutside` (cleanups unshifted into the existing `cleanups` array so `restoreAccessibilityTree` unwinds them), and add an `isElementInside(element, id?)` helper that walks `parentElement` like `isElementMarked`.
- In `useEventOutside.onEvent` (`use-hide-on-interact-outside.ts`), check it *before* the `focused` gate:

```diff
       // Clicked on dialog's bounding box
       if (isMouseEventOnDialog(event, contentElement)) return;
+      // The dialog itself, persistent elements, and nested dialogs are marked
+      // as "inside" when the dialog opens. Events on them must never reach the
+      // outside listeners, regardless of whether the dialog has been focused
+      // yet (for example, with autoFocusOnShow={false}).
+      if (isElementInside(target, contentElement.id)) return;
       // We need to check if the content element has been focused at least once
       // before checking if it's marked. This is so hovercards and tooltips
       // don't stay open when new nodes are added to the DOM and focused.
       const focused = focusedRef.current;
       if (focused && !isElementMarked(target, contentElement.id)) return;
```

This preserves the hovercard/tooltip behavior from #6198 exactly: genuinely new DOM nodes carry neither mark, so they still trigger the close while the dialog is unfocused. When `focused` is true the new check is behaviorally redundant (inside elements were never marked outside, so the existing check already returned early). Both `markTreeOutside` call sites in `dialog.tsx` (modal and non-modal) are covered without changing their signatures.

*Found by an automated multi-agent audit of the repo at commit [`11bd4458d`](https://github.com/ariakit/ariakit/tree/11bd4458de6447b996dd882ea0c85eb801a6cd03) and verified with a real-browser Playwright reproduction (user-level interactions only).*
