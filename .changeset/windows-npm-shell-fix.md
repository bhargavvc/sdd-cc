---
type: Fixed
pr: 3102
---

**Windows update-check no longer silently fails** — `sdd-check-update-worker` now passes `shell: true` only on Windows, allowing `execFileSync('npm', ...)` to resolve `npm.cmd` via PATHEXT. POSIX path (Linux/macOS) is unchanged. Without this fix, the worker failed with ENOENT, `latest` stayed `null`, `update_available` became `null`, and the statusline `⬆ /sdd-update` indicator never rendered for Windows users. Fixes #3103.
