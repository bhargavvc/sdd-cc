---
type: Fixed
pr: 3385
---

**Worktree cleanup now uses a per-wave manifest and fails closed** — `/sdd-execute-phase`, `/sdd-quick`, debug issue diagnosis, and workspace removal no longer broad-scan active agent worktrees or continue after cleanup failures that could lose work. (#3384)
