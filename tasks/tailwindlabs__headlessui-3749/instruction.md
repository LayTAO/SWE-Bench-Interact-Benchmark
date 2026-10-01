# Headless UI MenuButton Programmatic Click Issue

<!-- Please provide all of the information requested below. We're a small team and without all of this information it's not possible for us to help and your bug report will be closed. -->

**What package within Headless UI are you using?**

@headlessui/react

**What version of that package are you using?**

v2.2.0 (based on the package.json showing @headlessui/react: ^2.2.0)

**What browser are you using?**

Chrome, Safari, Firefox (all browsers)

**Reproduction URL**

https://codesandbox.io/s/github/tailwindlabs/reproduction-headlessui-react

**Describe your issue**

I'm experiencing an issue where programmatic clicks on Headless UI's `MenuButton` component are not working. When I call `buttonRef.current.click()` on a `MenuButton` element, the menu does not open even though the button element exists and is properly referenced.

**Steps to reproduce:**

1. Create a `MenuButton` component with a ref
2. Try to programmatically trigger the menu by calling `buttonRef.current.click()`
3. The menu does not open despite the button element being present

**Expected behavior:**

The menu should open when `buttonRef.current.click()` is called, similar to how a regular HTML button would respond to programmatic clicks.

**Actual behavior:**

The menu does not open. The button element exists and can be clicked manually by the user, but programmatic clicks via `.click()` method are ignored.

**Code example:**

```tsx
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { useRef, useMount } from 'react'

function MyComponent() {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useMount(() => {
    // This doesn't work - menu doesn't open
    setTimeout(() => {
      buttonRef.current?.click()
    }, 1000)
  })

  return (
    <Menu>
      <MenuButton ref={buttonRef}>
        Open Menu
      </MenuButton>
      <MenuItems>
        <MenuItem>Option 1</MenuItem>
        <MenuItem>Option 2</MenuItem>
      </MenuItems>
    </Menu>
  )
}
```

**Workaround:**

I've found that using controlled state works:

```tsx
const [isOpen, setIsOpen] = useState(false)

<Menu open={isOpen} onOpenChange={setIsOpen}>
  <MenuButton ref={buttonRef}>
    Open Menu
  </MenuButton>
  {/* ... */}
</Menu>

// Then use setIsOpen(true) instead of buttonRef.current.click()
```

**Question:**

Is this the intended behavior? Should programmatic clicks on `MenuButton` components be supported, or is the controlled state approach the recommended way to programmatically open menus?
