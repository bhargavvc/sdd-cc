---
type: Changed
pr: 3042
---
**`/sdd-research-phase` consolidated into `/sdd-plan-phase --research-phase <N>`** — the standalone research command's slash-command stub was never registered (#3042). Rather than restore the orphan, the research-only capability now lives as a flag on `/sdd-plan-phase`. New modifiers: `--view` prints existing `RESEARCH.md` to stdout without spawning, `--research` forces refresh, otherwise prompts `update / view / skip` when `RESEARCH.md` already exists. Also scrubs four other stale slash-command references (`/sdd-check-todos`, `/sdd-new-workspace`, `/sdd-status`, residual `/sdd-plan-milestone-gaps`) across English + 4 localized doc sets (#3044). Closes #3042 and #3044.
