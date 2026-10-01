# Evaluation protocol

1. Select a task from `tasks.jsonl`.
2. Pull the task's `agent_environment.image` by digest.
3. Run the Agent with only the released instruction and base environment.
4. Export the complete production-code change as a patch.
5. Submit the patch to the benchmark maintainers or an authorized evaluator.
6. The private evaluator runs the canonical interaction check plus the official
   F2P and P2P suites associated with the published SHA-256 commitments.

An official pass requires all required checks to pass.  Agent-authored tests and
reproductions are diagnostic evidence and do not replace the private evaluator.

The public Agent image does not contain the gold patch or hidden evaluator.  The
private verifier image is intentionally not named or distributed in this release.
