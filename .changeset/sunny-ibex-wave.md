---
type: Removed
pr: 3299
---
**`sdd-intel-updater` no longer emits a vestigial "Layout detection returned 'unknown'" line on non-SDD-framework projects** — the layout-detection bash block is now gated on a positive framework-repo check (package.json name = "@bhargavvc/sdd-cc"), so ordinary user projects skip the step silently.
