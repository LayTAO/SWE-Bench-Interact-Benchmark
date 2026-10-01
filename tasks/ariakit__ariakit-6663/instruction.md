### Current behavior

`<Combobox autoSelect />` breaks Korean IME composition mid-syllable: the composing text is silently discarded and the last keystroke lands as a raw jamo.

Typing `사과` (사 = ㅅ + ㅏ, 과 = ㄱ + ㅘ) with a Korean 2벌식 IME produces `사ㅏ`.

- `t k` → input shows `사` (syllable 1 committed).
- `r h` → input shows `사고` (syllable 2 composing, still valid).
- The next keystroke `k` should transition the composition from `고` to `과`. Instead, the composition is aborted: `고` disappears and only `ㅏ` (a raw jamo) is inserted. Final value: `사ㅏ`.

Reproduces only when `autoSelect` is enabled. Without `autoSelect`, Korean input works correctly.

### Steps to reproduce the bug

Repro: https://stackblitz.com/edit/vitejs-vite-gor8d8hw?file=src%2FApp.tsx

1. Switch the OS keyboard to Korean (macOS: **한국어 - 2벌식**).
2. Focus the input and type `사과` (keys: `t k r h k`).
3. Observe: input shows `사고` after the fourth keystroke, then jumps to `사ㅏ` after the fifth. The consumer's `keyword` state (shown in the hint text) reflects the broken value.

https://github.com/user-attachments/assets/6d9ed9cc-9194-458a-a254-d6d21279bc8d

### Expected behavior

Typing `사과` produces the string `사과` in the input, with `autoSelect` continuing to highlight the first matching item — same as when `autoSelect` is off, or on non-CJK keyboards.
