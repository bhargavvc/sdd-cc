---
type: Fixed
pr: 3318
---
**`detect-custom-files` now scans `skills/`** — SDK port omitted `skills` from `SDD_MANAGED_DIRS`, so user-added skills under `<config-dir>/skills/<name>/` were never detected and got silently destroyed during `/sdd-update` (no entry written to `sdd-user-files-backup/`). One-line parity with `bin/sdd-tools.cjs`. (#3317)
