---
type: Fixed
pr: 0
---

**Installer migration no longer hangs `/sdd:update` on leftover SDD-looking files** — non-TTY installer runs now default-resolve `prompt-user` migration actions by classification (stale SDK build artifacts under `sdd/sdk/{dist,src}/sdd-*` default to `remove`; user-facing `skills/sdd-*/SKILL.md` defaults to `keep`) and log each resolution. Anything that cannot be safely defaulted still blocks, but the error message now groups blocked paths by reason, lists the documented choices, and names the `SDD_INSTALLER_MIGRATION_RESOLVE` env var as the non-interactive resolution surface. (#3541)
