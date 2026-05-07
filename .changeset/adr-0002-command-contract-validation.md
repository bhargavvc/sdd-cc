---
type: Changed
pr: 3152
---
**Command contract validation now enforced in CI (ADR-0002)** — \`scripts/lint-command-contract.cjs\` runs as a pre-test step and validates every \`commands/sdd/*.md\` file against five rules: \`name:\` present + \`sdd:\` prefix, \`description:\` non-empty, \`allowed-tools:\` entries canonical, \`execution_context\` @-refs resolve on disk, @-refs on their own line. Prevents the \`add-backlog.md\`-class gap from silently reappearing on consolidation PRs.

**~900 tokens/invocation recovered** — prose \`@~/.claude/sdd/...\` path tokens removed from \`<process>\` blocks in 39 command files. The \`<execution_context>\` block is now the single authoritative load declaration; the duplicate prose copies were inert but consumed context on every command invocation.

**~3,750 tokens removed from eager session load** — \`/sdd-debug\` (9,603 → 1,703 chars) and \`/sdd-thread\` (7,868 → 585 chars) now follow the workflow-delegation pattern used by all other commands. Their implementations moved to \`sdd/workflows/debug.md\` and \`sdd/workflows/thread.md\`. Behavior is unchanged.

\`sdd/workflows/extract_learnings.md\` renamed to \`extract-learnings.md\` to match the hyphen convention of all other workflow files. Closes #3151.
