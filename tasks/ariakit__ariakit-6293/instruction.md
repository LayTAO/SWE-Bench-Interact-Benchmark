### Current behavior

[`FormPush`](https://ariakit.com/reference/form-push) documents that "the newly added input will be automatically focused when the button is clicked", but with the default [`autoFocusOnClick`](https://ariakit.com/reference/form-push#autofocusonclick) two things go wrong:

1. **Array with existing values:** clicking the button focuses the **previous** last field instead of the newly added one. Typing right after the click silently edits existing data.
2. **Array that starts empty:** the click focuses nothing — and auto-focus is permanently dead for that button afterwards. Later clicks add fields but never focus them.

The root cause is in [`useFormPush`](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-react-components/src/form/form-push.tsx#L92-L101): the click handler arms a `shouldFocus` boolean and an effect reads `store.getState().items` exactly once. Since item registration was batched in #3295 ([`collection-store.ts#L87-L94`](https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-components/src/collection/collection-store.ts#L87-L94)), registration writes a private store that is only synced to the public `items` in a `queueMicrotask`, which cannot run before the effect flush in which the focus effect executes. So the effect always observes the pre-click items: the "last item" is the old field, and for an empty array there is no match at all, so `shouldFocus` is never cleared and every later `setShouldFocus(true)` is a no-op.

### Steps to reproduce the bug

1. Open https://stackblitz.com/github/ariakit/ariakit/tree/main/templates/react?file=src%2Fapp.tsx
2. Replace `src/app.tsx` with the code below.
3. Click **Add tag**: the caret lands in the existing `tags.0` input instead of the new `tags.1` (the "Focused field" output shows `tags.0`).
4. Click **Add email** twice: focus stays on the button both times; `emails.0` and `emails.1` are created but never focused.

```tsx
import * as Ariakit from "@ariakit/react";
import { useState } from "react";

export default function App() {
  const form = Ariakit.useFormStore({
    defaultValues: {
      tags: ["React"],
      emails: [] as string[],
    },
  });

  const tags = Ariakit.useStoreState(form, (state) => state.values.tags);
  const emails = Ariakit.useStoreState(form, (state) => state.values.emails);

  const [focused, setFocused] = useState("none");

  return (
    <Ariakit.Form store={form}>
      <output>Focused field: {focused}</output>

      <fieldset>
        <legend>Tags</legend>
        {tags.map((_, index) => {
          const name = `tags.${index}`;
          return (
            <Ariakit.FormInput
              key={index}
              name={name}
              aria-label={name}
              onFocus={() => setFocused(name)}
            />
          );
        })}
        <Ariakit.FormPush name="tags" value="">
          Add tag
        </Ariakit.FormPush>
      </fieldset>

      <fieldset>
        <legend>Emails</legend>
        {emails.map((_, index) => {
          const name = `emails.${index}`;
          return (
            <Ariakit.FormInput
              key={index}
              name={name}
              aria-label={name}
              onFocus={() => setFocused(name)}
            />
          );
        })}
        <Ariakit.FormPush name="emails" value="">
          Add email
        </Ariakit.FormPush>
      </fieldset>
    </Ariakit.Form>
  );
}
```

Reproduced in Chromium with real-pointer Playwright tests (no mocks; plain `click()` on the buttons): `expect(textbox("tags.1")).toBeFocused()` and `expect(textbox("emails.0")).toBeFocused()` both fail on current code, while probes asserting the wrong destination — `tags.0` focused, and the "Add email" button keeping focus across two clicks — pass.

### Expected behavior

Clicking `FormPush` focuses the field that the click created — `tags.1` in the first scenario, then `emails.0` and `emails.1` in the second — as the documentation states.

### Workaround

Disable `autoFocusOnClick` and focus the field the push will create. `pushValue` appends, so the new field's index is the array length read *before* the push (the consumer `onClick` runs before `FormPush` pushes the value):

```tsx
const focusNewField = (name: string) => {
  const length = form.getValue<string[]>(name)?.length ?? 0;
  requestAnimationFrame(() => {
    const selector = `input[name="${CSS.escape(`${name}.${length}`)}"]`;
    document.querySelector<HTMLElement>(selector)?.focus();
  });
};

<Ariakit.FormPush
  name="tags"
  value=""
  autoFocusOnClick={false}
  onClick={() => focusNewField("tags")}
>
  Add tag
</Ariakit.FormPush>
```

With this applied, the same Playwright assertions above pass in both scenarios.

### Possible solutions

Subscribe the effect to `items` (e.g. via `useStoreState`) and target the **exact index** the click is expected to create instead of "the last field". The effect then bails (without clearing the flag) until the just-registered field is published by the microtask flush, re-runs on the resulting re-render, and focuses the right element — deterministically, with no timing dependence:

```diff
     const name = String(nameProp);
-    const [shouldFocus, setShouldFocus] = useState(false);
+    const [focusIndex, setFocusIndex] = useState<number | null>(null);
+    const items = useStoreState(store, "items");

     useEffect(() => {
-      if (!shouldFocus) return;
-      const items = getFirstFieldsByName(store?.getState().items, name);
-      const element = items?.[items.length - 1]?.element;
+      if (focusIndex == null) return;
+      const fields = getFirstFieldsByName(items, name);
+      const prefix = `${name}.`;
+      const field = fields.find((item) => {
+        const index = item.name.slice(prefix.length).match(/^\d+/)?.[0];
+        return index != null && Number.parseInt(index, 10) === focusIndex;
+      });
+      const element = field?.element;
+      // The just-pushed field registers in the private collection store and
+      // is only flushed to the public `items` in a microtask. Bail without
+      // clearing the flag so the effect re-runs once the flush re-renders.
       if (!element) return;
       element.focus();
-      setShouldFocus(false);
-    }, [store, shouldFocus, name]);
+      setFocusIndex(null);
+    }, [items, focusIndex, name]);
@@
     const onClick = useEvent((event: MouseEvent<HTMLType>) => {
       onClickProp?.(event);
       if (event.defaultPrevented) return;
+      const length = store?.getValue<unknown[]>(name)?.length ?? 0;
       store?.pushValue(name, value);
       if (!autoFocusOnClick) return;
-      setShouldFocus(true);
+      setFocusIndex(length);
     });
```

`store.getValue(name)?.length ?? 0` covers the empty-array case, which is exactly what fixes the permanent latch. `FormRemove` is unaffected — it reads `items` synchronously inside the click handler, where every involved field was registered (and flushed) in earlier commits.

---

*Found by an automated multi-agent audit of the repo at commit [`11bd4458d`](https://github.com/ariakit/ariakit/tree/11bd4458de6447b996dd882ea0c85eb801a6cd03) and verified with a real-browser Playwright reproduction (user-level clicks only).*
