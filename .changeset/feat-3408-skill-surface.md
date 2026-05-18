---
type: Added
pr: 3408
---
**Runtime skill surface toggle (`/sdd:surface`)** — new slash command lets users enable/disable skill clusters and switch profiles without reinstalling. Sub-commands: `list` (show enabled/disabled skills + token cost), `status` (list + profile summary), `profile <name>` (apply a named profile), `disable/enable <cluster>` (toggle one of 10 named clusters), `reset` (return to install-time profile). State persists to `~/.claude/skills/.sdd-surface.json` independently of the install-time `.sdd-profile` marker. Backed by `surface.cjs` engine and `clusters.cjs` cluster definitions (ADR-0011 Phase 2, Option B). (#3408)
