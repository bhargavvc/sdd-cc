---
type: Fixed
pr: 3462
---
**`/sdd-debug` session manager now dispatches via `Agent()`** — stale `Task()` invocation no longer collapses debugger work into inline execution.
