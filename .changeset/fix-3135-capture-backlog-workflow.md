---
type: Fixed
pr: 3135
---
**`/sdd-capture --backlog` now has a workflow to load** — PR #2824 consolidated `add-backlog` into the `--backlog` flag on `/sdd-capture` and wired `commands/sdd/capture.md` to delegate to `workflows/add-backlog.md` via `execution_context`. The workflow file was never created, leaving the routing with no implementation to load. Restores `sdd/workflows/add-backlog.md` with the full process from the deleted `commands/sdd/add-backlog.md`: find next 999.x slot via `phase.next-decimal`, write ROADMAP entry before creating the phase directory (preserving the #2280 ordering invariant), create `.planning/phases/{N}-{slug}/`, and commit. Also fixes `docs/INVENTORY.md` which incorrectly attributed `--backlog` routing to `add-todo.md`. Adds a broad regression test that every `execution_context` `@`-reference in any `commands/sdd/*.md` resolves to an existing workflow file, preventing this class of gap from silently re-appearing. Closes #3135.
