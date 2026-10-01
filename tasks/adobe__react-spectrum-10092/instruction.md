### Provide a general summary of the issue here

When `<FileTrigger>` is nested inside `<DropZone>`, clicking the FileTrigger's button focuses `DropZone`'s internal visually-hidden accessibility button. If the DropZone has any positioned (`position: relative`/`absolute`/`fixed`) ancestor that is **also** an `overflow-y: auto` scroll container; a very common pattern (modals, scrollable cards, side-panels). The browser's "scroll the focused element into view" behavior then scrolls that ancestor by hundreds of pixels to chase the hidden button. The user perceives the surrounding layout jumping far from where they clicked.

Here's a quick video demonstrating the issue (reproducer in https://github.com/dennisameling/react-aria-components-bug):

https://github.com/user-attachments/assets/f2839541-4c8b-4ee2-91a6-a02ea4a15c37

### 🤔 Expected Behavior?

Clicking the visible `<Button>` inside `<FileTrigger>`:

1. Opens the native file picker.
2. Leaves keyboard focus on the visible FileTrigger button (or wherever it was before the click).
3. Does **not** scroll the surrounding layout.

### 😯 Current Behavior

After the click:

- `document.activeElement` is the DropZone's visually-hidden accessibility button (`<button aria-label="DropZone">`) — **not** the visible FileTrigger button the user clicked.
- The nearest scrollable ancestor's `scrollTop` jumps by hundreds of pixels (Chrome's `scrollIntoView` on the newly focused element). Magnitude scales with the in-flow position of the DropZone within the scroller. Observed: **-274 px** in the standalone reproducer, **+718 px** in a real-world modal.

Event timeline captured with `focusin` / `focusout` / `mousedown` / `click` listeners (capture phase):

```
t=7681.4  pointerdown   on visible Button ("Click to upload")
t=7684.3  mousedown     on visible Button
t=7685.0  focusin       on visible Button
t=7730.4  click         on visible Button             ← user's actual click
t=7731.1  click         on INPUT (type=file)          ← FileTrigger's input.click()
t=7731.3  focusout      on visible Button
t=7731.5  focusin       on BUTTON aria-label="DropZone"   ← hidden button stole focus
```

Captured `getBoundingClientRect` numbers from the reproducer:

| | scrollTop | hidden button viewport y | scroller visible region |
|---|---|---|---|
| BEFORE click | 632.5 | 131.5 (above region) | [206, 606] |
| AFTER click  | 358.5 | 405.5 (now inside)   | [206, 606] |

`delta = -274 px`, `activeIsHiddenBtn = true`. Chrome scrolled the container exactly enough to align the (clipped) hidden button into view.

### Mechanism

1. `mousedown` / `mouseup` / `click` fire on the visible `<Button>`.
2. `FileTrigger`'s `PressResponder` calls `inputRef.current.click()` on the hidden `<input type="file" style="display:none">` it renders alongside the trigger button.
3. That programmatic `input.click()` dispatches a click event on the input. The input is a sibling of FileTrigger's children inside the `<DropZone>`, so the click bubbles up to the DropZone div.
4. `DropZone`'s `onClick` walk-up loop runs on `event.target = <input type="file">`:

   ```ts
   // packages/react-aria-components/src/DropZone.tsx
   onClick: (e) => {
     let target = getEventTarget(e);
     while (target && nodeContains(dropzoneRef.current, target)) {
       if (isFocusable(target)) break;
       else if (target === dropzoneRef.current) {
         buttonRef.current?.focus();
         break;
       }
       target = target.parentElement;
     }
   }
   ```

5. `isFocusable(input)` returns **false** because `display: none` fails `Element.checkVisibility({ visibilityProperty: true })` inside `react-aria`'s `isFocusable`.
6. The loop walks up through non-focusable wrappers until `target === dropzoneRef.current`, where the fallback fires: `buttonRef.current?.focus()` — focusing the visually-hidden `<button aria-label="DropZone">` at the top of the DropZone subtree.
7. Chrome dispatches `scrollIntoView` on the newly focused element. With `position: absolute` + `clip-path: inset(50%)`, the hidden button's in-flow position is the top of the DropZone's flex column; Chrome scrolls the nearest scrollable ancestor whose visible region doesn't contain that position.

### Why a positioned ancestor matters

`DropZone`'s visually-hidden button uses `position: absolute` with no offsets. Without any positioned ancestor, its containing block is the viewport, its position is fixed in viewport coords at layout time, and Chrome's `scrollIntoView` uses the viewport as the scroll context — so the scroller doesn't scroll. **With** a positioned ancestor that is *also* `overflow-y: auto` (typical of modals, popovers, scrollable cards), the button's containing block resolves to that ancestor, and Chrome scrolls it to bring the (clipped) button into view.

### 💁 Possible Solution

Listed from least to most invasive — any one would resolve the symptom:

1. **`FileTrigger`** stops propagation on its synthetic input click:

   ```ts
   onPress: () => {
     const input = inputRef.current;
     if (!input) return;
     if (input.value) input.value = '';
     // Prevent the synthetic click bubbling into ancestors like DropZone.
     input.addEventListener('click', (e) => e.stopPropagation(), { once: true, capture: true });
     input.click();
   }
   ```

   Most targeted — the bubbling click is itself a side-effect of FileTrigger's own intentional `input.click()` and shouldn't be observable to DropZone at all. *(Untested patch — submitted as a starting point, not a verified fix.)*

2. **`DropZone`'s** onClick ignores clicks whose target is a hidden file input (or more generally, any element that `display: none` makes non-focusable — those clicks are almost always programmatic and shouldn't trigger the keyboard-fallback focus management).

3. **`DropZone`'s** hidden button uses `position: fixed; top: 0; left: 0` (or `pointer-events: none` until it is actually the active drag-and-drop keyboard fallback target) so focusing it cannot scroll an ancestor.

### 🔦 Context

Hit in production while filing a Special-creation modal. Users clicked the upload button and the modal jumped 700+ px upward, hiding the field they'd been working on. Workaround applied downstream:

> Replaced `DropZone` + `FileTrigger` with a plain `<div>` using native HTML5 drag-and-drop events (`onDragEnter` / `onDragOver` / `onDragLeave` / `onDrop`) and a hidden `<input type="file">` opened via `inputRef.current.click()` directly from a regular `onClick` handler. No focusable hidden button → nothing for Chrome to scroll into view. Keyboard accessibility preserved (Tab focuses the visible button; Enter/Space presses it).

The downstream workaround works but means giving up the React Aria drag-and-drop affordances (`useDrop` keyboard fallback, focus management, ARIA wiring).

### 🖥️ Steps to Reproduce

The bug requires:

1. A `<DropZone>` containing a `<FileTrigger>` with a `<Button>`.
2. An ancestor that is **both** `overflow-y: auto` (a scroll container) **and** positioned (e.g. `position: relative`) — so the hidden button's `position: absolute` containing block resolves to a scrolling element, not the viewport.
3. The scroll container scrolled to a position where the hidden button (which sits at the top of the DropZone in normal flow) is **outside the visible region** of the scroll container.

Self-contained reproducer:

```tsx
import { Button, DropZone, FileTrigger } from "react-aria-components";

export function DropZoneScrollBug() {
  return (
    <div
      // position: relative + overflow: auto is the trigger combination.
      // Modals, scrollable cards, side panels typically have both.
      style={{
        position: "relative",
        height: 400,
        width: 500,
        overflowY: "auto",
        border: "2px solid #444",
        padding: 16,
      }}
    >
      <div style={{ height: 500, background: "#eef", padding: 8 }}>
        Filler 1 — scroll down past this so the DropZone's top is above the
        visible region but the FileTrigger button below is still visible.
      </div>

      <DropZone
        style={{
          margin: "16px 0",
          padding: 24,
          border: "1px dashed #888",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        {/* Inner filler pushes the visible button toward the bottom of the
            DropZone so the hidden button at the top can be scrolled
            out-of-view independently. */}
        <div style={{ height: 300, background: "#cce", padding: 8 }}>
          Inner filler — the DropZone's hidden accessibility button sits at
          the very top of this region.
        </div>
        <FileTrigger
          acceptedFileTypes={["image/*"]}
          onSelect={(files) => console.log("selected", files)}
        >
          <Button>Click to upload</Button>
        </FileTrigger>
        <p style={{ marginTop: 8, fontSize: 12 }}>or drag a file here</p>
      </DropZone>

      <div style={{ height: 800, background: "#fee", padding: 8 }}>
        Filler 2 — content below the DropZone.
      </div>
    </div>
  );
}
```

**Steps:**

1. Render `<DropZoneScrollBug />`.
2. Scroll the outer 400-px box down so "Click to upload" is roughly mid-view (the inner blue filler at the top of the DropZone is scrolled off above).
3. In DevTools, capture:

   ```js
   const s = [...document.querySelectorAll('div')].find(d => d.style.overflowY === 'auto');
   const hidden = document.querySelector('button[aria-label="DropZone"]');
   const sr = s.getBoundingClientRect();
   const hr = hidden.getBoundingClientRect();
   console.log({ before: { scrollTop: s.scrollTop, hiddenTop: hr.top, scrollerTop: sr.top, scrollerBottom: sr.bottom } });
   window._before = s.scrollTop;
   ```

4. Click "Click to upload". Press **Escape** to dismiss the OS file picker.
5. Run:

   ```js
   const s = [...document.querySelectorAll('div')].find(d => d.style.overflowY === 'auto');
   const hidden = document.querySelector('button[aria-label="DropZone"]');
   console.log({ after: { scrollTop: s.scrollTop, hiddenTop: hidden.getBoundingClientRect().top }, delta: s.scrollTop - window._before, activeIsHiddenBtn: document.activeElement === hidden });
   ```

**Expected:** `delta = 0`, `activeIsHiddenBtn = false`.
**Actual:** `delta` is hundreds of pixels (sign depending on whether the hidden button was above or below the visible region), `activeIsHiddenBtn = true`.

### Version

`react-aria-components@1.17.0` (DropZone + FileTrigger code unchanged on `main` at time of writing). React `19.2.6`, React DOM `19.2.6`.

### What browsers are you seeing the problem on?

Chrome, Safari, Microsoft Edge, Firefox

### If other, please specify.

_No response_

### What operating system are you using?

macOS (Darwin 25.5.0)

### 🧢 Your Company/Team

N/A

### 🕷 Tracking Issue

N/A
