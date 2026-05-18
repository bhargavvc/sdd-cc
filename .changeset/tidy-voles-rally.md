---
type: Fixed
pr: 3582
---
**Locked Codex skill-materialization contract** — added a regression test for the SDD 1.42.2 failure where Codex global install completed successfully but printed `Skipped Codex skill-copy generation (Codex discovers official skills directly)` and left users with no routable `$sdd-*` entrypoints in Codex CLI 0.130.0+. The fix shipped in #3562 (Codex install now materializes `$CODEX_HOME/skills/sdd-<name>/SKILL.md` for every shipped command); this test pins the contract so the regression cannot silently come back.
