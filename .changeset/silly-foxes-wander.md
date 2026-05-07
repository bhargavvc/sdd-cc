---
type: Fixed
pr: 2990
---
sdd-code-fixer worktree no longer fails on the same-branch checkout — the agent now creates a new sdd-reviewfix/ branch via git worktree add -b and fast-forwards the user's branch on cleanup. See #2990.
