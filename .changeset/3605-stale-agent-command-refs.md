---
type: Fixed
issue: 3605
---
**Agent contracts no longer reference retired `/sdd-research-phase` or `/sdd-insert-phase`** — six surviving references in `agents/sdd-executor.md`, `agents/sdd-phase-researcher.md`, `agents/sdd-planner.md`, `agents/sdd-research-synthesizer.md`, and `agents/sdd-roadmapper.md` are replaced with `/sdd:plan-phase --research-phase <N>` and `/sdd:phase insert`. Adds a regression guard (`tests/bug-3605-stale-research-insert-phase-agent-refs.test.cjs`) that fails when any retired command name reappears in `agents/*.md` — covers the gap that let #3029, #3044, and #3131 miss the `agents/` directory.
