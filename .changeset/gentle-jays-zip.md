---
type: Added
pr: 3399
---
**Installer migrations now handle legacy Codex hooks cleanup transactionally** - SDD-owned hooks.json entries are removed through the migration runner with runtime filtering, rollback, and checksum drift protection.
