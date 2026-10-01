# Fix the Vuetify interaction regression

Fix the reported bug in the Vuetify repository in `/workspace/repo`.

## Issue

`VAutocomplete` closes while its menu is being scrolled when menu transitions are disabled.

Environment reported by the issue:

- Vuetify 3.12.3
- Vue 3.5.34
- Linux

Reproduction:

1. Open the dropdown.
2. Scroll the dropdown with the mouse wheel, touch input, or the scrollbar.

Expected behavior: the menu remains open.

Actual behavior: the menu closes unexpectedly for `VAutocomplete` and `VCombobox`. For
`VSelect`, the menu remains open but the field loses focus.

The relevant project source and its locked dependencies are already available in the
working directory. Make the smallest maintainable source change that fixes the issue
without regressing the existing component behavior.

When finished, leave the repository with your changes applied and write the final patch
to `/logs/artifacts/model.patch`. If the working directory is a Git repository, generate
the patch with `git diff --binary` so that new files and binary changes are represented.
