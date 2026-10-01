### Provide a general summary of the issue here

I was working on creating a Dialog implementation from React Aria and noticed this weird bug that happens from time to time. Every so often, the focus management would break. After further investigation, it appears to be related to the `runAfterTransition` via `focusSafety`.

For example, when a user clicks on a button (such as a close button) that starts a transition, the container may suddenly become unmounted. If the transition doesn't finish, `transitionend` doesn't get called and the `focusSafety` gets stuck in a queue. When that happens, FocusScope no longer moves focus to within the scope and no longer restores it.


### 🤔 Expected Behavior?

FocusScope should always move focus when mounted, and restore focus when unmounted.

### 😯 Current Behavior

When an element is triggering a transition and is suddenly removed, FocusScope no longer moves focus when mounted and does not restore focus when unmounted.

### 💁 Possible Solution

One solution could be to loop through the elements in `transitionsByElement`, check whether they are still in the DOM, and when absent, remove them.

```
function removeRemovedElements() {
  for (const [element] of transitionsByElement) {
    if (element instanceof HTMLElement && !document.contains(element)) {
      transitionsByElement.delete(element);
    }
  }
}

export function runAfterTransition(fn: () => void): void {
  // Wait one frame to see if an animation starts, e.g. a transition on mount.
  requestAnimationFrame(() => {
    removeRemovedElements();
    // If no transitions are running, call the function immediately.
    // Otherwise, add it to a list of callbacks to run at the end of the animation.
    if (transitionsByElement.size === 0) {
      fn();
    } else {
      transitionCallbacks.add(fn);
    }
  });
}
```

### 🔦 Context

_No response_

### 🖥️ Steps to Reproduce

https://github.com/user-attachments/assets/14123d49-2f74-47ac-9cf9-193eeebcde61

Using keyboard, trigger open. Once opened, trigger `Close` to interrupt the transition.

https://codesandbox.io/p/sandbox/exciting-cookies-v9lwc5

### Version

3.20.1

### What browsers are you seeing the problem on?

Chrome

### If other, please specify.

_No response_

### What operating system are you using?

MacOS

### 🧢 Your Company/Team

_No response_

### 🕷 Tracking Issue

_No response_
