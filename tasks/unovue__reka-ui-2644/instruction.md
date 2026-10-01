### Environment

```bash
Developement/Production OS: Windows 11
Node version: 22.14.0
Package manager: pnpm@10.33.0
Reka UI version: 2.0.0
Vue version: 3.5.22
Nuxt version: 4.4.5
Nuxt mode: universal
Nuxt target: server
CSS framework: tailwindcss@4.1.18
Client OS: Windows 11
Browser: Chrome
```

### Link to minimal reproduction

https://stackblitz.com/edit/ptqnjfus-xg4dbzbv?file=src%2FApp.vue

### Steps to reproduce

Minimal SFC reproducing the stale `data-disabled`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxRoot, ListboxItem } from 'reka-ui'

const isDisabled = ref(false)
</script>

<template>
  <button @click="isDisabled = !isDisabled">
    toggle disabled (current: {{ isDisabled }})
  </button>

  <ListboxRoot>
    <ListboxItem :value="{ id: 1 }" :disabled="isDisabled">
      toggleable item
    </ListboxItem>
    <ListboxItem :value="{ id: 2 }">other item</ListboxItem>
  </ListboxRoot>
</template>
```

1. Mount the component, do **not** highlight or select the first item.
2. Click the button → `isDisabled` becomes `true`.
3. Inspect the first item in DevTools.

**Expected:** the element has `data-disabled="" disabled=""`.
**Actual:** both attributes are missing — the VNode is still the cached
one from `[isHighlighted=false, isSelected=false]`.

The downstream symptom in a `<ComboboxRoot>` is the keyboard navigation
snap-back described above: with one freshly-disabled item between two
non-disabled ones, `ArrowDown … ArrowDown` jumps back to
`collection[0]` instead of advancing.

### Describe the bug

## Summary

`<ListboxItem :disabled>` does not propagate a runtime change of its
`disabled` prop to the rendered DOM. The item's `data-disabled=""` and
`disabled=""` attributes go stale until something *also* changes
`isHighlighted` or `isSelected`.

Because `Listbox.getCollectionItem()` filters the navigable collection
purely by reading `dataset.disabled !== ""` from the live DOM, a stale
attribute makes a `disabled` item participate in keyboard navigation,
which causes the next `ArrowDown` to land on it, the *next-next*
`ArrowDown` to compute `indexOf(staleEl) === -1` and snap the highlight
back to `collection[0]`.

In a `<Combobox>` whose item set changes dynamically (the typical async
search dropdown) this manifests as **"every other ArrowDown jumps back
to the originally selected item"** as soon as a re-render shuffled a
non-disabled item out of and a disabled item into the same DOM slot
(common when the parent uses positional `:key`s, e.g. NuxtUI's
`InputMenu`).

## Affected file

[`packages/core/src/Listbox/ListboxItem.vue`](https://github.com/unovue/reka-ui/blob/v2/packages/core/src/Listbox/ListboxItem.vue#L79)

```vue
<Primitive
  :id="id"
  :ref="forwardRef"
  v-memo="[isHighlighted, isSelected]"           <!-- 👈 missing `disabled` -->
  role="option"
  :tabindex="rootContext.focusable.value ? isHighlighted ? '0' : '-1' : -1"
  :aria-selected="isSelected"
  :as="as"
  :as-child="asChild"
  :disabled="disabled ? '' : undefined"           <!-- 👈 inside cached VNode -->
  :data-disabled="disabled ? '' : undefined"     <!-- 👈 inside cached VNode -->
  :data-highlighted="isHighlighted ? '' : undefined"
  :data-state="isSelected ? 'checked' : 'unchecked'"
  ...
>
```

`v-memo` caches the rendered VNode and only re-evaluates it when one
of the listed dependencies changes. `disabled` is not listed, so a
prop change such as

```vue
<ListboxItem :disabled="someReactiveFlag" />
<!-- someReactiveFlag toggles false → true -->
```

never updates the DOM until `isHighlighted` or `isSelected` *also*
changes for that same item.

## Root cause

`v-memo`'s contract is *"only re-render if a listed dep changed"*.
Every reactive value used inside the wrapped expression must be in the
deps list. The current list omits both:

- `disabled` (used twice in attributes)
- `rootContext.focusable.value` (used in the `tabindex` ternary)

So any update to either is silently swallowed.

## Proposed fix

Extend the `v-memo` dependency list to cover everything that is read
inside the cached VNode:

```diff
- v-memo="[isHighlighted, isSelected]"
+ v-memo="[isHighlighted, isSelected, disabled, rootContext.focusable.value]"
```

## Notes for upstream

- A regression test could simply assert the rendered `disabled` /
  `data-disabled` attribute after a reactive toggle, with no highlight
  / selection change in between.
- Same caveat presumably applies to any other place in reka-ui where a
  `v-memo` block reads more than its listed deps — worth grepping for.

### Expected behavior

_No response_

### Context & Screenshots (if applicable)

_No response_
