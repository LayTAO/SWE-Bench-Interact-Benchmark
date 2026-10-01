### Environment

```bash
Developement/Production OS: Windows 10 19043.1110
Node version: 16.0.0
Package manager: pnpm@8.6.0
Reka UI version: 2.0.0
Vue version: 3.0.0
Nuxt version: 3.0.0
Nuxt mode: universal
Nuxt target: server
CSS framework: tailwindcss@3.3.3
Client OS: Windows 10 19043.1110
Browser: Chrome 90.0.4430.212
```

### Link to minimal reproduction

https://reka-ui.com/docs/components/dialog#content

### Steps to reproduce

Open any dialog with `<dialog-content :disableOutsidePointerEvents="false">` and you'll see that the body stills receive the `style="pointer-events: none;"`, even tought the docs says that the prop exists.

### Describe the bug

According to the docs bellow, the dialog content should be able to receive the `disableOutsidePointerEvents` prop.

<img width="753" height="475" alt="Image" src="https://github.com/user-attachments/assets/c9f25a27-bcaf-412f-8eac-fee249e85f2e" />


But what actually happens is that the `DialogContentModal`, used by the `DialogContent` overrides it.


My suggestion is to change the code bellow to use `withDefaults` (`const props = withDefaults( defineProps<DialogContentImplProps>(), { disableOutsidePointerEvents: true })`) and remove the `:disable-outside-pointer-events="true"` allowing the `DialogContent` to actually receive and pass forward the prop.

<img width="925" height="469" alt="Image" src="https://github.com/user-attachments/assets/626f760a-65d0-49f1-8e35-0ed0764d7e31" />

### Expected behavior

The `DialogContent` to receive  and actually pass the `disableOutsidePointerEvents` prop forward.

### Context & Screenshots (if applicable)

_No response_
