When focus is inside a wa-tree item, pressing Enter or Space throws an error and prevents the focused control from handling the key press. The key press should be handled by the focused control without changing tree selection.

Environment tools are preinstalled. From `/workspace/repo`, run `swe-bench-prepare`
to regenerate the public workspace dependencies and `swe-bench-test` to run the
focused development check. Additional test-runner flags can be appended. These
checks run the repository's existing tests and are separate from final evaluation.
