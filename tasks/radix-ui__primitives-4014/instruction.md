## Bug report

### Current Behavior

Starting in `@radix-ui/react-dismissable-layer@1.1.14` (shipped in `radix-ui@1.6.1`), on React 19.2.x, `DismissableLayer` calls stale `onEscapeKeyDown`/`onDismiss` handlers: it permanently uses the versions from its first render and ignores every updated handler passed after that. Escape behavior that depends on anything that changed since mount silently breaks — deterministically, on every mount.

1.1.13 behaves correctly.

Concrete failure: a Dialog that blocks Escape while a mutation is pending:

```tsx
<Dialog.Content
  onEscapeKeyDown={(event) => {
    if (isPending) event.preventDefault();
  }}
>
```

The handler always sees the mount-time `isPending` (`false`), so Escape dismisses the dialog mid-save. Handlers that do the same thing on every render (e.g. `onOpenChange={setOpen}`) keep working, which makes this easy to miss.

### Expected behavior

`onEscapeKeyDown`/`onDismiss` observe current props/state when Escape is pressed, as in 1.1.13.

### Reproducible example

The root cause is React's native `useEffectEvent`, which never refreshes its closure inside a `forwardRef` component. It reproduces without Radix:

```tsx
import * as React from "react";

const Plain = ({ value }: { value: number }) => {
  const onEvent = React.useEffectEvent(() => {
    console.log("plain sees", value);
  });
  React.useEffect(() => {
    const id = setInterval(onEvent, 1000);
    return () => clearInterval(id);
  }, []);
  return null;
};

const Forwarded = React.forwardRef<HTMLElement, { value: number }>(
  (props, _ref) => {
    const onEvent = React.useEffectEvent(() => {
      console.log("forwardRef sees", props.value);
    });
    React.useEffect(() => {
      const id = setInterval(onEvent, 1000);
      return () => clearInterval(id);
    }, []);
    return null;
  },
);
```

Render both with `value={1}`, re-render with `value={2}`: `Plain` logs `2`, `Forwarded` logs `1` forever.

`DismissableLayer` is `forwardRef`-wrapped, and since #3968 its Escape handling runs through `useEffectEvent` — so it's the `Forwarded` case.

### Suggested solution

Three ingredients line up; only the last one is new in 1.1.14:

- **React 19.2 (the underlying bug):** the native `useEffectEvent` never refreshes captured closures inside `ForwardRef` (or `SimpleMemoComponent`) fibers, because the commit-phase closure swap only runs for plain function components. Known upstream: facebook/react#34818, fixed in facebook/react#34831, but the fix was intentionally left out of 19.2.x patch releases (see facebook/react#35034) and currently exists only in 19.3 canaries, with no announced release date.
- **The shim (unchanged, standing behavior):** `@radix-ui/react-use-effect-event@0.0.3` delegates to the native hook whenever React provides one; its own ref-based fallback doesn't have this bug.
- **`react-dismissable-layer` 1.1.14 (the change):** #3968 moved `DismissableLayer`'s Escape handling from `useEscapeKeydown` onto the shim's `useEffectEvent`, connecting the two above. The 1.1.15 RCs don't touch the Escape path, so they inherit the bug.

```
1.1.13:  DismissableLayer ─ useEscapeKeydown ────────────── fresh handlers

1.1.14:  DismissableLayer ─ react-use-effect-event shim ─┬─ React ≥19.2: native useEffectEvent → STALE in forwardRef
                                                         └─ React ≤19.1: userland fallback    → fresh
```

Two possible fixes, both modeled on prior fixes here:

1. **Shim-level:** have `@radix-ui/react-use-effect-event` prefer its userland fallback until React ships facebook/react#34831 in a stable release. This would also cover any other `forwardRef`-wrapped primitives using the shim on React 19.2.x.
2. **Package-level:** the same staleness class was fixed in `one-time-password-field` by #3831 (replace `useEffectEvent` with `useCallback` + a ref); the same change looks like it would apply to `DismissableLayer`.

### Additional context

Found via a CI test that asserts a dialog stays open on Escape while a save is pending; it failed on a Dependabot bump from `radix-ui` 1.6.0 → 1.6.1. Bisecting the chain: `@radix-ui/react-dialog` 1.1.17 → 1.1.18 has no source diff (dep repin only); the only real code change is `react-dismissable-layer` 1.1.13 → 1.1.14.

I used Claude with Fable 5 to help bisect and diagnose this; I've verified the staleness behavior, the version diffs, and the React commit-phase mechanism against the published artifacts myself.

### Your environment

| Software         | Name(s)                                      | Version        |
| ---------------- | -------------------------------------------- | -------------- |
| Radix Package(s) | radix-ui / @radix-ui/react-dismissable-layer | 1.6.1 / 1.1.14 |
| React            | react, react-dom                             | 19.2.7         |
| Browser          | n/a (repro'd in jsdom)                       | —              |
| Assistive tech   | n/a                                          | —              |
| Node             | node                                         | 24.15.0        |
| npm/yarn/pnpm    | pnpm                                         | 10.33.2        |
| Operating System | macOS                                        | 26             |
