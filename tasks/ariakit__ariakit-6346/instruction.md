### Current behavior

When tabs are composed with a select or combobox — the documented composition used by the [Select with Combobox and Tabs](https://ariakit.com/examples/select-combobox-tab) and [Combobox with Tabs](https://ariakit.com/examples/combobox-tabs) examples — calling `setSelectedId` (for example from a cross-link button inside a tab panel, or any programmatic/controlled `selectedId` change) switches the selected tab and panel, but the documented `activeId` sync is silently skipped: the newly selected tab does not become the active composite item (no `data-active-item`, roving `tabindex` stays `-1`), and the focus move promised by the [`setSelectedId`](https://ariakit.com/reference/use-tab-store) docs ("If another tab has DOM focus and the selected tab is enabled, focus will move to the selected tab") never happens.

This is deterministic, not a race: it affects the **first** `setSelectedId` call after the tab store initializes and after **every** popover toggle in which `selectedId` didn't change. A second identical call works. Click and arrow-key tab switching are unaffected (those paths write `activeId` through DOM focus before `selectedId` changes), which is why the shipped examples don't catch it.

The root cause is a leaked one-shot suppression flag in the tab store. The `selectedId` → `activeId` sync is a batch listener guarded by `syncActiveId`:

https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-components/src/tab/tab-store.ts#L148-L177

The flag is armed unconditionally right before restoring `selectedId` when the select/combobox popover toggles `mounted`:

https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-components/src/tab/tab-store.ts#L217-L243

But `setState` early-returns when the value is unchanged, producing no batch event to consume the flag:

https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-store/src/index.ts#L385-L391

And since `sync` invokes its listener immediately on registration (https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-store/src/index.ts#L301-L305), `restoreSelectedId` runs once at every store init right after `backupSelectedId` — a guaranteed no-op restore that arms the flag and leaks it. The same leak recurs on each `mounted` toggle where `selectedId` is already the backed-up value. The next legitimate `selectedId` change is then swallowed by the suppression branch. A second, related failure mode: batch flushes are microtask-coalesced (https://github.com/ariakit/ariakit/blob/11bd4458de6447b996dd882ea0c85eb801a6cd03/packages/ariakit-store/src/index.ts#L451-L455), so a real restore that shares a flush with a later legitimate `setSelectedId` suppresses the legitimate change too.

### Steps to reproduce the bug

1. Go to https://stackblitz.com/github/ariakit/ariakit/tree/main/templates/react?file=src%2Fapp.tsx
2. Replace `src/app.tsx` with the code below.
3. Click the **Grocery** select button to open the popover. The **Fruits** tab is selected.
4. Click the **Browse vegetables** button inside the Fruits panel.
5. The Vegetables tab gets selected (`aria-selected="true"`, the panel switches), but it never becomes the active item: no red `data-active-item` outline appears on it and its `tabindex` stays `-1`. Clicking **Browse fruits** next works correctly (the Fruits tab gets the active outline), showing the one-shot nature of the bug. The same failure repeats on the first tab switch after closing and reopening the popover.

```tsx
import * as Ariakit from "@ariakit/react";

function BrowseTabButton(props: { tabId: string; children: string }) {
  const tab = Ariakit.useTabContext();
  return (
    <button onClick={() => tab?.setSelectedId(props.tabId)}>
      {props.children}
    </button>
  );
}

export default function App() {
  return (
    <>
      <style>{`[data-active-item] { outline: 2px solid red; }`}</style>
      <Ariakit.SelectProvider defaultValue="Apple" virtualFocus={false}>
        <Ariakit.SelectLabel>Grocery</Ariakit.SelectLabel>
        <Ariakit.Select />
        <Ariakit.SelectPopover
          gutter={4}
          sameWidth
          style={{ background: "white", border: "1px solid gray", padding: 8 }}
        >
          <Ariakit.TabProvider defaultSelectedId="tab-fruits">
            <Ariakit.TabList aria-label="Categories">
              <Ariakit.Tab id="tab-fruits">Fruits</Ariakit.Tab>
              <Ariakit.Tab id="tab-vegetables">Vegetables</Ariakit.Tab>
            </Ariakit.TabList>
            <Ariakit.TabPanel tabId="tab-fruits">
              <Ariakit.SelectList>
                <Ariakit.SelectItem value="Apple" />
                <Ariakit.SelectItem value="Banana" />
              </Ariakit.SelectList>
              <BrowseTabButton tabId="tab-vegetables">
                Browse vegetables
              </BrowseTabButton>
            </Ariakit.TabPanel>
            <Ariakit.TabPanel tabId="tab-vegetables">
              <Ariakit.SelectList>
                <Ariakit.SelectItem value="Carrot" />
                <Ariakit.SelectItem value="Potato" />
              </Ariakit.SelectList>
              <BrowseTabButton tabId="tab-fruits">
                Browse fruits
              </BrowseTabButton>
            </Ariakit.TabPanel>
          </Ariakit.TabProvider>
        </Ariakit.SelectPopover>
      </Ariakit.SelectProvider>
    </>
  );
}
```

This was verified with a real-browser Playwright test using only user-level interactions (clicks), asserting `data-active-item`/`tabindex` on the tab elements; the identical cross-link button on a plain `TabProvider` passes as a control.

### Expected behavior

Per the `setSelectedId` documentation, setting the `selectedId` state should keep the `activeId` state in sync (and move focus when another tab has DOM focus). After clicking **Browse vegetables**, the Vegetables tab should become the active item — exactly what happens with a plain `TabProvider`, and what happens on the *second* `setSelectedId` call in the select composition.

### Workaround

Call `setActiveId` alongside `setSelectedId` to perform the sync manually:

```tsx
function BrowseTabButton(props: { tabId: string; children: string }) {
  const tab = Ariakit.useTabContext();
  return (
    <button
      onClick={() => {
        tab?.setSelectedId(props.tabId);
        // Workaround for the swallowed setSelectedId -> activeId sync.
        tab?.setActiveId(props.tabId);
      }}
    >
      {props.children}
    </button>
  );
}
```

(Or use `tab.select(id)` if always moving focus to the tab is acceptable.)

### Possible solutions

Arm the suppression only when the restore will actually produce a batch event, and have the listener verify that the flushed value is the restored one, so a coalesced flush that also contains a later legitimate change still syncs. Resetting the flag at setup time also prevents a restore armed right before store destruction from leaking into the next init:

```diff
-  let syncActiveId = true;
+  let pendingRestore = false;
+  let restoredSelectedId: TabStoreState["selectedId"];

   // Keep activeId in sync with selectedId.
   setup(tab, () =>
     batch(tab, ["selectedId"], (state, prev) => {
-      if (!syncActiveId) {
-        syncActiveId = true;
-        return;
-      }
+      // Skip the sync only when this flush corresponds to restoring the
+      // selectedId state from a select or combobox selected value. Batch
+      // listeners are microtask-coalesced, so a restore can share a flush
+      // with a later legitimate change; in that case we must still sync.
+      if (pendingRestore) {
+        pendingRestore = false;
+        if (state.selectedId === restoredSelectedId) return;
+      }
@@
   setup(tab, () => {
+    pendingRestore = false;
     const backupSelectedId = () => {
       selectedIdFromSelectedValue = tab.getState().selectedId;
     };
     const restoreSelectedId = () => {
-      syncActiveId = false;
+      const { selectedId } = tab.getState();
+      // setState early-returns on unchanged values and produces no batch
+      // event, so only arm the suppression when the restore will actually
+      // change the state.
+      if (selectedId === selectedIdFromSelectedValue) return;
+      pendingRestore = true;
+      restoredSelectedId = selectedIdFromSelectedValue;
       tab.setState("selectedId", selectedIdFromSelectedValue);
     };
```

One side effect to verify: today the init-time leak also swallows the very first `selectedId` batch event (typically the automatic `undefined` → first enabled tab assignment). Un-masking that flush means an `activeId` write at init can propagate to the parent select/combobox store (`activeId` is a shared key), so the first open of a combobox-with-tabs composition with uncontrolled `selectedId` should be checked; if that write turns out to be undesirable there, the sync should be guarded explicitly (e.g. while the parent popover is closed) rather than relying on the accidental swallow.

*Found by an automated multi-agent audit of the repo at commit [`11bd4458d`](https://github.com/ariakit/ariakit/tree/11bd4458de6447b996dd882ea0c85eb801a6cd03) and verified with a real-browser Playwright reproduction (user-level interactions only).*
