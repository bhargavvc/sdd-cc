---
type: Fixed
pr: 3249
---
**`✓ SDD SDK ready` no longer prints when no persistent `sdd-sdk` shim exists** — the installer now requires durable reachability (not just transient npx PATH) and replaces stale legacy symlinks pointing at deprecated `sdd-tools.cjs`. Falls back to an actionable warning when login-shell PATH probing fails.
