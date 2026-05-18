---
type: Fixed
pr: 0
---

**Codex global install now produces discoverable `$sdd-*` skill surface** — `npx @bhargavvc/sdd-cc@latest --codex --global` was leaving Codex CLI users with `sdd/workflows/*.md` and `agents/sdd-*` on disk but no `~/.codex/skills/sdd-*/SKILL.md` files, so Codex 0.130.0 silently exposed zero `$sdd-*` commands after restart. The installer had been bypassing skill generation under the assumption that Codex auto-discovers from workflow/agent files; that assumption does not hold for the current Codex CLI. Re-wired the existing `copyCommandsAsCodexSkills()` helper into the Codex install dispatch path so it produces the same skill-shape as the Claude / Copilot / Antigravity / Cursor / Windsurf / Augment / Trae installs already do (one `skills/sdd-<name>/SKILL.md` per `commands/sdd/*.md`). Pre-existing user-owned non-`sdd-*` skill directories are preserved. Closes #3562.
