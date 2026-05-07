---
type: Fixed
pr: 2973
---
/sdd-profile-user --refresh writes dev-preferences.md to ~/.claude/skills/sdd-dev-preferences/SKILL.md instead of the legacy commands/sdd/ directory. Installer migrates any preserved legacy file to the new location. See #2973.
